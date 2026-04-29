"""
DefenXion Traffic Engine
------------------------
Unified presentation script to toggle between Simulated Attack Traffic 
and Live Device Traffic.
"""

import time
import random
import requests
import psutil
import sys
from datetime import datetime

BASE_URL = "http://127.0.0.1:8000"
LOGIN_URL = f"{BASE_URL}/auth/login"
PREDICT_URL = f"{BASE_URL}/predict"
LIVE_CAPTURE_URL = f"{BASE_URL}/capture/live"

def authenticate():
    print("\nWaiting for DefenXion Backend to be ready...")
    creds = [("admin", "adminpassword"), ("test", "test")]
    max_wait_seconds = 120  # Wait up to 2 minutes for backend to load
    attempt = 0

    while attempt * 5 < max_wait_seconds:
        for user, pwd in creds:
            try:
                resp = requests.post(
                    LOGIN_URL,
                    data={"username": user, "password": pwd},
                    headers={"Content-Type": "application/x-www-form-urlencoded"},
                    timeout=8
                )
                if resp.status_code == 200:
                    print(f"[+] Successfully authenticated as '{user}'")
                    return resp.json().get("access_token")
                elif resp.status_code in (401, 403, 422):
                    print(f"[-] Login failed for '{user}': {resp.status_code}")
            except requests.exceptions.ConnectionError:
                pass  # Backend not up yet
            except requests.exceptions.Timeout:
                pass  # Still loading
            except Exception as e:
                print(f"[-] Unexpected error: {e}")

        attempt += 1
        remaining = max_wait_seconds - attempt * 5
        if remaining > 0:
            print(f"    Backend not ready yet, retrying in 5s... ({remaining}s remaining)")
            time.sleep(5)

    print("[-] Backend did not respond after 2 minutes.")
    print("    Make sure start.bat is running and check for errors in the backend terminal.")
    return None


def generate_features(is_attack=False):
    """Generates a 40-feature vector for the Random Forest model."""
    features = {}
    for i in range(40):
        if is_attack:
            features[f"feature_{i}"] = random.uniform(10.0, 100.0) if random.random() > 0.5 else 0.0
        else:
            features[f"feature_{i}"] = random.uniform(0.0, 5.0)
    return features

# ---------------------------------------------------------
# METHOD 1: Simulated Attack Traffic
# ---------------------------------------------------------
def run_simulated_traffic(token):
    import os
    import sys
    from dotenv import load_dotenv
    from pymongo import MongoClient

    # Fix Windows console emoji printing error
    if sys.stdout.encoding.lower() != 'utf-8':
        sys.stdout.reconfigure(encoding='utf-8')

    load_dotenv()
    client = MongoClient(os.getenv("MONGODB_URI"), serverSelectionTimeoutMS=5000)
    db = client["defenxion"]
    detections = db["detections"]

    headers = {"Authorization": f"Bearer {token}"}
    print("\n[!] Starting Mixed-Severity Attack Simulator... Press Ctrl+C to stop.\n")
    print("    Severity mix: 15% Critical | 45% High | 25% Medium | 15% Benign\n")

    sources_attack = [
        "192.168.1.45",  "10.0.0.56",     "172.16.0.123",
        "192.168.1.100", "10.0.0.99",     "45.33.32.156",
        "198.20.69.74",  "80.82.77.139",  "209.141.34.8",
    ]
    sources_benign = [
        "203.45.67.89",  "198.51.100.42", "198.51.100.55",
        "203.0.113.10",  "185.199.108.1",
    ]
    destinations = ["10.0.0.5", "10.0.0.8", "10.0.0.10"]

    ATTACK_TYPES = ["DDoS", "Brute Force", "Port Scan", "SQL Injection", "XSS", "Ransomware C2"]

    try:
        while True:
            roll = random.random()

            if roll < 0.15:
                # ── CRITICAL ─────────────────────────────────────────
                src   = random.choice(sources_attack)
                dst   = random.choice(destinations)
                port  = random.choice([22, 23, 3389, 1433, 5900])
                conf  = round(random.uniform(0.95, 0.99), 4)
                atype = random.choice(["Ransomware C2", "RDP Brute Force", "SSH Credential Stuffing"])
                detections.insert_one({
                    "source_ip":      src,
                    "destination_ip": dst,
                    "dst_port":       port,
                    "action":         "CRITICAL_BLOCK",
                    "confidence":     conf,
                    "attack_type":    atype,
                    "timestamp":      datetime.now(),
                    "triggered_by":   "simulator",
                })
                print(f"[{datetime.now().strftime('%H:%M:%S')}] 🔴 CRITICAL | {src:<16} → {dst}:{port:<5} | {conf:.2f} | {atype}")

            elif roll < 0.60:
                # ── HIGH ─────────────────────────────────────────────
                src   = random.choice(sources_attack)
                dst   = random.choice(destinations)
                port  = random.choice([80, 443, 21, 25, 53, 8080])
                conf  = round(random.uniform(0.85, 0.95), 4)
                atype = random.choice(["DDoS", "Brute Force", "Port Scan"])
                detections.insert_one({
                    "source_ip":      src,
                    "destination_ip": dst,
                    "dst_port":       port,
                    "action":         "BLOCK_IP",
                    "confidence":     conf,
                    "attack_type":    atype,
                    "timestamp":      datetime.now(),
                    "triggered_by":   "simulator",
                })
                print(f"[{datetime.now().strftime('%H:%M:%S')}] 🟠 HIGH     | {src:<16} → {dst}:{port:<5} | {conf:.2f} | {atype}")

            elif roll < 0.85:
                # ── MEDIUM ────────────────────────────────────────────
                src   = random.choice(sources_attack)
                dst   = random.choice(destinations)
                port  = random.choice([8443, 9200, 5601, 6379, 27017])
                conf  = round(random.uniform(0.70, 0.84), 4)
                atype = random.choice(["SQL Injection", "XSS", "Suspicious Scan"])
                detections.insert_one({
                    "source_ip":      src,
                    "destination_ip": dst,
                    "dst_port":       port,
                    "action":         "ALERT_ADMIN",
                    "confidence":     conf,
                    "attack_type":    atype,
                    "timestamp":      datetime.now(),
                    "triggered_by":   "simulator",
                })
                print(f"[{datetime.now().strftime('%H:%M:%S')}] 🟡 MEDIUM   | {src:<16} → {dst}:{port:<5} | {conf:.2f} | {atype}")

            else:
                # ── BENIGN ────────────────────────────────────────────
                src  = random.choice(sources_benign)
                dst  = random.choice(destinations)
                port = random.choice([80, 443, 8080, 53])
                payload = {"source_ip": src, "destination_ip": dst, "port": port, "protocol": "TCP"}
                try:
                    requests.post(LIVE_CAPTURE_URL, json=payload, headers=headers, timeout=5)
                except Exception:
                    pass
                print(f"[{datetime.now().strftime('%H:%M:%S')}] ✅ BENIGN   | {src:<16}           Port: {port}")

            time.sleep(random.uniform(0.8, 2.5))

    except KeyboardInterrupt:
        print("\nSimulator stopped.")
    finally:
        client.close()



