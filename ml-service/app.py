import os

os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'  

import logging
from pathlib import Path
from typing import Dict, Any

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ConfigDict
from dotenv import load_dotenv

from extracted_modules.gold_model_module import GoldModel
from extracted_modules.stock_model_module import StockModel

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


class PredictRequest(BaseModel):
    model_config = ConfigDict(json_schema_extra={
        "example": {"value": 1250.5}
    })
    
    value: float = Field(..., description="Input value for prediction", gt=0)
    stock: str = Field(default="COMI.CA", description="Stock ticker (for stock predictions). Options: COMI.CA, TMGH.CA, FWRY.CA, SWDY.CA, ISPH.CA, ETEL.CA, EGAL.CA")


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


# Model registry
class ModelRegistry:
    def __init__(self, model_path: str):
        self.model_path = Path(model_path)
        self.models: Dict[str, Any] = {}
        self.model_info: Dict[str, Dict[str, str]] = {}
        self.stock_models_cache: Dict[str, Any] = {} 
        self.current_stock_ticker: str = 'COMI.CA'
        self._load_models()

    def _load_models(self):
        """Initialize model instances"""
        try:
            logger.info("Initializing models from model modules")
            
            gold_model = GoldModel(ticker='GC=F', start_date='2013-01-01')
            self.models['gold'] = gold_model
            self.model_info['gold'] = {'type': 'Gold', 'ticker': 'GC=F'}
            logger.info("Gold model initialized")
            
            stock_model = StockModel(ticker=self.current_stock_ticker, start_date='2015-01-01')
            self.stock_models_cache[self.current_stock_ticker] = stock_model
            self.models['stock'] = stock_model
            self.model_info['stock'] = {
                'type': 'Stock',
                'ticker': self.current_stock_ticker,
                'name': STOCK_NAMES.get(self.current_stock_ticker, self.current_stock_ticker)
            }
            logger.info(f"Stock model initialized with {STOCK_NAMES.get(self.current_stock_ticker, self.current_stock_ticker)}")
            
        except Exception as e:
            logger.error(f"Failed to initialize models: {e}", exc_info=True)

    def set_stock_ticker(self, ticker: str):
        if ticker not in STOCK_NAMES:
            available = ", ".join(STOCK_NAMES.keys())
            raise ValueError(f"Invalid ticker '{ticker}'. Available stocks: {available}")
        
        if ticker != self.current_stock_ticker:
            logger.info(f"Switching stock from {self.current_stock_ticker} to {ticker}")
            self.current_stock_ticker = ticker
            
            if ticker not in self.stock_models_cache:
                logger.info(f"Creating new model for {STOCK_NAMES.get(ticker, ticker)}")
                stock_model = StockModel(ticker=ticker, start_date='2015-01-01')
                self.stock_models_cache[ticker] = stock_model
            else:
                logger.info(f"Using cached model for {STOCK_NAMES.get(ticker, ticker)}")
            
            self.models['stock'] = self.stock_models_cache[ticker]
            self.model_info['stock'] = {
                'type': 'Stock',
                'ticker': ticker,
                'name': STOCK_NAMES.get(ticker, ticker)
            }
            logger.info(f"Stock model switched to {STOCK_NAMES.get(ticker, ticker)}")

    def predict(self, asset: str, value: float, stock_ticker: str = None) -> float:
        """Make prediction using specified model"""
        if asset not in self.models:
            available = ", ".join(self.models.keys())
            raise ValueError(
                f"Model '{asset}' not found. Available models: {available}"
            )

        try:
            if asset == 'stock' and stock_ticker:
                self.set_stock_ticker(stock_ticker)
            
            model = self.models[asset]
            
            if not hasattr(model, 'scaler') or model.scaler is None:
                logger.info(f"First time loading {asset} model, preparing data...")
                model.download_data()
                x_train, y_train, x_test, y_test = model.prepare_data()
                model.build_model()
                logger.info(f"Training {asset} model... (this may take a few minutes)")
                model.train(x_train, y_train)
                logger.info(f"{asset} model trained successfully")
            
            prediction = model.predict(value)
            return float(prediction)
        except Exception as e:
            logger.error(f"Prediction failed for {asset}: {e}", exc_info=True)
            raise

    def get_loaded_models(self) -> list:
        return list(self.models.keys())
    
    def get_model_info(self, asset: str) -> Dict[str, str]:
        """Get model metadata"""
        return self.model_info.get(asset, {})
    
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

try:
    model_registry = ModelRegistry(MODEL_PATH)
    logger.info(f"Model registry initialized with {len(model_registry.models)} models")
except Exception as e:
    logger.error(f"Failed to initialize model registry: {e}", exc_info=True)
    model_registry = None


@app.post("/predict/{asset}", response_model=PredictResponse)
async def predict(asset: str, request: PredictRequest):
    if not model_registry:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model registry not initialized"
        )

    try:
        stock_ticker = request.stock if asset == 'stock' else None
        predicted_change = model_registry.predict(asset, request.value, stock_ticker)
        final_prediction = request.value + predicted_change
        
        model_info = model_registry.get_model_info(asset)
        stock_type = model_info.get('name', model_info.get('type', asset))
        
        return PredictResponse(
            asset=asset,
            stock_type=stock_type,
            input_value=request.value,
            prediction=final_prediction,
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
async def predict_get(asset: str, value: float, stock: str = "COMI.CA"):
    if not model_registry:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model registry not initialized"
        )

    try:
        stock_ticker = stock if asset == 'stock' else None
        predicted_change = model_registry.predict(asset, value, stock_ticker)
        final_prediction = value + predicted_change
        
        model_info = model_registry.get_model_info(asset)
        stock_type = model_info.get('name', model_info.get('type', asset))
        
        return PredictResponse(
            asset=asset,
            stock_type=stock_type,
            input_value=value,
            prediction=final_prediction,
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

@app.get("/models", response_model=Dict[str, list])
async def list_models():
    if not model_registry:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model registry not initialized"
        )

    return {"models": model_registry.get_loaded_models()}


@app.get("/stocks", response_model=Dict[str, Dict[str, str]])
async def list_stocks():
    """Get available stocks for prediction"""
    if not model_registry:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model registry not initialized"
        )

    return {"stocks": model_registry.get_available_stocks()}


@app.get("/", include_in_schema=False)
async def root():
    return {
        "message": "Sanad ML Service",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=PORT,
        log_level="info"
    )
