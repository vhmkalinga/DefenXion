from fastapi import APIRouter, Depends
from pydantic import BaseModel
from datetime import datetime, timezone
from backend.auth.dependencies import get_current_user
from backend.database import (
    detections_collection, users_collection,
    firewall_rules_collection, captured_traffic_collection
)

router = APIRouter(prefix="/chat", tags=["Copilot"])

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str
    action_url: str | None = None
    data_table: list | None = None   # For structured card data sent to the UI

# ─────────────────────────────────────────────────────────
# Helper: fetch system health snapshot
# ─────────────────────────────────────────────────────────
ATTACK_ACTIONS = ["BLOCK_IP", "CRITICAL_BLOCK", "ALERT_ADMIN"]
HIGH_SEVERITY_ACTIONS = ["BLOCK_IP", "CRITICAL_BLOCK"]

def get_system_snapshot():
    total   = detections_collection.count_documents({"action": {"$in": ATTACK_ACTIONS}})
    high    = detections_collection.count_documents({"action": {"$in": HIGH_SEVERITY_ACTIONS}})
    medium  = detections_collection.count_documents({"action": "ALERT_ADMIN"})
    low     = max(0, total - high - medium)
    locked  = users_collection.count_documents({"account_locked": True})
    rules   = firewall_rules_collection.count_documents({})
    return dict(total=total, high=high, medium=medium, low=low, locked=locked, rules=rules)

