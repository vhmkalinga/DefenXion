"""
DefenXion – Model Trainer
-------------------------
Trains ML classifiers on the CICIDS2017 dataset,
evaluates them, and saves the model to disk.

Supported algorithms:
  - Random Forest
  - Gradient Boosting
  - Decision Tree
  - K-Nearest Neighbors
  - Support Vector Machine (Linear)
  - Extra Trees
"""

import os
import time
import joblib
import pandas as pd
import numpy as np
from datetime import datetime
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, ExtraTreesClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.svm import LinearSVC
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix


BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODELS_DIR = os.path.join(BASE_DIR, "models")
MODELS_DIR = os.path.join(BASE_DIR, "models")

# ── Algorithm registry ─────────────────────────────────────
ALGORITHM_MAP = {
    "random_forest": {
        "name": "Random Forest",
        "prefix": "rf",
        "build": lambda params: RandomForestClassifier(
            n_estimators=params.get("n_estimators", 100),
            max_depth=params.get("max_depth"),
            random_state=42,
            n_jobs=-1,
        ),
    },
    "gradient_boosting": {
        "name": "Gradient Boosting",
        "prefix": "gb",
        "build": lambda params: GradientBoostingClassifier(
            n_estimators=min(params.get("n_estimators", 100), 200),
            max_depth=params.get("max_depth") or 5,
            random_state=42,
        ),
    },
    "decision_tree": {
        "name": "Decision Tree",
        "prefix": "dt",
        "build": lambda params: DecisionTreeClassifier(
            max_depth=params.get("max_depth"),
            random_state=42,
        ),
    },
    "knn": {
        "name": "K-Nearest Neighbors",
        "prefix": "knn",
        "build": lambda params: KNeighborsClassifier(
            n_neighbors=min(params.get("n_estimators", 5), 20),
            n_jobs=-1,
        ),
    },
    "svm": {
        "name": "Support Vector Machine",
        "prefix": "svm",
        "build": lambda params: LinearSVC(
            max_iter=2000,
            random_state=42,
        ),
    },
    "extra_trees": {
        "name": "Extra Trees",
        "prefix": "et",
        "build": lambda params: ExtraTreesClassifier(
            n_estimators=params.get("n_estimators", 100),
            max_depth=params.get("max_depth"),
            random_state=42,
            n_jobs=-1,
        ),
    },
}


