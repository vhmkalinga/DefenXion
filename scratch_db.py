import os
from dotenv import load_dotenv
import pymongo

load_dotenv(".env")
client = pymongo.MongoClient(os.getenv("MONGODB_URI"))
db = client["defenxion"]
detections_collection = db["detections"]
doc = detections_collection.find_one()
print("Sample doc:", doc)
