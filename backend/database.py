from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGODB_URI")

client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000, connectTimeoutMS=5000)
db = client["defenxion"]

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
