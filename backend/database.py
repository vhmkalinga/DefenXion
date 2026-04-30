from pymongo import MongoClient, ASCENDING, DESCENDING
import os
import logging
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGODB_URI")

try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000, connectTimeoutMS=5000)
    # Ping the server to catch connection issues at startup rather than lazily
    client.admin.command("ping")
    db = client["defenxion"]
except Exception as e:
    logging.critical(f"[DefenXion] Failed to connect to MongoDB: {e}")
    raise

# Collections
users_collection = db["users"]
detections_collection = db["detections"]
alerts_collection = db["alerts"]
logs_collection = db["logs"]
# Additional security collections
refresh_tokens_collection = db["refresh_tokens"]
token_blacklist_collection = db["token_blacklist"]
# ML model registry & data
trained_models_collection = db["trained_models"]
captured_traffic_collection = db["captured_traffic"]
# Active Defense collections
defense_modules_collection = db["defense_modules"]
firewall_rules_collection = db["firewall_rules"]
defense_settings_collection = db["defense_settings"]
# Reports
reports_collection = db["reports"]
# App Settings (general, notifications, etc.)
app_settings_collection = db["app_settings"]

# --------------------------------------------------
# Indexes (idempotent – safe to run every startup)
# --------------------------------------------------
# Frequently sorted / filtered fields
detections_collection.create_index([("timestamp", DESCENDING)])
detections_collection.create_index([("source_ip", ASCENDING)])
detections_collection.create_index([("action", ASCENDING)])
alerts_collection.create_index([("timestamp", DESCENDING)])
alerts_collection.create_index([("status", ASCENDING)])
logs_collection.create_index([("timestamp", DESCENDING)])
# Compound index for attack-count documents used by the response engine
logs_collection.create_index(
    [("event_type", ASCENDING), ("source_ip", ASCENDING)],
    sparse=True,
)
trained_models_collection.create_index([("timestamp", DESCENDING)])
trained_models_collection.create_index([("status", ASCENDING)])
