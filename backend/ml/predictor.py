import os
import joblib
import pandas as pd
from functools import lru_cache

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
# Fallback model path if database doesn't have an active one
DEFAULT_MODEL_PATH = os.path.join(BASE_DIR, "models", "random_forest_ids.pkl")

# We cache the model loading. In production, if active model changes, we clear this cache.
@lru_cache(maxsize=1)
def get_model(model_path=None):
    path_to_load = model_path if model_path and os.path.exists(model_path) else DEFAULT_MODEL_PATH
    if not os.path.exists(path_to_load):
        raise FileNotFoundError(f"Model file not found: {path_to_load}")
    return joblib.load(path_to_load)

def clear_model_cache():
    get_model.cache_clear()

def predict(features_dict: dict, model_path: str = None) -> tuple[int, float]:
    """
    Runs prediction using the loaded ML model.
    Returns (prediction_class, confidence_score)
    """
    model = get_model(model_path)
    feature_names = model.feature_names_in_
    
    # Convert dict to DataFrame using exact feature names the model expects
    feature_vector = pd.DataFrame(
        [[features_dict.get(f, 0.0) for f in feature_names]],
        columns=feature_names
    )
    
    prediction = int(model.predict(feature_vector)[0])
    confidence = float(model.predict_proba(feature_vector)[0].max())
    
    return prediction, confidence
