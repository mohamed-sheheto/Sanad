import json
import logging
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional, Tuple, Dict, Any

import joblib
import numpy as np
import tensorflow as tf

logger = logging.getLogger(__name__)


def save_model(
    model: tf.keras.Model,
    scaler,
    last_prices: np.ndarray,
    asset_dir: Path,
    extra_metadata: Optional[Dict[str, Any]] = None,
):
    asset_dir.mkdir(parents=True, exist_ok=True)

    model_path = asset_dir / "model.keras"
    model.save(model_path)
    logger.info(f"Model saved to {model_path}")

    scaler_path = asset_dir / "scaler.joblib"
    joblib.dump(scaler, scaler_path)

    last_prices_path = asset_dir / "last_prices.npy"
    np.save(last_prices_path, last_prices)

    metadata = {
        "cached_at": datetime.now(timezone.utc).isoformat(),
    }
    if extra_metadata:
        metadata.update(extra_metadata)

    metadata_path = asset_dir / "metadata.json"
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)

    logger.info(f"Model cache saved to {asset_dir}")


def load_model(
    asset_dir: Path,
) -> Tuple[Optional[tf.keras.Model], Optional[Any], Optional[np.ndarray], Optional[Dict[str, Any]]]:
    model_path = asset_dir / "model.keras"
    scaler_path = asset_dir / "scaler.joblib"
    last_prices_path = asset_dir / "last_prices.npy"
    metadata_path = asset_dir / "metadata.json"

    if not all(p.exists() for p in [model_path, scaler_path, last_prices_path, metadata_path]):
        logger.warning(f"Incomplete cache in {asset_dir}, some files missing")
        return None, None, None, None

    try:
        model = tf.keras.models.load_model(model_path)
        scaler = joblib.load(scaler_path)
        last_prices = np.load(last_prices_path)
        with open(metadata_path) as f:
            metadata = json.load(f)
        logger.info(f"Model loaded from cache: {asset_dir}")
        return model, scaler, last_prices, metadata
    except Exception as e:
        logger.error(f"Failed to load model cache from {asset_dir}: {e}")
        return None, None, None, None


def is_cache_valid(asset_dir: Path, max_age_hours: int = 24) -> bool:
    metadata_path = asset_dir / "metadata.json"
    if not metadata_path.exists():
        return False

    try:
        with open(metadata_path) as f:
            metadata = json.load(f)

        cached_at_str = metadata.get("cached_at")
        if not cached_at_str:
            return False

        cached_at = datetime.fromisoformat(cached_at_str)
        age = datetime.now(timezone.utc) - cached_at
        age_hours = age.total_seconds() / 3600

        if age_hours > max_age_hours:
            logger.info(f"Cache in {asset_dir} is {age_hours:.1f}h old (max {max_age_hours}h), stale")
            return False

        model_path = asset_dir / "model.keras"
        scaler_path = asset_dir / "scaler.joblib"
        last_prices_path = asset_dir / "last_prices.npy"

        if not all(p.exists() for p in [model_path, scaler_path, last_prices_path]):
            logger.warning(f"Cache {asset_dir} metadata exists but cache files missing")
            return False

        logger.info(f"Cache in {asset_dir} is valid ({age_hours:.1f}h old)")
        return True

    except Exception as e:
        logger.warning(f"Error checking cache validity for {asset_dir}: {e}")
        return False
