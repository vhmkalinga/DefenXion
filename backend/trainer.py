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
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_DIR = os.path.join(BASE_DIR, "datasets", "CICIDS2017")
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
    n_estimators: int = 100,
    max_depth: int | None = None,
    sample_size: int = 50000,
    test_sample_size: int = 10000,
) -> dict:
    """
    Train a classifier on the CICIDS2017 dataset.

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
    X_train_full = pd.read_csv(os.path.join(DATASET_DIR, "X_train.csv"))
    y_train_full = pd.read_csv(os.path.join(DATASET_DIR, "y_train.csv")).values.ravel()
    X_test_full = pd.read_csv(os.path.join(DATASET_DIR, "X_test.csv"))
    y_test_full = pd.read_csv(os.path.join(DATASET_DIR, "y_test.csv")).values.ravel()

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
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    }