def train_model(
    algorithm: str = "random_forest",
    dataset_name: str = "CICIDS2017",
    n_estimators: int = 100,
    max_depth: int | None = None,
    sample_size: int = 50000,
    test_sample_size: int = 10000,
    live_data: list = None,
) -> dict:
    """
    Train a classifier on the selected dataset.

    Args:
        algorithm: Key from ALGORITHM_MAP.
        n_estimators: Number of estimators (trees / neighbors).
        max_depth: Maximum depth (None = unlimited, where supported).
        sample_size: Number of training rows to sample.
        test_sample_size: Number of test rows to sample.

    Returns:
        dict with model metadata.
    """

    if algorithm not in ALGORITHM_MAP:
        raise ValueError(f"Unknown algorithm '{algorithm}'. Choose from: {list(ALGORITHM_MAP.keys())}")

    algo_info = ALGORITHM_MAP[algorithm]
    algo_name = algo_info["name"]
    prefix = algo_info["prefix"]

    # ── Load data ──────────────────────────────────────────────
    dataset_dir = os.path.join(BASE_DIR, "datasets", dataset_name)
    if not os.path.exists(dataset_dir):
        raise FileNotFoundError(f"Dataset directory not found: {dataset_dir}")
        
    X_train_full = pd.read_csv(os.path.join(dataset_dir, "X_train.csv"))
    y_train_full = pd.read_csv(os.path.join(dataset_dir, "y_train.csv")).values.ravel()
    X_test_full = pd.read_csv(os.path.join(dataset_dir, "X_test.csv"))
    y_test_full = pd.read_csv(os.path.join(dataset_dir, "y_test.csv")).values.ravel()

    # ── Online Learning: Merge Live Captured Data ──────────────
    if live_data and len(live_data) > 0:
        df_live = pd.DataFrame(live_data)
        if "Label" in df_live.columns:
            y_live = df_live.pop("Label").values
            
            # Align columns: Keep only features present in baseline, fill missing with 0
            df_live_aligned = pd.DataFrame(columns=X_train_full.columns)
            for col in X_train_full.columns:
                if col in df_live.columns:
                    df_live_aligned[col] = df_live[col]
                else:
                    df_live_aligned[col] = 0.0
                    
            X_train_full = pd.concat([X_train_full, df_live_aligned], ignore_index=True)
            y_train_full = np.concatenate([y_train_full, y_live])

    # ── Stratified sample for training ─────────────────────────
    if sample_size < len(X_train_full):
        rng = np.random.RandomState(int(time.time()) % 2**31)
        idx = rng.choice(len(X_train_full), size=sample_size, replace=False)
        X_train = X_train_full.iloc[idx]
        y_train = y_train_full[idx]
    else:
        X_train = X_train_full
        y_train = y_train_full

    # ── Sample test set ────────────────────────────────────────
    if test_sample_size < len(X_test_full):
        rng = np.random.RandomState(42)
        idx = rng.choice(len(X_test_full), size=test_sample_size, replace=False)
        X_test = X_test_full.iloc[idx]
        y_test = y_test_full[idx]
    else:
        X_test = X_test_full
        y_test = y_test_full

    # ── Replace inf / NaN ──────────────────────────────────────
    X_train = X_train.replace([np.inf, -np.inf], np.nan).fillna(0)
    X_test = X_test.replace([np.inf, -np.inf], np.nan).fillna(0)

    # ── Build & Train ──────────────────────────────────────────
    params = {"n_estimators": n_estimators, "max_depth": max_depth}
    clf = algo_info["build"](params)

    start = time.time()
    clf.fit(X_train, y_train)
    training_time = round(time.time() - start, 2)

    # ── Evaluate ───────────────────────────────────────────────
    y_pred = clf.predict(X_test)
    acc = round(accuracy_score(y_test, y_pred) * 100, 2)
    prec = round(precision_score(y_test, y_pred, zero_division=0) * 100, 2)
    rec = round(recall_score(y_test, y_pred, zero_division=0) * 100, 2)
    f1 = round(f1_score(y_test, y_pred, zero_division=0) * 100, 2)

    # ── Per-Class Accuracy ─────────────────────────────────────
    cm = confusion_matrix(y_test, y_pred)
    threat_detection_accuracy = []
    if cm.shape == (2, 2):
        acc_normal = round((cm[0,0] / sum(cm[0])) * 100, 2) if sum(cm[0]) > 0 else 0
        acc_attack = round((cm[1,1] / sum(cm[1])) * 100, 2) if sum(cm[1]) > 0 else 0
        threat_detection_accuracy = [
            {"category": "Normal Traffic", "accuracy": acc_normal},
            {"category": "Attack Traffic", "accuracy": acc_attack}
        ]

    # ── Feature Importance ─────────────────────────────────────
    feature_importances = []
    if hasattr(clf, "feature_importances_"):
        importance = clf.feature_importances_
        indices = np.argsort(importance)[::-1][:10]  # top 10 features
        columns = X_train.columns
        for idx in indices:
            # Map complex CICIDS feature names to shorter, more readable versions if possible
            raw_name = str(columns[idx]).strip()
            feature_importances.append({
                "feature": raw_name[:25] + ".." if len(raw_name) > 25 else raw_name,
                "importance": round(float(importance[idx]), 4)
            })

    # ── Save model ─────────────────────────────────────────────
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    version = f"{prefix}_{timestamp}"
    filename = f"{prefix}_model_{timestamp}.pkl"
    filepath = os.path.join(MODELS_DIR, filename)
    joblib.dump(clf, filepath)

    return {
        "version": version,
        "filename": filename,
        "filepath": filepath,
        "algorithm": algorithm,
        "name": f"{algo_name} IDS",
        "accuracy": acc,
        "precision": prec,
        "recall": rec,
        "f1_score": f1,
        "training_time_seconds": training_time,
        "n_estimators": n_estimators,
        "max_depth": max_depth,
        "sample_size": sample_size,
        "total_features": len(X_train.columns),
        "feature_importances": feature_importances,
        "threat_detection_accuracy": threat_detection_accuracy,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    }
