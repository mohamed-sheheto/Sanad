import os

os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'  

import logging
import threading
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta

from fastapi import FastAPI, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ConfigDict
from dotenv import load_dotenv
import yfinance as yf
import numpy as np
import pandas as pd

from extracted_modules.gold_model_module import GoldModel
from extracted_modules.stock_model_module import StockModel
from extracted_modules.real_estate_model_module import RealEstateModel
from extracted_modules.real_estate_data import RealEstateDataLoader, FRONTEND_CITIES
from extracted_modules.model_cache import is_cache_valid, load_model, save_model

class ModelNotReadyError(Exception):
    pass


def _print_training(msg: str):
    print(f"\n*** [TRAINING] {msg} ***\n")
    logger.info(msg)


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

MODEL_PATH = os.getenv("MODEL_PATH", "./models")
PORT = int(os.getenv("PORT", 8001))
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
EXPRESS_SERVER_URL = os.getenv("EXPRESS_SERVER_URL", "http://localhost:8000")

STOCK_NAMES = {
    'COMI.CA': 'CIB',
    'TMGH.CA': 'Talaat Moustafa Group',
    'FWRY.CA': 'Fawry',
    'SWDY.CA': 'El Sewedy Electric',
    'ISPH.CA': 'Ibnsina Pharma',
    'ETEL.CA': 'Telecom Egypt',
    'EGAL.CA': 'Egypt Aluminum',
}

def get_mock_stock_data(ticker_symbol: str, current_price: float = 100.0):
    """Generate mock data when yfinance fails"""
    mock_prices = {
        'COMI.CA': 85.50,
        'FWRY.CA': 42.30,
        'TMGH.CA': 28.75,
        'SWDY.CA': 63.20,
        'ISPH.CA': 15.90,
        'ETEL.CA': 22.45,
        'EGAL.CA': 35.60,
    }
    
    base_price = mock_prices.get(ticker_symbol, current_price)
    
    months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    historical_prices = []
    chart_data = []
    
    for i, month in enumerate(months):
        variation = (i - 3) * 0.02
        price = round(base_price * (1 + variation), 2)
        
        historical_prices.append({
            "date": f"{month} 2024",
            "open": round(price * 0.98, 2),
            "close": price,
            "volume": int(1000000 * (1 + i * 0.1))
        })
        chart_data.append({"month": month, "price": price})
    
    return historical_prices, chart_data, base_price

class HistoricalDataPoint(BaseModel):
    date: str
    open: float
    close: float
    volume: int
    high: Optional[float] = None
    low: Optional[float] = None

class ChartDataPoint(BaseModel):
    month: str
    price: float

class GoldHistoryResponse(BaseModel):
    prediction: float
    historical_prices: List[HistoricalDataPoint]
    chart_data: List[ChartDataPoint]
    volatility: float
    current_price: Optional[float] = None

class PredictRequest(BaseModel):
    model_config = ConfigDict(json_schema_extra={
        "example": {"value": 1250.5}
    })
    
    value: float = Field(..., description="Input value for prediction", gt=0)
    stock: str = Field(default="COMI.CA", description="Stock ticker (for stock predictions). Options: COMI.CA, TMGH.CA, FWRY.CA, SWDY.CA, ISPH.CA, ETEL.CA, EGAL.CA")
    city: str = Field(default="Cairo", description="City name (for real estate predictions)")
    property_type: str = Field(default="Apartment", description="Property type (for real estate predictions)")

class PredictResponse(BaseModel):
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "asset": "gold",
            "stock_type": "gold",
            "input_value": 1250.5,
            "prediction": 1275.32,
        }
    })
    
    asset: str = Field(..., description="Asset type")
    stock_type: str = Field(..., description="Type of stock (gold or stock)")
    input_value: float = Field(..., description="Input price value")
    prediction: float = Field(..., description="Predicted next price (input + model prediction)")

class StockHistoryResponse(BaseModel):
    prediction: float
    historical_prices: List[Dict[str, Any]]
    chart_data: List[Dict[str, Any]]
    current_price: float
    ticker_name: str

class RealEstateHistoryResponse(BaseModel):
    prediction: float
    priceTrend: List[Dict[str, Any]]
    propertyTypes: List[Dict[str, Any]]
    marketStats: Dict[str, Any]
    currentPrice: float

