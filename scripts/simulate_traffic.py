"""
Traffic Simulator for DefenXion Dashboard
-----------------------------------------
This script sends random benign and malicious traffic to the backend
so the UI can display live statistics during the university presentation.
"""

import time
import random
import requests
from datetime import datetime
import json

BASE_URL = "http://127.0.0.1:8000"
LOGIN_URL = f"{BASE_URL}/auth/login"
PREDICT_URL = f"{BASE_URL}/predict"

# Sample Feature Vectors based on expected Random Forest inputs
# The exact features depend on what the model was trained on, so we'll 
# use generic names for now, or random numeric hashes. To be safe, 
# we'll generate 40 continuous features.
def generate_features(is_attack=False):
    features = {}
    for i in range(40):
        if is_attack:
            # Attacks might have higher values for certain features
            features[f"feature_{i}"] = random.uniform(10.0, 100.0) if random.random() > 0.5 else 0.0
        else:
            features[f"feature_{i}"] = random.uniform(0.0, 5.0)
    return features


def simulate_traffic():
    print("=== DefenXion Traffic Simulator ===")
    
    # 1. First, we need to log in to get a token
    # We will try to create a test user first, or just assume admin:admin exists.
    # The current backend doesn't have a default admin. Let's create one via the DB directly 
    # if it doesn't exist, or we can use a direct DB insert.
    
    # Actually, the /predict endpoint requires @get_current_user. Let's connect to the DB and insert a user,
    # or just use the /users/create endpoint if we can get an admin token. But creating user requires admin.
    
    print("\n[!] WARNING: This script assumes a user exists. Ensure you've created one!")
    print("Attempting to login with admin/admin or test/test...")
    
    session = requests.Session()
    
    # Try a set of common credentials
    creds = [("admin", "adminpassword"), ("test", "test")]
    token = None
    username = None
    
    for user, pwd in creds:
        try:
            resp = session.post(LOGIN_URL, data={"username": user, "password": pwd}, headers={"Content-Type": "application/x-www-form-urlencoded"})
            if resp.status_code == 200:
                token = resp.json().get("access_token")
                username = user
                print(f"[+] Successfully logged in as '{user}'")
                break
            else:
                print(f"[-] Login failed for {user}: {resp.status_code} {resp.text}")
        except Exception as e:
            print(f"[-] Login exception for {user}: {e}")
            
    if not token:
        print("[-] Could not login. Make sure the backend is running and a user exists.")
        print("[-] Alternatively, insert a test user into MongoDB directly.")
        return

    headers = {"Authorization": f"Bearer {token}"}
    
    print("\nStarting simulation... Press Ctrl+C to stop.")
    
    sources = ["192.168.1.45", "10.0.0.56", "203.45.67.89", "172.16.0.123", "198.51.100.42", "192.168.1.100"]
    destinations = ["10.0.0.5", "10.0.0.8", "10.0.0.10"]
    
    try:
        while True:
            # 80% benign, 20% malicious
            is_attack = random.random() < 0.2
            
            payload = {
                "source_ip": random.choice(sources),
                "destination_ip": random.choice(destinations),
                "features": generate_features(is_attack)
            }
            
            try:
                res = requests.post(PREDICT_URL, json=payload, headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    action = data.get("action_taken")
                    conf = data.get("confidence", 0)
                    
                    if is_attack and conf > 0.5:
                        print(f"[{datetime.now().strftime('%H:%M:%S')}] 🚨 ATTACK  | IP: {payload['source_ip']:<15} | Conf: {conf:.2f} | Action: {action}")
                    else:
                        print(f"[{datetime.now().strftime('%H:%M:%S')}] ✅ NORMAL  | IP: {payload['source_ip']:<15} | Conf: {conf:.2f}")
                else:
                    print(f"Error: {res.status_code} - {res.text}")
                    if res.status_code == 401:
                        print("Token expired or invalid.")
                        break
            except Exception as e:
                print(f"Connection error: {e}")
                
            # Wait between 1 and 4 seconds before next packet
            time.sleep(random.uniform(1.0, 4.0))
            
    except KeyboardInterrupt:
        print("\nSimulation stopped.")


if __name__ == "__main__":
    simulate_traffic()
