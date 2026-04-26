import os
import sys

# Add project root to path so we can import backend modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import users_collection
from backend.auth.security import hash_password

def create_initial_admin():
    username = "admin"
    password = "adminpassword"
    email = "admin@defenxion.local"
    
    existing_user = users_collection.find_one({"username": username})
    if existing_user:
        print(f"User '{username}' already exists.")
        return
        
    hashed_password = hash_password(password)
    
    users_collection.insert_one({
        "username": username,
        "email": email,
        "hashed_password": hashed_password,
        "role": "admin",
        "failed_attempts": 0,
        "account_locked": False
    })
    
    print(f"Successfully created admin user:\nUsername: {username}\nPassword: {password}")

if __name__ == "__main__":
    create_initial_admin()
