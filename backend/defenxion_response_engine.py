"""
DefenXion – Automated Response Engine
------------------------------------
This module translates IDS predictions into automated security actions
such as logging, alerting, and simulated IP blocking.

All actions are logged and stored in MongoDB for reporting,
audit, and dashboard visualization.

NOTE:
- IP blocking is SIMULATED for academic and ethical reasons.
"""

from collections import defaultdict
from datetime import datetime
import requests
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# MongoDB collections
from backend.database import (
    detections_collection,
    alerts_collection,
    logs_collection,
    defense_settings_collection,
    defense_modules_collection,
    firewall_rules_collection,
    app_settings_collection,
)

# --------------------------------------------------
# Attack history tracking (MongoDB-backed, persistent across restarts)
# --------------------------------------------------
# We use a dedicated MongoDB collection via upsert so counts survive
# process restarts and work correctly under multi-worker deployments.
# The in-memory dict is kept as an O(1) read cache and is synced on every
# write – good enough for a single-node academic deployment.
_attack_counter_cache: dict = {}

# --------------------------------------------------
# Thresholds
# --------------------------------------------------
CONF_HIGH = 0.95
CONF_MED = 0.85

# --------------------------------------------------
# Response decision logic
# --------------------------------------------------
def automated_response(event: dict) -> str:
    """
    Decide which action to take based on confidence and history
    """
    source_ip = event["source_ip"]
    confidence = event["confidence"]
    
    # Fetch sensitivity from DB
    settings = defense_settings_collection.find_one({}, {"_id": 0}) or {}
    sensitivity = settings.get("sensitivity", 80)
    
    # Map sensitivity (0-100) to confidence thresholds
    # 0 = very strict (0.99), 100 = very sensitive (0.85)
    conf_high = 0.99 - (sensitivity / 100.0) * 0.14
    conf_med = 0.95 - (sensitivity / 100.0) * 0.20

    # Fetch module states
    modules = {m["name"]: m.get("enabled", True) for m in defense_modules_collection.find({}, {"_id": 0})}
    auto_response_enabled = modules.get("Auto-Response", True)
    alert_system_enabled = modules.get("Alert System", True)

    action = "LOG_ONLY"

    # Decide raw action
    if confidence >= conf_high and _get_attack_count(source_ip) >= 3:
        action = "CRITICAL_BLOCK"
    elif confidence >= conf_high:
        action = "BLOCK_IP"
    elif confidence >= conf_med:
        action = "ALERT_ADMIN"

    # Apply module constraints
    if action in ["CRITICAL_BLOCK", "BLOCK_IP"] and not auto_response_enabled:
        action = "ALERT_ADMIN"
    
    if action == "ALERT_ADMIN" and not alert_system_enabled:
        action = "LOG_ONLY"

    return action


def _get_attack_count(source_ip: str) -> int:
    """
    Returns the current attack count for the given IP, reading from MongoDB
    so the value is accurate even after a server restart.
    """
    if source_ip in _attack_counter_cache:
        return _attack_counter_cache[source_ip]
    doc = logs_collection.find_one(
        {"event_type": "ATTACK_COUNT", "source_ip": source_ip},
        {"_id": 0, "count": 1}
    )
    count = doc["count"] if doc else 0
    _attack_counter_cache[source_ip] = count
    return count


def update_attack_history(event: dict):
    """
    Increment and persist the per-IP attack count in MongoDB.
    """
    if event["prediction"] == 1:
        source_ip = event["source_ip"]
        # Upsert into MongoDB for persistence
        logs_collection.update_one(
            {"event_type": "ATTACK_COUNT", "source_ip": source_ip},
            {"$inc": {"count": 1}},
            upsert=True,
        )
        # Refresh cache
        _attack_counter_cache.pop(source_ip, None)


# --------------------------------------------------
# Action handlers (SIMULATED)
# --------------------------------------------------
def log_event(event: dict):
    print(f"[LOG] {event}")

def dispatch_notifications(event: dict, severity: str):
    """Dispatches real notifications using the user's settings"""
    settings = app_settings_collection.find_one({}, {"_id": 0}) or {}
    notifications = settings.get("notifications", {})
    
    msg_text = f"DefenXion {severity} Alert: Threat detected from {event.get('source_ip')} targeting {event.get('destination_ip')} with {event.get('confidence', 0)*100:.1f}% confidence."

    # 1. Slack Integration
    if notifications.get("slack_integration") and notifications.get("slack_webhook_url"):
        try:
            requests.post(notifications["slack_webhook_url"], json={"text": f":warning: *{severity} THREAT:* {msg_text}"}, timeout=2)
            print("[NOTIFY] Slack alert dispatched.")
        except Exception as e:
            print(f"[NOTIFY] Slack dispatch failed: {e}")

    # 2. Email Reports / Alerts
    if notifications.get("critical_alerts") and notifications.get("email_address"):
        smtp_cfg = settings.get("smtp", {})
        host = smtp_cfg.get("host")
        port = smtp_cfg.get("port", 587)
        user = smtp_cfg.get("username")
        pw = smtp_cfg.get("password")
        to_email = notifications.get("email_address")
        
        if host and user and pw and to_email:
            try:
                msg = MIMEMultipart()
                msg['From'] = f"DefenXion Security <{user}>"
                msg['To'] = to_email
                msg['Subject'] = f"DefenXion Security Alert - {severity}"
                msg.attach(MIMEText(msg_text, 'plain'))
                
                server = smtplib.SMTP(host, port)
                server.starttls()
                server.login(user, pw)
                server.send_message(msg)
                server.quit()
                print(f"[NOTIFY] Real Email alert successfully dispatched to {to_email}.")
            except Exception as e:
                print(f"[NOTIFY] Real Email dispatch failed: {e}")
        else:
            print(f"[NOTIFY] Email settings incomplete. Would have sent: {msg_text}")