def fetch_gold_historical_data(days_back: int = 180): 
    try:
        ticker = yf.Ticker("GC=F")
        hist_data = ticker.history(period="6mo", interval="1d")
        
        if hist_data.empty:
            return [], [], 0.0, None
        
        monthly_summary = hist_data.resample('MS').agg({
            'Open': 'first',
            'Close': 'last',
            'Volume': 'sum'
        }).dropna()
        
        historical_prices = []
        chart_data = []
        for index, row in monthly_summary.iterrows():
            month_str = index.strftime('%b %Y')
            price = round(float(row['Close']), 2)
            
            historical_prices.append(HistoricalDataPoint(
                date=month_str,
                open=round(float(row['Open']), 2),
                close=price,
                volume=int(row['Volume'])
            ))
            
            chart_data.append(ChartDataPoint(
                month=month_str,
                price=price
            ))
        
        returns = hist_data['Close'].pct_change().dropna()
        volatility = round(float(returns.std() * np.sqrt(252) * 100), 2)
        current_price = round(float(hist_data['Close'].iloc[-1]), 2)
        
        return historical_prices, chart_data, volatility, current_price
    except Exception as e:
        logger.error(f"Error fetching gold data: {e}")
        # بدل ما نرجع None اللي بتبوظ الـ UI، هنرجع 0.0 كأمان
        return [], [], 0.0, 0.0

class ModelRegistry:
    def __init__(self, model_path: str):
        self.model_path = Path(model_path)
        self.models: Dict[str, Any] = {}
        self.model_info: Dict[str, Dict[str, str]] = {}
        self.model_states: Dict[str, str] = {}
        self.stock_models_cache: Dict[str, Any] = {} 
        self.current_stock_ticker: str = 'COMI.CA'

    def init_all_assets(self):
        _print_training("Starting model initialization...")
        self._init_asset('gold', GoldModel(ticker='GC=F', start_date='2013-01-01'), {
            'type': 'Gold', 'ticker': 'GC=F'
        })
        self._init_asset('stock', StockModel(ticker=self.current_stock_ticker, start_date='2015-01-01'), {
            'type': 'Stock',
            'ticker': self.current_stock_ticker,
            'name': STOCK_NAMES.get(self.current_stock_ticker, self.current_stock_ticker)
        })
        self._init_asset('real_estate', RealEstateModel(city='Cairo', start_date='2018-01-01'), {
            'type': 'RealEstate', 'city': 'Cairo'
        })

    def _get_cache_dir(self, asset: str, ticker: Optional[str] = None) -> Path:
        if asset == 'gold':
            return self.model_path / 'saved' / 'gold'
        if asset == 'real_estate':
            return self.model_path / 'saved' / 'real_estate'
        sub = ticker or self.current_stock_ticker
        return self.model_path / 'saved' / 'stocks' / sub

    def _init_asset(self, asset: str, model_obj, info: dict):
        cache_dir = self._get_cache_dir(asset)
        self.model_info[asset] = info

        if is_cache_valid(cache_dir):
            if model_obj.load(cache_dir):
                self.models[asset] = model_obj
                if asset == 'stock':
                    self.stock_models_cache[self.current_stock_ticker] = model_obj
                self.model_states[asset] = 'ready'
                _print_training(f"{asset} model loaded from cache (fresh) — ready")
                return

        has_stale = False
        if cache_dir.exists():
            has_stale = model_obj.load(cache_dir)
            if has_stale:
                _print_training(f"{asset} cache is stale, loaded old weights for serving during retrain")
                if asset == 'stock':
                    self.stock_models_cache[self.current_stock_ticker] = model_obj
            else:
                _print_training(f"{asset} cache directory exists but corrupt, will train from scratch")

        self.models[asset] = model_obj
        self.model_states[asset] = 'loading'
        _print_training(f"{asset} background training started (ETA ~2-3 minutes)...")
        thread = threading.Thread(
            target=self._train_model_bg,
            args=(asset, model_obj, None),
            daemon=True
        )
        thread.start()

    def _train_model_bg(self, asset: str, model, ticker: Optional[str] = None):
        try:
            if ticker:
                model.ticker = ticker
                model.ticker_name = StockModel._get_ticker_name(ticker)
                model.start_date = '2015-01-01'
            _print_training(f"{asset} downloading data...")
            model.download_data()
            _print_training(f"{asset} preparing data...")
            x_train, y_train, x_test, y_test = model.prepare_data()
            _print_training(f"{asset} building model...")
            model.build_model()
            _print_training(f"{asset} training model (this takes the longest)...")
            model.train(x_train, y_train)
            cache_dir = self._get_cache_dir(asset, ticker)
            model.save(cache_dir)
            self.model_states[asset] = 'ready'
            _print_training(f"{asset} model trained and cached successfully — READY")
        except Exception as e:
            self.model_states[asset] = 'error'
            _print_training(f"{asset} TRAINING FAILED: {e}")
            logger.error(f"Background training failed for {asset}: {e}", exc_info=True)

    def set_stock_ticker(self, ticker: str):
        if ticker not in STOCK_NAMES:
            available = ", ".join(STOCK_NAMES.keys())
            raise ValueError(f"Invalid ticker '{ticker}'. Available stocks: {available}")

        if ticker != self.current_stock_ticker:
            logger.info(f"Switching stock from {self.current_stock_ticker} to {ticker}")
            self.current_stock_ticker = ticker

            if ticker in self.stock_models_cache:
                model = self.stock_models_cache[ticker]
                self.models['stock'] = model
                self.model_states['stock'] = 'ready' if model.is_trained else 'loading'
                self.model_info['stock'] = {
                    'type': 'Stock',
                    'ticker': ticker,
                    'name': STOCK_NAMES.get(ticker, ticker)
                }
                logger.info(f"Using cached model for {STOCK_NAMES.get(ticker, ticker)}")
                return

            cache_dir = self._get_cache_dir('stock', ticker)
            stock_model = StockModel(ticker=ticker, start_date='2015-01-01')

            if is_cache_valid(cache_dir):
                if stock_model.load(cache_dir):
                    self.stock_models_cache[ticker] = stock_model
                    self.models['stock'] = stock_model
                    self.model_states['stock'] = 'ready'
                    self.model_info['stock'] = {
                        'type': 'Stock', 'ticker': ticker,
                        'name': STOCK_NAMES.get(ticker, ticker)
                    }
                    logger.info(f"Loaded {STOCK_NAMES.get(ticker, ticker)} from cache")
                    return

            if cache_dir.exists():
                was_loaded = stock_model.load(cache_dir)
                if was_loaded:
                    _print_training(f"Loaded stale cache for {STOCK_NAMES.get(ticker, ticker)}")

            self.stock_models_cache[ticker] = stock_model
            self.models['stock'] = stock_model
            self.model_states['stock'] = 'loading'
            self.model_info['stock'] = {
                'type': 'Stock', 'ticker': ticker,
                'name': STOCK_NAMES.get(ticker, ticker)
            }

            _print_training(f"background training started for {STOCK_NAMES.get(ticker, ticker)}...")
            thread = threading.Thread(
                target=self._train_model_bg,
                args=('stock', stock_model, ticker),
                daemon=True
            )
            thread.start()

    def predict(self, asset: str, value: float, stock_ticker: str = None) -> float:
        if asset not in self.models:
            raise ModelNotReadyError(f"Model '{asset}' is still initializing, please try again in a moment")

        state = self.model_states.get(asset, 'error')
        if state == 'error':
            raise ModelNotReadyError(f"{asset} model training failed and is unavailable")

        if asset == 'stock' and stock_ticker:
            self.set_stock_ticker(stock_ticker)

        model = self.models[asset]

        if state == 'loading' and not model.is_trained:
            raise ModelNotReadyError(f"{asset} model is still training in background, please try again later")

        try:
            prediction = model.predict(value)
            return float(prediction)
        except Exception as e:
            logger.error(f"Prediction failed for {asset}: {e}", exc_info=True)
            raise ModelNotReadyError(f"Prediction failed for {asset}: {e}")

    def get_loaded_models(self) -> list:
        return list(self.models.keys())
    
    def get_model_info(self, asset: str) -> Dict[str, str]:
        info = self.model_info.get(asset, {})
        state = self.model_states.get(asset, 'unknown')
        info['state'] = state
        return info
    
    def get_available_stocks(self) -> Dict[str, str]:
        return STOCK_NAMES

