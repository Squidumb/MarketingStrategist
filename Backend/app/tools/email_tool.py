"""Email delivery via direct SMTP (no external Logic App dependency)."""
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.config import get_settings


def _to_html(content: str) -> str:
    content = content.replace("#", "")
    lines = content.split("\n")
    return "".join(f"<p>{line}</p>" for line in lines)


def send_campaign_email(to_email: str, content: str) -> None:
    settings = get_settings()
    if not settings.smtp_host or not settings.smtp_from_email:
        raise RuntimeError("SMTP is not configured (see .env.example).")

    parsed_content = _to_html(content)
    email_body_html = f"""
<html><body>
<p><strong>Dear Recipient,</strong></p>
<p>Here is the strategy report generated for your campaign:</p>
{parsed_content}
<p>Best regards,<br><strong>Your Marketing Team</strong></p>
</body></html>
"""
    message = MIMEMultipart("alternative")
    message["Subject"] = "Your Campaign Strategy Report"
    message["From"] = settings.smtp_from_email
    message["To"] = to_email
    message.attach(MIMEText(email_body_html, "html"))

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as server:
        if settings.smtp_use_tls:
            server.starttls()
        if settings.smtp_username:
            server.login(settings.smtp_username, settings.smtp_password)
        server.sendmail(settings.smtp_from_email, [to_email], message.as_string())
