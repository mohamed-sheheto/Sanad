import os
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from extracted_modules.real_estate_model_module import RealEstateModel

MODEL_PATH = Path("./models/saved/real_estate")
MODEL_PATH.mkdir(parents=True, exist_ok=True)

logger.info("Creating RealEstateModel...")
model = RealEstateModel(city="Cairo", start_date="2018-01-01")

logger.info("Downloading/generating data...")
model.download_data()
logger.info(f"Data shape: {model.data.shape}")

logger.info("Preparing data...")
x_train, y_train, x_test, y_test = model.prepare_data()
logger.info(f"Train: {x_train.shape}, Test: {x_test.shape}")

logger.info("Building model...")
model.build_model()

logger.info("Training model (this may take a few minutes)...")
model.train(x_train, y_train, epochs=100, batch_size=32)

logger.info("Evaluating...")
metrics = model.evaluate(x_test, y_test)
logger.info(f"RMSE: {metrics['rmse']:.2f}, MAPE: {metrics['mape']:.2f}%, Accuracy: {metrics['accuracy']:.2f}%")

logger.info(f"Saving model to {MODEL_PATH}...")
model.save(MODEL_PATH)
logger.info("Model seeded successfully!")

from extracted_modules.real_estate_data import RealEstateDataLoader
loader = RealEstateDataLoader()
loader.load()
sample_price = loader.get_city_stats("Cairo")["mean_psqm"]
roi, predicted_price = model.predict_roi(sample_price)
logger.info(f"Sanity check: price={sample_price:.0f}, predicted={predicted_price:.0f}, ROI={roi:.2f}%")