app = FastAPI(
    title="Sanad ML Service",
    description="ML model serving API for predictions",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        FRONTEND_URL,
        EXPRESS_SERVER_URL,
        "http://localhost:3000",
        "http://localhost:8000",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model_registry: Optional[ModelRegistry] = None

@app.on_event("startup")
async def startup():
    global model_registry
    _print_training("Server started — initializing models in background...")
    try:
        model_registry = ModelRegistry(MODEL_PATH)
        model_registry.init_all_assets()
        _print_training(f"Model registry initialized with {len(model_registry.get_loaded_models())} models")
    except Exception as e:
        _print_training(f"Failed to initialize model registry: {e}")
        logger.error(f"Failed to initialize model registry: {e}", exc_info=True)
        model_registry = None

def _compute_prediction(asset: str, value: float, model_registry_obj, stock_ticker=None):
    if asset == 'real_estate':
        predicted_price = model_registry_obj.predict(asset, value, None)
        roi = ((predicted_price - value) / value) * 100
        return round(roi, 2)
    predicted_change = model_registry_obj.predict(asset, value, stock_ticker)
    return round(value + predicted_change, 2)

@app.post("/predict/{asset}", response_model=PredictResponse)
async def predict(asset: str, request: PredictRequest):
    if not model_registry:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model registry not initialized"
        )

    try:
        stock_ticker = request.stock if asset == 'stock' else None
        final_prediction = _compute_prediction(asset, request.value, model_registry, stock_ticker)
        
        model_info = model_registry.get_model_info(asset)
        stock_type = model_info.get('name', model_info.get('type', asset))
        
        return PredictResponse(
            asset=asset,
            stock_type=stock_type,
            input_value=request.value,
            prediction=final_prediction,
        )
    except ModelNotReadyError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Model inference failed"
        )