# ─────────────────────────────────────────────────────────
# Main endpoint
# ─────────────────────────────────────────────────────────
@router.post("", response_model=ChatResponse)
def handle_chat_message(
    request: ChatRequest,
    current_user: dict = Depends(get_current_user)
):
    raw = request.message.strip()
    msg = raw.lower().strip()

    # ── Normalize common merged spellings / variants ──────────
    normalizations = {
        "bruteforce":      "brute force",
        "brute-force":     "brute force",
        "sqlinjection":    "sql injection",
        "sqli":            "sql injection",
        "portscan":        "port scan",
        "portscanning":    "port scanning",
        "crosssitescripting": "xss",
        "cross-site scripting": "xss",
        "cross site scripting": "xss",
        "ddos":            "ddos",
        "dos attack":      "ddos",
        "denial of service": "ddos",
        "mitm":            "man in the middle",
        "man-in-the-middle": "man in the middle",
        "ransomware":      "ransomware",
        "phishing":        "phishing",
    }
    for variant, normalized in normalizations.items():
        msg = msg.replace(variant, normalized)

    now = datetime.now(timezone.utc)

    # ── SECURITY-TOPIC GUARD ──────────────────────────────────
    # Known off-topic indicators — reply politely and exit early
    SECURITY_KEYWORDS = [
        "threat", "attack", "alert", "hack", "ddos", "brute force", "sql injection",
        "xss", "phishing", "ransomware", "port scan", "firewall", "malware",
        "virus", "ip", "block", "login", "password", "reset", "status", "health",
        "system", "report", "summary", "traffic", "analytic", "model", "rule",
        "defense", "detect", "incident", "security", "man in the middle", "mitm",
        "log", "audit", "vulnerability", "exploit", "scan", "intrusion",
    ]
    is_security_topic = any(k in msg for k in SECURITY_KEYWORDS)

    # If nothing security-related is in the message, reject politely
    if not is_security_topic:
        return ChatResponse(
            reply=(
                "🤖 I'm a **Security-Focused AI** and only answer questions related to:\n\n"
                "• Cyber attacks (DDoS, Brute Force, SQLi, XSS…)\n"
                "• Live threat data and system status\n"
                "• Firewall rules and account management\n"
                "• Security reports and analytics\n\n"
                "Try asking: *\"What is a brute force attack?\"* or *\"Show latest threats\"*"
            )
        )

    # ── SYSTEM STATUS / HEALTH ─────────────────────────────
    if any(k in msg for k in ["status", "health", "system", "how is", "overall"]):
        s = get_system_snapshot()
        risk = "🔴 CRITICAL" if s["high"] > 10 else "🟡 ELEVATED" if s["high"] > 3 else "🟢 NORMAL"
        reply = (
            f"📡 **System Health — {risk}**\n\n"
            f"{'🚨' if s['high'] else '✅'} High-severity alerts: **{s['high']}**\n"
            f"⚠️  Medium-severity alerts: **{s['medium']}**\n"
            f"ℹ️  Low-severity alerts: **{s['low']}**\n"
            f"🔒 Locked accounts: **{s['locked']}**\n"
            f"🛡️  Active firewall rules: **{s['rules']}**\n\n"
            f"Total incidents logged: **{s['total']}**"
        )
        return ChatResponse(reply=reply, action_url="threats")

    # ── REPORT / SUMMARY ──────────────────────────────────
    if any(k in msg for k in ["report", "summary", "weekly", "daily", "monthly", "generate", "overview"]):
        s = get_system_snapshot()

        # Top attack types from detections
        pipeline = [{"$group": {"_id": "$type", "count": {"$sum": 1}}},
                    {"$sort": {"count": -1}}, {"$limit": 5}]
        top_types = list(detections_collection.aggregate(pipeline))

        # Top attacker IPs
        ip_pipeline = [{"$group": {"_id": "$source_ip", "count": {"$sum": 1}}},
                       {"$sort": {"count": -1}}, {"$limit": 3}]
        top_ips = list(detections_collection.aggregate(ip_pipeline))

        reply = (
            f"📊 **Security Report — {now.strftime('%d %b %Y')}**\n\n"
            f"**Threat Summary**\n"
            f"• Total incidents: {s['total']}\n"
            f"• High: {s['high']}  |  Medium: {s['medium']}  |  Low: {s['low']}\n\n"
        )
        if top_types:
            reply += "**Top Attack Types**\n"
            for t in top_types:
                reply += f"• {t['_id'] or 'Unknown'} — {t['count']} incidents\n"
            reply += "\n"
        if top_ips:
            reply += "**Top Source IPs**\n"
            for ip in top_ips:
                reply += f"• `{ip['_id'] or 'N/A'}` — {ip['count']} hits\n"

        reply += "\nClick **'Download CSV'** below to save this report."
        return ChatResponse(reply=reply, action_url="export-csv")

    # ── TOP ATTACKING IPs ──────────────────────────────────
    if any(k in msg for k in ["top ip", "attacking ip", "source ip", "who is attacking", "attacker"]):
        ip_pipeline = [{"$group": {"_id": "$source_ip", "count": {"$sum": 1}, "types": {"$addToSet": "$type"}}},
                       {"$sort": {"count": -1}}, {"$limit": 5}]
        top_ips = list(detections_collection.aggregate(ip_pipeline))
        if not top_ips:
            return ChatResponse(reply="✅ No attacking IPs found in the logs yet.")
        reply = "🎯 **Top Attacking IPs**\n\n"
        for i, ip in enumerate(top_ips, 1):
            types_str = ", ".join(ip.get("types", [])[:2]) or "Unknown"
            reply += f"{i}. `{ip['_id'] or 'N/A'}` — **{ip['count']}** hits ({types_str})\n"
        reply += "\nNavigate to Active Defense to block any of these IPs."
        return ChatResponse(reply=reply, action_url="defense")

    # ── LIVE THREATS / ALERTS ─────────────────────────────
    if any(k in msg for k in ["latest threat", "recent threat", "show threat", "show alert", "list threat",
                               "current threat", "active threat", "threat now", "any threat", "new threat"]):
        recent = list(detections_collection.find(
            {"action": {"$in": HIGH_SEVERITY_ACTIONS}}
        ).sort("_id", -1).limit(5))
        if not recent:
            return ChatResponse(
                reply="✅ No high-severity threats in the recent logs. The system is operating normally.",
                action_url="threats"
            )
        reply = f"🚨 **{len(recent)} Latest High-Severity Detections**\n\n"
        for a in recent:
            ts = a.get("timestamp", "")
            if hasattr(ts, "strftime"):
                ts = ts.strftime("%H:%M %d/%m")
            reply += f"• **{a.get('type','Unknown')}** from `{a.get('source_ip','N/A')}` — {ts}\n"
        reply += "\nClick below to investigate."
        return ChatResponse(reply=reply, action_url="threats")

    # ── FAILED LOGINS / ACCOUNT STATUS ───────────────────
    if any(k in msg for k in ["login", "failed login", "locked", "account", "credential", "access"]):
        locked = list(users_collection.find({"account_locked": True}))
        failed = list(users_collection.find({"failed_attempts": {"$gt": 3}}))
        reply = "🔑 **Account & Login Status**\n\n"
        reply += f"• Locked accounts: **{len(locked)}**\n"
        if locked:
            reply += "  → " + ", ".join(u.get("username","?") for u in locked) + "\n"
        reply += f"• High failed-attempt accounts: **{len(failed)}**\n"
        if not locked and not failed:
            reply = "✅ All accounts are healthy — no locked accounts or excessive failed logins."
        return ChatResponse(reply=reply, action_url="settings")

    # ── FIREWALL / DEFENSE RULES ───────────────────────────
    if any(k in msg for k in ["firewall", "rule", "blocked ip", "defense", "protection", "block list"]):
        total_rules = firewall_rules_collection.count_documents({})
        active_rules = firewall_rules_collection.count_documents({"enabled": True})
        recent_rules = list(firewall_rules_collection.find().sort("_id", -1).limit(3))
        reply = f"🛡️ **Firewall & Defense Status**\n\n"
        reply += f"• Total rules configured: **{total_rules}**\n"
        reply += f"• Active rules: **{active_rules}**\n\n"
        if recent_rules:
            reply += "Recent rules:\n"
            for r in recent_rules:
                reply += f"• {r.get('action','UNKNOWN')} → `{r.get('source_ip') or r.get('destination_ip','?')}`\n"
        reply += "\nGo to Active Defense to manage rules."
        return ChatResponse(reply=reply, action_url="defense")

    # ── TRAFFIC / ML STATS ────────────────────────────────
    if any(k in msg for k in ["traffic", "analytics", "ml", "model", "accuracy", "detection", "prediction"]):
        total_traffic = captured_traffic_collection.count_documents({})
        reply = (
            f"📈 **Traffic & ML Analytics**\n\n"
            f"• Total packets analysed: **{total_traffic:,}**\n"
            f"• ML model: Random Forest / Gradient Boosting ensemble\n"
            f"• Detection method: Real-time feature extraction on live traffic\n\n"
            f"Navigate to AI Model for full performance metrics, confusion matrix, and retraining options."
        )
        return ChatResponse(reply=reply, action_url="model")

    # ── HOW TO BLOCK AN IP ────────────────────────────────
    if "block" in msg and "ip" in msg:
        return ChatResponse(
            reply=(
                "🚫 **How to Block an IP**\n\n"
                "1. Open **Active Defense** module\n"
                "2. Click **'+ Add Rule'**\n"
                "3. Set Action → **DROP**\n"
                "4. Enter the offending **Source IP**\n"
                "5. Click **Save** — rule activates immediately\n\n"
                "The IP will be blocked at the firewall level and logged."
            ),
            action_url="defense"
        )

    # ── RESET PASSWORD ────────────────────────────────────
    if "reset" in msg and ("password" in msg or "pass" in msg):
        return ChatResponse(
            reply=(
                "🔄 **How to Reset a User Password**\n\n"
                "1. Go to **Settings → Team Management**\n"
                "2. Find the user and click the **🔑 key icon**\n"
                "3. Enter a new password (min 8 characters)\n"
                "4. Confirm and click **Reset**\n\n"
                "All active sessions for that user will be invalidated immediately."
            ),
            action_url="settings"
        )

    # ── INCIDENT EXPLANATIONS ─────────────────────────────
    explanations = {
        ("ddos", "denial of service"): (
            "🌊 **DDoS — Distributed Denial of Service**\n\n"
            "Attackers use thousands of compromised devices (botnet) to flood your server with traffic, making it unreachable for legitimate users.\n\n"
            "**DefenXion response:** Volumetric spike detection → automatic rate-limiting → source IP block."
        ),
        ("brute force", "brute-force", "password guessing"): (
            "🔐 **Brute Force Attack**\n\n"
            "Attacker systematically tries thousands of username/password combinations until one works.\n\n"
            "**DefenXion response:** Detects rapid failed logins → auto-locks account → logs source IP."
        ),
        ("sql injection", "sqli", "sql inject"): (
            "💉 **SQL Injection (SQLi)**\n\n"
            "Attacker inserts malicious SQL code into input fields to query or delete database data.\n\n"
            "**DefenXion response:** WAF drops requests matching SQLi signatures before they reach the DB."
        ),
        ("port scan", "port scanning", "nmap"): (
            "🔍 **Port Scanning**\n\n"
            "Attackers probe your host's open ports to map services and find vulnerable entry points.\n\n"
            "**DefenXion response:** Detects scan patterns → flags source IP → triggers alert."
        ),
        ("xss", "cross-site scripting", "cross site scripting"): (
            "⚡ **XSS — Cross-Site Scripting**\n\n"
            "Malicious scripts injected into web pages run in other users' browsers, stealing sessions or credentials.\n\n"
            "**DefenXion response:** Input/output sanitisation + CSP headers block script execution."
        ),
        ("phishing",): (
            "🎣 **Phishing**\n\n"
            "Fraudulent emails or websites trick users into revealing login credentials or financial info.\n\n"
            "**Best practice:** Enable MFA, verify sender domains, train users on suspicious link recognition."
        ),
        ("ransomware",): (
            "💀 **Ransomware**\n\n"
            "Malware that encrypts your files and demands cryptocurrency payment for the decryption key.\n\n"
            "**Best practice:** Offline backups, patch management, restrict unsigned binary execution."
        ),
        ("man in the middle", "mitm", "arp spoofing"): (
            "👥 **Man-in-the-Middle (MITM)**\n\n"
            "Attacker intercepts communication between two parties to eavesdrop or alter data.\n\n"
            "**Best practice:** Enforce HTTPS/TLS everywhere, use certificate pinning, avoid public Wi-Fi."
        ),
    }
    for keywords, explanation in explanations.items():
        if any(k in msg for k in keywords):
            return ChatResponse(reply=explanation)

    # Generic "what is X / explain X / tell me about X / X means" —
    # check if message contains a known attack name in ANY phrasing
    KNOWN_ATTACKS = {
        "ddos":            "ddos",
        "denial of service": "ddos",
        "brute force":     "brute force",
        "password guess":  "brute force",
        "sql injection":   "sql injection",
        "port scan":       "port scan",
        "xss":             "xss",
        "cross site":      "xss",
        "phishing":        "phishing",
        "ransomware":      "ransomware",
        "man in the middle": "man in the middle",
        "malware":         "malware",
        "virus":           "virus",
        "vulnerability":   "vulnerability",
    }
    for phrase, canonical in KNOWN_ATTACKS.items():
        if phrase in msg:
            # Re-run explanation lookup with canonical name
            for keywords, explanation in explanations.items():
                if any(k in canonical for k in keywords) or any(canonical in k for k in keywords):
                    return ChatResponse(reply=explanation)

    # ── FALLBACK ──────────────────────────────────────────
    return ChatResponse(
        reply=(
            "👋 **Security Copilot — Command Guide**\n\n"
            "Here's what I can do:\n\n"
            "📡 `system status` — Overall health snapshot\n"
            "🚨 `latest threats` — Recent high-severity alerts\n"
            "🎯 `top attacking IPs` — Most active attackers\n"
            "📊 `generate report` — Full security summary\n"
            "🔑 `failed logins` — Account security check\n"
            "🛡️ `firewall rules` — Active defense status\n"
            "📈 `traffic analytics` — ML detection stats\n"
            "📚 `explain DDoS` — Any attack type explained\n\n"
            "What would you like to know?"
        )
    )
