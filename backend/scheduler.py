import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime, timedelta

from backend.database import (
    app_settings_collection,
    detections_collection,
)

scheduler = AsyncIOScheduler()

def get_stats_for_period(period: str):
    now = datetime.now()
    
    if period == "daily":
        start_date_filter = (now - timedelta(days=1)).strftime("%Y-%m-%d")
        period_label = "Past 24 Hours"
    elif period == "weekly":
        start_date_filter = (now - timedelta(days=7)).strftime("%Y-%m-%d")
        period_label = "Past 7 Days"
    elif period == "monthly":
        start_date_filter = (now - timedelta(days=30)).strftime("%Y-%m-%d")
        period_label = "Past 30 Days"
    else:
        start_date_filter = None
        period_label = "All Time"

    time_filter = {}
    if start_date_filter:
        time_filter["timestamp"] = {"$gte": start_date_filter}

    total_detections = detections_collection.count_documents(time_filter)
    total_blocks = detections_collection.count_documents({**time_filter, "action": {"$in": ["BLOCK_IP", "CRITICAL_BLOCK"]}})
    
    match_stage = {"prediction": 1, **time_filter}
    pipeline = [
        {"$match": match_stage},
        {"$group": {"_id": "$source_ip", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 3}
    ]
    top_sources = list(detections_collection.aggregate(pipeline))
    top_ips = ", ".join([f"{s['_id']} ({s['count']} hits)" for s in top_sources]) if top_sources else "None"

    return period_label, total_detections, total_blocks, top_ips

async def dispatch_automated_report(frequency: str):
    from backend.main import create_report_in_db
    settings = app_settings_collection.find_one({"key": "app_settings"}) or {}
    
    # 1. Generate Report in DB if enabled
    reports_cfg = settings.get("reports", {})
    auto_generate = reports_cfg.get("auto_generate", True)
    report_freq = reports_cfg.get("frequency", "weekly")
    
    report_data = None
    if auto_generate and (report_freq == "all" or report_freq == frequency):
        try:
            report_data = create_report_in_db(frequency, generated_by="system")
            print(f"[SCHEDULER] Automatically generated {frequency} report in DB.")
        except Exception as e:
            print(f"[SCHEDULER] Failed to generate {frequency} report in DB: {e}")
            
    # 2. Send Email if enabled
    notifications = settings.get("notifications", {})
    
    if not notifications.get("email_reports"):
        return

    configured_freq = notifications.get("email_report_frequency", "weekly")
    if configured_freq != "all" and configured_freq != frequency:
        return

    to_email = notifications.get("email_address")
    if not to_email:
        return

    smtp_cfg = settings.get("smtp", {})
    host = smtp_cfg.get("host")
    port = smtp_cfg.get("port", 587)
    user = smtp_cfg.get("username")
    pw = smtp_cfg.get("password")

    if not (host and user and pw):
        print(f"[SCHEDULER] Missing SMTP config for {frequency} report email")
        return

    if report_data:
        total_detections = report_data["summary"]["total_detections"]
        total_blocks = report_data["summary"]["total_blocks"]
        top_ips = ", ".join([f"{s['ip']} ({s['count']} hits)" for s in report_data["top_attack_sources"]]) if report_data["top_attack_sources"] else "None"
        period_label = report_data["period"]
    else:
        period_label, total_detections, total_blocks, top_ips = get_stats_for_period(frequency)

    # Build Email
    msg = MIMEMultipart("alternative")
    msg['From'] = f"DefenXion Security <{user}>"
    msg['To'] = to_email
    msg['Subject'] = f"DefenXion {frequency.capitalize()} Security Summary"

    html_content = f"""
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #0d1117; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #161b22; padding: 30px; border-radius: 8px; border: 1px solid #30363d;">
            <h2 style="color: #58a6ff; margin-top: 0;">DefenXion Security Report</h2>
            <p style="color: #8b949e;">Here is your automated <strong>{frequency}</strong> summary for {period_label}.</p>
            <hr style="border: none; border-top: 1px solid #30363d; margin: 20px 0;">
            <table style="width: 100%; text-align: left; color: #c9d1d9;">
                <tr>
                    <th style="padding: 10px 0; border-bottom: 1px solid #30363d;">Metric</th>
                    <th style="padding: 10px 0; border-bottom: 1px solid #30363d;">Value</th>
                </tr>
                <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #30363d;">Total Detections</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #30363d; font-weight: bold;">{total_detections}</td>
                </tr>
                <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #30363d;">Total Blocks</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #30363d; font-weight: bold; color: #ff7b72;">{total_blocks}</td>
                </tr>
                <tr>
                    <td style="padding: 10px 0;">Top Attack Sources</td>
                    <td style="padding: 10px 0; color: #8b949e;">{top_ips}</td>
                </tr>
            </table>
            <p style="margin-top: 30px; font-size: 12px; color: #8b949e; text-align: center;">This is an automated message from your DefenXion platform.</p>
        </div>
    </body>
    </html>
    """

    msg.attach(MIMEText("Please view this email in an HTML compatible client.", 'plain'))
    msg.attach(MIMEText(html_content, 'html'))

    try:
        server = smtplib.SMTP(host, port)
        server.starttls()
        server.login(user, pw)
        server.send_message(msg)
        server.quit()
        print(f"[SCHEDULER] Successfully dispatched {frequency} report to {to_email}")
    except Exception as e:
        print(f"[SCHEDULER] Failed to dispatch {frequency} report: {e}")

# Register jobs
scheduler.add_job(dispatch_automated_report, CronTrigger(hour=0, minute=0), args=["daily"], id="daily_report")
scheduler.add_job(dispatch_automated_report, CronTrigger(day_of_week='mon', hour=0, minute=0), args=["weekly"], id="weekly_report")
scheduler.add_job(dispatch_automated_report, CronTrigger(day=1, hour=0, minute=0), args=["monthly"], id="monthly_report")