def alert_admin(event: dict):
    print(
        f"[ALERT] Suspicious activity detected from {event['source_ip']} "
        f"(confidence={event['confidence']})"
    )
    dispatch_notifications(event, "MEDIUM")


def block_ip(ip: str):
    print(f"[BLOCK] IP {ip} blocked (simulated firewall rule)")
    _add_auto_firewall_rule(ip, "High")


def critical_response(event: dict):
    ip = event['source_ip']
    print(f"[CRITICAL] IP {ip} blocked and escalated to SOC (simulated)")
    _add_auto_firewall_rule(ip, "Critical")
    dispatch_notifications(event, "CRITICAL")


def _add_auto_firewall_rule(ip: str, priority: str):
    """Automatically adds the IP to the firewall rules"""
    # Check if rule already exists
    if firewall_rules_collection.find_one({"name": f"Auto-Block {ip}"}):
        return

    last = firewall_rules_collection.find_one(sort=[("rule_id", -1)])
    next_id = (last["rule_id"] + 1) if last else 1
    
    firewall_rules_collection.insert_one({
        "rule_id": next_id,
        "name": f"Auto-Block {ip}",
        "priority": priority,
        "status": "Active",
        "hits": 1, # Start with 1 hit
        "action": "DROP",
        "created": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    })


# --------------------------------------------------
# Main handler (IDS → Response → Database)
# --------------------------------------------------
def handle_event(event: dict):
    """
    Main pipeline:
    - Update history
    - Decide response
    - Execute simulated action
    - Persist data to MongoDB
    """

    # -----------------------------
    # Update in-memory history
    # -----------------------------
    update_attack_history(event)

    # -----------------------------
    # Decide response
    # -----------------------------
    action = automated_response(event)
    event["action"] = action

    # -----------------------------
    # Execute simulated action
    # -----------------------------
    if action == "CRITICAL_BLOCK":
        critical_response(event)

    elif action == "BLOCK_IP":
        block_ip(event["source_ip"])

    elif action == "ALERT_ADMIN":
        alert_admin(event)

    else:
        log_event(event)

    # -----------------------------
    # Persist detection event
    # -----------------------------
    detections_collection.insert_one({
        "source_ip": event["source_ip"],
        "destination_ip": event["destination_ip"],
        "prediction": event["prediction"],
        "confidence": event["confidence"],
        "action": action,
        "timestamp": event["timestamp"],
    })

    # -----------------------------
    # Create alert (if applicable)
    # -----------------------------
    if action in ["ALERT_ADMIN", "BLOCK_IP", "CRITICAL_BLOCK"]:
        # Fetch sensitivity from DB just for logging severity
        settings = defense_settings_collection.find_one({}, {"_id": 0}) or {}
        sensitivity = settings.get("sensitivity", 80)
        conf_high = 0.99 - (sensitivity / 100.0) * 0.14
        
        severity = (
            "HIGH" if event["confidence"] >= conf_high
            else "MEDIUM"
        )

        alerts_collection.insert_one({
            "message": "Intrusion detected",
            "severity": severity,
            "source_ip": event["source_ip"],
            "action": action,
            "status": "ACTIVE",
            "timestamp": event["timestamp"],
        })

    # -----------------------------
    # Log system event
    # -----------------------------
    logs_collection.insert_one({
        "event_type": "IDS_RESPONSE",
        "details": event,
        "timestamp": event["timestamp"],
    })


# --------------------------------------------------
# Standalone test execution
# --------------------------------------------------
if __name__ == "__main__":
    print("=== DefenXion Automated Response Engine Demo ===\n")

    test_events = [
        {
            "source_ip": "192.168.1.45",
            "destination_ip": "10.0.0.5",
            "prediction": 1,
            "confidence": 0.96,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        },
        {
            "source_ip": "192.168.1.45",
            "destination_ip": "10.0.0.5",
            "prediction": 1,
            "confidence": 0.97,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        },
        {
            "source_ip": "192.168.1.45",
            "destination_ip": "10.0.0.5",
            "prediction": 1,
            "confidence": 0.98,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        },
        {
            "source_ip": "192.168.1.99",
            "destination_ip": "10.0.0.8",
            "prediction": 0,
            "confidence": 0.40,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        },
    ]

    for event in test_events:
        handle_event(event)

    print("\n=== Demo Completed ===")
