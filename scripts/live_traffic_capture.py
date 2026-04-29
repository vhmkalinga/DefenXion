"""
Live Device Network Traffic Capture for DefenXion
-------------------------------------------------
This script polls your local operating system's active network connections
and streams them live into the DefenXion dashboard.
"""

import time
import random
import requests
import psutil
from datetime import datetime

BASE_URL = "http://127.0.0.1:8000"
LOGIN_URL = f"{BASE_URL}/auth/login"
PREDICT_URL = f"{BASE_URL}/predict"

def generate_benign_features():
    """Generates a benign feature vector simulating normal traffic."""
    features = {}
    for i in range(40):
        features[f"feature_{i}"] = random.uniform(0.0, 5.0)
    return features

def authenticate():
    print("Attempting to login to DefenXion Backend...")
    session = requests.Session()
    creds = [("admin", "adminpassword"), ("test", "test")]
    for user, pwd in creds:
        try:
            resp = session.post(LOGIN_URL, data={"username": user, "password": pwd}, headers={"Content-Type": "application/x-www-form-urlencoded"})
            if resp.status_code == 200:
                print(f"[+] Successfully authenticated as '{user}'")
                return resp.json().get("access_token")
        except Exception:
            pass
    return None

def start_capture():
    print("=== DefenXion Live Network Capture ===")
    token = authenticate()
    if not token:
        print("[-] Could not login. Make sure the backend is running.")
        return

    headers = {"Authorization": f"Bearer {token}"}
    print("\n[+] Sniffing live connections... Press Ctrl+C to stop.\n")
    
    seen_connections = set()
    
    try:
        while True:
            # Poll actual OS connections
            connections = psutil.net_connections(kind='inet')
            
            # Filter for active outbound/inbound connections
            active_conns = [c for c in connections if c.status == 'ESTABLISHED' and c.raddr]
            
            for conn in active_conns:
                # To prevent spamming the exact same connection every loop
                conn_id = f"{conn.laddr.ip}:{conn.laddr.port}->{conn.raddr.ip}:{conn.raddr.port}"
                
                if conn_id not in seen_connections:
                    seen_connections.add(conn_id)
                    
                    # Prevent memory leak by capping history
                    if len(seen_connections) > 5000:
                        seen_connections.clear()
                        
                    payload = {
                        "source_ip": conn.laddr.ip,
                        "destination_ip": conn.raddr.ip,
                        "features": generate_benign_features() # Live benign traffic
                    }
                    
                    try:
                        res = requests.post(PREDICT_URL, json=payload, headers=headers)
                        if res.status_code == 200:
                            data = res.json()
                            conf = data.get("confidence", 0)
                            print(f"[{datetime.now().strftime('%H:%M:%S')}] 💻 LIVE TCP | Src: {payload['source_ip']:<15} | Dst: {payload['destination_ip']:<15} | Port: {conn.raddr.port:<5} | Conf: {conf:.2f}")
                    except Exception as e:
                        pass # Silently drop on connection error to avoid spam
                        
            # Short sleep to prevent massive CPU usage
            time.sleep(2)
            
    except KeyboardInterrupt:
        print("\nLive capture stopped.")

if __name__ == "__main__":
    start_capture()