@app.get("/predict/{asset}", response_model=PredictResponse)
async def predict_get(asset: str, value: float, stock: str = "COMI.CA", city: str = "Cairo", property_type: str = "Apartment"):
    if not model_registry:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model registry not initialized"
        )

    try:
        stock_ticker = stock if asset == 'stock' else None
        final_prediction = _compute_prediction(asset, value, model_registry, stock_ticker)
        
        model_info = model_registry.get_model_info(asset)
        stock_type = model_info.get('name', model_info.get('type', asset))
        
        return PredictResponse(
            asset=asset,
            stock_type=stock_type,
            input_value=value,
            prediction=final_prediction,
        )
    except ModelNotReadyError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Model inference failed"
        )

@app.get("/gold/history", response_model=GoldHistoryResponse)
async def get_gold_history():
    try:
        historical_prices, chart_data, volatility, current_price = fetch_gold_historical_data()
        
        # تأكد إن السعر مش None قبل ما تكمل
        if current_price is None or current_price == 0:
             # ممكن نستخدم سعر تقريبي لو الـ API وقع عشان الـ UI ميفصلش
            current_price = 2300.0 
            logger.warning("Using fallback price because yfinance returned None/Zero")

        input_value = current_price
        
        if model_registry:
            # هنحط try/except صغيرة هنا عشان التوقع ميبوظش الـ Endpoint كلها
            try:
                predicted_change = model_registry.predict('gold', input_value, None)
                final_prediction = input_value + predicted_change
            except Exception as e:
                logger.error(f"Prediction inner error: {e}")
                final_prediction = input_value * 1.01 # توقع افتراضي بسيط
        else:
            final_prediction = input_value * 1.05
            
        return GoldHistoryResponse(
            prediction=round(final_prediction, 2),
            historical_prices=historical_prices,
            chart_data=chart_data,
            volatility=volatility,
            current_price=current_price
        )
    except Exception as e:
        logger.error(f"Endpoint Error: {e}")
        # أهم سطر: رجع رسالة واضحة بدل ما تسيب الـ 500 عايمة
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@app.get("/models")
async def list_models():
    if not model_registry:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model registry not initialized"
        )

    models_info = {}
    for m in model_registry.get_loaded_models():
        models_info[m] = model_registry.get_model_info(m)
    return {"models": models_info}

@app.get("/stocks", response_model=Dict[str, Dict[str, str]])
async def list_stocks():
    if not model_registry:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model registry not initialized"
        )

    return {"stocks": model_registry.get_available_stocks()}