# ---------------------------------------------------------

# METHOD 2: Live Device Network Traffic
# ---------------------------------------------------------
def is_public_ip(ip: str) -> bool:
    """Returns True only if the IP is a real, routable external address."""
    private_prefixes = (
        "127.", "0.", "::1",
        "10.",
        "192.168.",
        "172.16.", "172.17.", "172.18.", "172.19.",
        "172.20.", "172.21.", "172.22.", "172.23.",
        "172.24.", "172.25.", "172.26.", "172.27.",
        "172.28.", "172.29.", "172.30.", "172.31.",
        "169.254.", "224.", "255.",
    )
    return not any(ip.startswith(p) for p in private_prefixes)


# ---------------------------------------------------------
# METHOD 2: Live Device Network Traffic
# ---------------------------------------------------------
def run_live_traffic(token):
    headers = {"Authorization": f"Bearer {token}"}
    print("\n[+] Sniffing live external TCP connections... Press Ctrl+C to stop.")
    print("    Open your browser and visit some websites to generate traffic!\n")

    seen_connections = set()
    try:
        while True:
            connections = psutil.net_connections(kind='inet')
            active_conns = [
                c for c in connections
                if c.status == 'ESTABLISHED'
                and c.raddr
                and is_public_ip(c.raddr.ip)  # Only real external IPs
            ]

            for conn in active_conns:
                conn_id = f"{conn.laddr.ip}:{conn.laddr.port}->{conn.raddr.ip}:{conn.raddr.port}"
                if conn_id not in seen_connections:
                    seen_connections.add(conn_id)
                    if len(seen_connections) > 5000:
                        seen_connections.clear()

                    payload = {
                        "source_ip": conn.laddr.ip,
                        "destination_ip": conn.raddr.ip,
                        "port": conn.raddr.port,
                        "protocol": "TCP"
                    }
                    try:
                        # Use dedicated endpoint — bypasses ML attack classifier entirely
                        res = requests.post(LIVE_CAPTURE_URL, json=payload, headers=headers, timeout=3)
                        if res.status_code == 200:
                            print(f"[{datetime.now().strftime('%H:%M:%S')}] ✅ BENIGN  | Dst: {conn.raddr.ip:<28} | Port: {conn.raddr.port:<5}")
                    except Exception:
                        pass
            time.sleep(2)
    except KeyboardInterrupt:
        print("\nLive capture stopped.")

# ---------------------------------------------------------
# CLI Menu
# ---------------------------------------------------------
def main():
    print("="*50)
    print(" DefenXion Ultimate Presentation Engine ")
    print("="*50)
    print("1) Launch Simulated Attack Traffic (DDoS/Brute Force)")
    print("2) Launch Live Device Network Monitor (Actual TCP Sockets)")
    print("3) Exit")
    print("="*50)
    
    choice = input("Select a mode (1/2/3): ").strip()
    if choice == '3':
        sys.exit(0)
    elif choice not in ['1', '2']:
        print("Invalid choice.")
        sys.exit(1)
        
    token = authenticate()
    if not token:
        return
        
    if choice == '1':
        run_simulated_traffic(token)
    elif choice == '2':
        run_live_traffic(token)

if __name__ == "__main__":
    main()
