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

# MongoDB collections
from backend.database import (
    detections_collection,
    alerts_collection,
    logs_collection,
)

# --------------------------------------------------
# Attack history tracking (in-memory context)
# --------------------------------------------------
attack_counter = defaultdict(int)

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

    # Critical: repeated high-confidence attacks
    if confidence >= CONF_HIGH and attack_counter[source_ip] >= 3:
        return "CRITICAL_BLOCK"

    # High-risk attack
    elif confidence >= CONF_HIGH:
        return "BLOCK_IP"

    # Medium-risk suspicious activity
    elif confidence >= CONF_MED:
        return "ALERT_ADMIN"

    # Low-risk event
    else:
        return "LOG_ONLY"


# --------------------------------------------------
# Update attack history
# --------------------------------------------------
def update_attack_history(event: dict):
    """
    Maintain count of attacks per source IP
    """
    if event["prediction"] == 1:
        attack_counter[event["source_ip"]] += 1


# --------------------------------------------------
# Action handlers (SIMULATED)
# --------------------------------------------------
def log_event(event: dict):
    print(f"[LOG] {event}")


def alert_admin(event: dict):
    print(
        f"[ALERT] Suspicious activity detected from {event['source_ip']} "
        f"(confidence={event['confidence']})"
    )


def block_ip(ip: str):
    print(f"[BLOCK] IP {ip} blocked (simulated firewall rule)")


def critical_response(ip: str):
    print(f"[CRITICAL] IP {ip} blocked and escalated to SOC (simulated)")


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
        critical_response(event["source_ip"])

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
        severity = (
            "HIGH" if event["confidence"] >= CONF_HIGH
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