@app.get("/stocks/history/{ticker_symbol}", response_model=StockHistoryResponse)
async def get_stock_history(
    ticker_symbol: str,
    manual_price: Optional[float] = Query(None)
):
    try:
        # التعديل هنا: لازم نجبر السيرفر يغير الموديل بناءً على الـ ticker_symbol اللي جاي في الـ URL
        if model_registry:
            model_registry.set_stock_ticker(ticker_symbol) #
            logger.info(f"Switched model to {ticker_symbol} for this request")

        else:
            logger.warning("Model registry not available")

        historical_prices = []
        chart_data = []
        current_price = 0.0
        use_mock = False

        try:
            ticker = yf.Ticker(ticker_symbol)
            hist_data = ticker.history(period="6mo", interval="1d")

            if hist_data.empty:
                logger.warning(f"No data from yfinance for {ticker_symbol}, using mock data")
                use_mock = True
            else:
                hist_data = hist_data.dropna(subset=['Close'])
                if len(hist_data) < 10:
                    logger.warning(f"Insufficient data from yfinance for {ticker_symbol}, using mock data")
                    use_mock = True
                else:
                    current_price = round(float(hist_data['Close'].iloc[-1]), 2)
                    monthly_resampled = hist_data.resample('MS').agg({
                        'Open': 'first',
                        'Close': 'last',
                        'Volume': 'sum'
                    }).dropna()
                    
                    for index, row in monthly_resampled.iterrows():
                        month_label = index.strftime('%b %Y')
                        price_val = round(float(row['Close']), 2)
                        
                        historical_prices.append({
                            "date": month_label,
                            "open": round(float(row['Open']), 2),
                            "close": price_val,
                            "volume": int(row['Volume'])
                        })
                        chart_data.append({"month": month_label, "price": price_val})
        except Exception as e:
            logger.error(f"yfinance error for {ticker_symbol}: {e}, using mock data")
            use_mock = True

        if use_mock:
            historical_prices, chart_data, current_price = get_mock_stock_data(ticker_symbol)
            logger.info(f"Using mock data for {ticker_symbol}")

        # Use manual_price if provided, otherwise use current_price
        prediction_input = manual_price if manual_price is not None else current_price
        logger.info(f"Prediction input for {ticker_symbol}: {prediction_input} (manual: {manual_price is not None})")

        prediction_val = 0.0
        try:
            if model_registry:
                # Predict using the correct model for this ticker
                prediction_val = model_registry.predict('stock', prediction_input, ticker_symbol)
                if prediction_val == 0.0 or prediction_val is None or prediction_val < 0:
                    raise ValueError("Invalid prediction value")
                logger.info(f"Prediction successful for {ticker_symbol}: {prediction_val}")
            else:
                raise ValueError("Model registry not available")
        except Exception as e:
            logger.error(f"Prediction failed for {ticker_symbol}: {e}")
            prediction_val = prediction_input * 0.02
            logger.info(f"Using fallback prediction change for {ticker_symbol}: +{prediction_val}")

        final_prediction = prediction_input + prediction_val

        return StockHistoryResponse(
            prediction=round(float(final_prediction), 2),
            historical_prices=historical_prices,
            chart_data=chart_data,
            current_price=current_price,
            ticker_name=STOCK_NAMES[ticker_symbol]
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Stock Endpoint Error: {e}")
        mock_ticker = ticker_symbol if 'ticker_symbol' in locals() else 'COMI.CA'
        mock_historical, mock_chart, mock_price = get_mock_stock_data(mock_ticker)
        return StockHistoryResponse(
            prediction=round(mock_price * 1.02, 2),
            historical_prices=mock_historical,
            chart_data=mock_chart,
            current_price=mock_price,
            ticker_name=STOCK_NAMES.get(mock_ticker, 'Unknown')
        )

@app.get("/real-estate/history", response_model=RealEstateHistoryResponse)
async def get_real_estate_history(
    city: str = Query("Cairo", description="City name"),
    property_type: str = Query("Apartment", description="Property type")
):
    try:
        loader = RealEstateDataLoader()
        loader.load()

        price_trend = loader.get_price_trend(city)
        property_types = loader.get_type_stats()
        market_stats = loader.get_market_stats(city)
        stats = loader.get_city_stats(city)
        current_price = round(stats.get("mean_psqm", 15000), 0)

        prediction_roi = market_stats["averageROI"]
        if model_registry:
            try:
                predicted_price = model_registry.predict("real_estate", float(current_price), None)
                prediction_roi = round(((predicted_price - current_price) / current_price) * 100, 2)
            except Exception as e:
                logger.warning(f"Real estate prediction failed, using historical ROI: {e}")

        return RealEstateHistoryResponse(
            prediction=prediction_roi,
            priceTrend=price_trend,
            propertyTypes=property_types,
            marketStats=market_stats,
            currentPrice=float(current_price),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Real estate history error: {e}")
        return RealEstateHistoryResponse(
            prediction=8.5,
            priceTrend=[{"month": "Jan", "price": 4200}, {"month": "Feb", "price": 4350}],
            propertyTypes=[],
            marketStats={"averageROI": 8.5, "marketGrowth": 12.2},
            currentPrice=4400,
        )

@app.get("/real-estate/cities")
async def list_real_estate_cities():
    return {"cities": FRONTEND_CITIES}

@app.get("/", include_in_schema=False)
async def root():
    return {
        "message": "Sanad ML Service",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
        "gold_history": "/gold/history",
        "real_estate_history": "/real-estate/history",
    }

@app.get("/health")
async def health_check():
    model_states = {}
    model_info = {}
    if model_registry:
        for m in model_registry.get_loaded_models():
            info = model_registry.get_model_info(m)
            model_states[m] = info.get('state', 'unknown')
    return {
        "status": "healthy",
        "model_registry": model_registry is not None,
        "models_loaded": model_registry.get_loaded_models() if model_registry else [],
        "model_states": model_states
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=PORT,
        log_level="info"
    )