import os
import joblib
import pandas as pd
import numpy as np
from sklearn.metrics import confusion_matrix

BASE_DIR = r"c:\Users\harsh\Documents\DefenXion"
MODELS_DIR = os.path.join(BASE_DIR, "models")
DATASETS_DIR = os.path.join(BASE_DIR, "datasets", "CICIDS2017")

model_path = os.path.join(MODELS_DIR, "random_forest_ids.pkl")

print(f"Loading model from {model_path}...")
clf = joblib.load(model_path)

print("Loading test data...")
X_test = pd.read_csv(os.path.join(DATASETS_DIR, "X_test.csv"))
y_test = pd.read_csv(os.path.join(DATASETS_DIR, "y_test.csv")).values.ravel()

print("Handling NaNs and Infs...")
X_test = X_test.replace([np.inf, -np.inf], np.nan).fillna(0)

print("Making predictions...")
y_pred = clf.predict(X_test)

print("Computing confusion matrix...")
cm = confusion_matrix(y_test, y_pred)

print("\n--- Confusion Matrix ---")
print(cm)

print("\nDetailed:")
tn, fp, fn, tp = cm.ravel()
print(f"True Negatives (Normal classified as Normal): {tn}")
print(f"False Positives (Normal classified as Attack): {fp}")
print(f"False Negatives (Attack classified as Normal): {fn}")
print(f"True Positives (Attack classified as Attack): {tp}")
