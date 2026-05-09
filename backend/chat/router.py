from fastapi import APIRouter, Depends
from pydantic import BaseModel
from datetime import datetime, timedelta, timezone
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
    secondary_action_url: str | None = None   # Second CTA button (e.g. CSV alongside PDF)
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
        # New intent keywords
        "pdf", "trend", "over time", "24 hour", "this week", "7 day", "last hour",
        "blocked", "ban list", "banned", "cve", "zero-day", "zero day", "zeroday",
        "patch", "unpatched", "compliance", "pci", "gdpr", "hipaa", "iso 27001",
        "sox", "nist", "regulation", "download",
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

        # ── Detect timeframe from natural language ──────────
        time_filter: dict = {}
        period_label = "All Time"

        if any(k in msg for k in ["last hour", "past hour", "1 hour"]):
            window_start = now - timedelta(hours=1)
            time_filter = {"timestamp": {"$gte": window_start}}
            period_label = "Last Hour"

        elif any(k in msg for k in ["today", "this day"]):
            window_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            time_filter = {"timestamp": {"$gte": window_start}}
            period_label = f"Today ({now.strftime('%d %b %Y')})"

        elif "yesterday" in msg:
            yesterday = now - timedelta(days=1)
            window_start = yesterday.replace(hour=0, minute=0, second=0, microsecond=0)
            window_end   = yesterday.replace(hour=23, minute=59, second=59, microsecond=999999)
            time_filter = {"timestamp": {"$gte": window_start, "$lte": window_end}}
            period_label = f"Yesterday ({yesterday.strftime('%d %b %Y')})"

        elif any(k in msg for k in ["last 24", "24 hour", "past 24"]):
            window_start = now - timedelta(hours=24)
            time_filter = {"timestamp": {"$gte": window_start}}
            period_label = "Last 24 Hours"

        elif any(k in msg for k in ["last 7", "7 day", "past 7"]):
            window_start = now - timedelta(days=7)
            time_filter = {"timestamp": {"$gte": window_start}}
            period_label = "Last 7 Days"

        elif any(k in msg for k in ["last 30", "30 day", "past 30"]):
            window_start = now - timedelta(days=30)
            time_filter = {"timestamp": {"$gte": window_start}}
            period_label = "Last 30 Days"

        elif any(k in msg for k in ["last 90", "90 day", "past 90", "last quarter", "quarter"]):
            window_start = now - timedelta(days=90)
            time_filter = {"timestamp": {"$gte": window_start}}
            period_label = "Last 90 Days (Quarter)"

        elif any(k in msg for k in ["this week", "current week"]):
            days_since_monday = now.weekday()
            window_start = (now - timedelta(days=days_since_monday)).replace(hour=0, minute=0, second=0, microsecond=0)
            time_filter = {"timestamp": {"$gte": window_start}}
            period_label = f"This Week (since {window_start.strftime('%d %b')})"

        elif any(k in msg for k in ["last week", "previous week", "weekly"]):
            days_since_monday = now.weekday()
            this_monday  = (now - timedelta(days=days_since_monday)).replace(hour=0, minute=0, second=0, microsecond=0)
            last_monday  = this_monday - timedelta(days=7)
            last_sunday  = this_monday - timedelta(seconds=1)
            time_filter  = {"timestamp": {"$gte": last_monday, "$lte": last_sunday}}
            period_label = f"Last Week ({last_monday.strftime('%d %b')} – {last_sunday.strftime('%d %b %Y')})"

        elif any(k in msg for k in ["this month", "current month", "monthly"]):
            window_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            time_filter  = {"timestamp": {"$gte": window_start}}
            period_label = f"This Month ({now.strftime('%B %Y')})"

        elif any(k in msg for k in ["last month", "previous month"]):
            first_of_this   = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            last_month_end  = first_of_this - timedelta(seconds=1)
            last_month_start = last_month_end.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            time_filter  = {"timestamp": {"$gte": last_month_start, "$lte": last_month_end}}
            period_label = f"Last Month ({last_month_start.strftime('%B %Y')})"

        elif any(k in msg for k in ["this year", "current year"]):
            window_start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
            time_filter  = {"timestamp": {"$gte": window_start}}
            period_label = f"This Year ({now.year})"

        elif any(k in msg for k in ["last year", "previous year"]):
            window_start = now.replace(year=now.year - 1, month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
            window_end   = now.replace(year=now.year - 1, month=12, day=31, hour=23, minute=59, second=59, microsecond=999999)
            time_filter  = {"timestamp": {"$gte": window_start, "$lte": window_end}}
            period_label = f"Last Year ({now.year - 1})"

        elif "daily" in msg or any(k in msg for k in ["today's", "todays"]):
            window_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            time_filter  = {"timestamp": {"$gte": window_start}}
            period_label = f"Today ({now.strftime('%d %b %Y')})"

        # ── Build time-filtered queries ──────────────────────
        attack_filter = {**time_filter, "action": {"$in": ATTACK_ACTIONS}}
        high_filter   = {**time_filter, "action": {"$in": HIGH_SEVERITY_ACTIONS}}
        medium_filter = {**time_filter, "action": "ALERT_ADMIN"}

        total_period  = detections_collection.count_documents(attack_filter)
        high_period   = detections_collection.count_documents(high_filter)
        medium_period = detections_collection.count_documents(medium_filter)
        low_period    = max(0, total_period - high_period - medium_period)

        # Top attack types in the period
        type_match   = {"$match": attack_filter}
        type_pipeline = [type_match, {"$group": {"_id": "$type", "count": {"$sum": 1}}},
                         {"$sort": {"count": -1}}, {"$limit": 5}]
        top_types = list(detections_collection.aggregate(type_pipeline))

        # Top attacker IPs in the period
        ip_match    = {"$match": attack_filter}
        ip_pipeline = [ip_match, {"$group": {"_id": "$source_ip", "count": {"$sum": 1}}},
                       {"$sort": {"count": -1}}, {"$limit": 3}]
        top_ips = list(detections_collection.aggregate(ip_pipeline))

        # ── Build reply ──────────────────────────────────────
        period_emoji = "📅" if time_filter else "📊"
        reply = (
            f"{period_emoji} **Security Report — {period_label}**\n\n"
            f"**Threat Summary**\n"
            f"• Total incidents: **{total_period}**\n"
            f"• High: **{high_period}**  |  Medium: **{medium_period}**  |  Low: **{low_period}**\n\n"
        )
        if not total_period and time_filter:
            reply += f"✅ No attacks detected during **{period_label}**. System was clean in this window.\n"
        else:
            if top_types:
                reply += "**Top Attack Types**\n"
                for t in top_types:
                    reply += f"• {t['_id'] or 'Unknown'} — {t['count']} incidents\n"
                reply += "\n"
            if top_ips:
                reply += "**Top Source IPs**\n"
                for ip in top_ips:
                    reply += f"• `{ip['_id'] or 'N/A'}` — {ip['count']} hits\n"

        reply += "\nDownload your report below — PDF for a branded document, CSV for raw data."
        return ChatResponse(reply=reply, action_url="export-pdf", secondary_action_url="export-csv")

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

    # ── THREAT TRENDS (time-bucketed) ────────────────────
    if any(k in msg for k in ["trend", "over time", "last 24", "24 hour", "this week", "7 day", "last hour", "hourly", "daily trend", "weekly trend"]):
        now = datetime.now(timezone.utc)
        # Determine window: 'hour' → last hour in 5-min buckets; else last 7 days in daily buckets
        is_hourly = any(k in msg for k in ["last hour", "hourly", "1 hour"])
        if is_hourly:
            window_start = now - timedelta(hours=1)
            fmt = "%H:%M"
            bucket_fmt = "%Y-%m-%dT%H:%M"
            bucket_size_ms = 5 * 60 * 1000  # 5-minute buckets
        else:
            window_start = now - timedelta(days=7)
            fmt = "%d %b"
            bucket_fmt = "%Y-%m-%d"
            bucket_size_ms = 24 * 60 * 60 * 1000  # daily buckets

        pipeline = [
            {"$match": {"timestamp": {"$gte": window_start}, "action": {"$in": ATTACK_ACTIONS}}},
            {"$group": {
                "_id": {"$dateToString": {"format": bucket_fmt, "date": "$timestamp"}},
                "count": {"$sum": 1}
            }},
            {"$sort": {"_id": 1}},
            {"$limit": 14}
        ]
        buckets = list(detections_collection.aggregate(pipeline))

        label = "Last Hour (5-min buckets)" if is_hourly else "Last 7 Days (daily)"
        if not buckets:
            return ChatResponse(
                reply=f"📈 **Threat Trends — {label}**\n\nNo attack events detected in this window. ✅ System looks clean!",
                action_url="threats"
            )

        total_in_window = sum(b["count"] for b in buckets)
        peak = max(buckets, key=lambda b: b["count"])
        reply = f"📈 **Threat Trends — {label}**\n\n"
        reply += f"• Total incidents in window: **{total_in_window}**\n"
        reply += f"• Peak period: **{peak['_id']}** ({peak['count']} events)\n\n"
        reply += "| Period | Events |\n|---|---:|\n"
        for b in buckets:
            bar = "█" * min(b["count"], 10) + ("…" if b["count"] > 10 else "")
            reply += f"| {b['_id']} | {b['count']} {bar} |\n"
        return ChatResponse(reply=reply, action_url="threats")

    # ── BLOCKED IPs ────────────────────────────────────────
    if any(k in msg for k in ["blocked ip", "block list", "ban list", "banned ip", "ip ban", "blocked addresses"]):
        pipeline = [
            {"$match": {"action": {"$in": ["BLOCK_IP", "CRITICAL_BLOCK"]}}},
            {"$group": {"_id": "$source_ip", "count": {"$sum": 1}, "last_seen": {"$max": "$timestamp"}}},
            {"$sort": {"count": -1}},
            {"$limit": 8}
        ]
        blocked = list(detections_collection.aggregate(pipeline))
        fw_total = firewall_rules_collection.count_documents({"action": {"$in": ["DROP", "BLOCK"]}})

        if not blocked:
            return ChatResponse(
                reply="🔒 **Blocked IPs**\n\nNo IPs have been automatically blocked yet. The system will block IPs when it detects CRITICAL or HIGH severity attacks.",
                action_url="defense"
            )
        reply = f"🔒 **Blocked IPs — Top Offenders**\n\n"
        reply += f"• Manual firewall DROP rules: **{fw_total}**\n"
        reply += f"• Auto-blocked by IDS: **{len(blocked)} unique IPs**\n\n"
        reply += "| # | IP Address | Block Count |\n|---|---|---:|\n"
        for i, b in enumerate(blocked, 1):
            ts = b["last_seen"]
            ts_str = ts.strftime("%d/%m %H:%M") if hasattr(ts, "strftime") else str(ts)
            reply += f"| {i} | `{b['_id'] or 'N/A'}` | {b['count']} (last: {ts_str}) |\n"
        reply += "\nGo to Active Defense to manage or unblock IPs."
        return ChatResponse(reply=reply, action_url="defense")

    # ── GENERATE / DOWNLOAD PDF REPORT ────────────────────
    if any(k in msg for k in ["pdf", "download pdf", "export pdf", "generate pdf", "pdf report", "download report"]):
        s = get_system_snapshot()
        ip_pipeline = [{"$group": {"_id": "$source_ip", "count": {"$sum": 1}}},
                       {"$sort": {"count": -1}}, {"$limit": 3}]
        top_ips = list(detections_collection.aggregate(ip_pipeline))
        type_pipeline = [{"$group": {"_id": "$type", "count": {"$sum": 1}}},
                         {"$sort": {"count": -1}}, {"$limit": 5}]
        top_types = list(detections_collection.aggregate(type_pipeline))

        reply = (
            f"📄 **PDF Security Report Ready — {datetime.now(timezone.utc).strftime('%d %b %Y')}**\n\n"
            f"**Summary**\n"
            f"• Total incidents: {s['total']}\n"
            f"• High: {s['high']}  |  Medium: {s['medium']}  |  Low: {s['low']}\n"
            f"• Locked accounts: {s['locked']}  |  Firewall rules: {s['rules']}\n\n"
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
        reply += "\nClick **'Download PDF'** below to save a professionally formatted report."
        return ChatResponse(reply=reply, action_url="export-pdf")

    # ── CVE / ZERO-DAY / VULNERABILITY ───────────────────
    if any(k in msg for k in ["cve", "zero-day", "zero day", "zeroday", "unpatched", "patch", "vulnerability", "exploit", "cwe"]):
        return ChatResponse(
            reply=(
                "🔬 **Vulnerability & Zero-Day Threats**\n\n"
                "A **CVE (Common Vulnerabilities and Exposures)** is a publicly disclosed software vulnerability.\n"
                "A **zero-day** is a vulnerability that is actively exploited *before* the vendor has released a patch.\n\n"
                "**DefenXion posture:**\n"
                "• IDS rules are updated to flag known exploit signatures\n"
                "• Any inbound payload matching CVE patterns triggers ALERT_ADMIN\n"
                "• Critical exploits auto-trigger CRITICAL_BLOCK on the source IP\n\n"
                "**Best practices:**\n"
                "• Patch OS & dependencies within 48 h of CVE publication\n"
                "• Enable automatic security updates\n"
                "• Monitor NIST NVD (nvd.nist.gov) for new CVEs\n"
                "• Use WAF rules to block known exploit payloads at the edge"
            ),
            action_url="defense"
        )

    # ── COMPLIANCE / AUDIT ────────────────────────────────
    if any(k in msg for k in ["audit", "compliance", "pci", "gdpr", "hipaa", "iso 27001", "sox", "nist", "regulation", "log export"]):
        return ChatResponse(
            reply=(
                "📋 **Audit & Compliance**\n\n"
                "DefenXion captures all security events in tamper-evident logs suitable for compliance audits.\n\n"
                "**Supported frameworks:**\n"
                "• **PCI-DSS** — Network intrusion detection, access logging, IP blocking evidence\n"
                "• **GDPR** — Access audit trails, failed login records, data-breach indicators\n"
                "• **HIPAA** — Authentication logs, session records, anomaly reports\n"
                "• **ISO 27001** — Incident management logs, risk evidence, response timelines\n\n"
                "**To export logs for audit:**\n"
                "1. Go to **Reports & Logs** module\n"
                "2. Generate a report for the required period\n"
                "3. Click **PDF** for a formatted audit report or **CSV** for raw data\n\n"
                "All exports include timestamps, source IPs, action taken, and analyst ID."
            ),
            action_url="reports"
        )

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
            "📊 `generate report` — Full security summary (CSV)\n"
            "📄 `download pdf` — Branded PDF security report\n"
            "📈 `threat trends` — Time-bucketed attack trends\n"
            "🔒 `blocked IPs` — IPs blocked by the IDS\n"
            "🔑 `failed logins` — Account security check\n"
            "🛡️ `firewall rules` — Active defense status\n"
            "🔬 `CVE / zero-day` — Vulnerability explanations\n"
            "📋 `compliance audit` — PCI, GDPR, HIPAA guidance\n"
            "📚 `explain DDoS` — Any attack type explained\n\n"
            "What would you like to know?"
        )
    )
