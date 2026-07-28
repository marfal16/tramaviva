"""Servizio per l'invio di email di conferma iscrizione"""
import os
import logging
from datetime import datetime

try:
    import aiosmtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart
    HAS_SMTP = True
except ImportError:
    HAS_SMTP = False

logger = logging.getLogger(__name__)

WHATSAPP_LINK = "https://chat.whatsapp.com/IXeTAXUIfdK54NiJEaO7Pt"
INSTAGRAM_LINK = "https://www.instagram.com/tramavivaaps/"
TIKTOK_LINK = "https://www.tiktok.com/@tramavivaaps"
SITE_LINK = "https://www.tramavivaaps.com"


class EmailService:

    def __init__(self):
        self.smtp_host = os.environ.get("SMTP_HOST", "smtp.gmail.com")
        self.smtp_port = int(os.environ.get("SMTP_PORT", "587"))
        self.smtp_user = os.environ.get("SMTP_USER", "")
        self.smtp_password = os.environ.get("SMTP_PASSWORD", "")
        self.from_email = os.environ.get("FROM_EMAIL", "noreply@tramavivaaps.it")
        self.from_name = os.environ.get("FROM_NAME", "Trama Viva APS")

    async def send_admin_notification(self, subject: str, info: dict):
        admin_email = os.environ.get("ADMIN_EMAIL", "tramavivaaps@gmail.com")
        if not HAS_SMTP or not self.smtp_user or not admin_email:
            logger.warning("Notifica admin saltata: SMTP non configurato")
            return
        try:
            html_body = self._get_admin_notification_html(subject, info)
            await self._send_smtp(admin_email, subject, html_body)
            logger.info(f"Notifica admin inviata: {subject}")
        except Exception as e:
            logger.error(f"Errore notifica admin: {e}")

    async def send_registration_confirmation(self, email: str, first_name: str, registration_id: str):
        if not HAS_SMTP or not self.smtp_user:
            logger.warning(f"Email service non configurato. Email saltata per {email}")
            return
        try:
            subject = "Richiesta Iscrizione Trama Viva!"
            html_body = self._get_registration_confirmation_template(first_name=first_name)
            await self._send_smtp(email, subject, html_body)
            logger.info(f"Email di conferma iscrizione inviata a {email}")
        except Exception as e:
            logger.error(f"Errore nell'invio dell'email di iscrizione: {e}")

    async def send_event_confirmation(self, email: str, name: str, event_title: str, event_date: str, event_time: str, event_location: str):
        if not HAS_SMTP or not self.smtp_user:
            logger.warning(f"Email service non configurato. Email evento saltata per {email}")
            return
        try:
            subject = f"Presenza confermata: {event_title}"
            html_body = self._get_event_confirmation_template(
                name=name,
                event_title=event_title,
                event_date=event_date,
                event_time=event_time,
                event_location=event_location,
            )
            await self._send_smtp(email, subject, html_body)
            logger.info(f"Email conferma evento inviata a {email}")
        except Exception as e:
            logger.error(f"Errore invio email conferma evento: {e}")

    async def send_event_reminder(self, email: str, name: str, event_title: str, event_date: str, event_time: str, event_location: str):
        if not HAS_SMTP or not self.smtp_user:
            logger.warning(f"Email service non configurato. Reminder saltato per {email}")
            return
        try:
            subject = f"📅 Reminder: {event_title} — ci vediamo presto!"
            html_body = self._get_event_reminder_template(
                name=name, event_title=event_title,
                event_date=event_date, event_time=event_time, event_location=event_location,
            )
            await self._send_smtp(email, subject, html_body)
            logger.info(f"Reminder evento inviato a {email}")
        except Exception as e:
            logger.error(f"Errore invio reminder evento: {e}")

    async def send_event_cancellation(self, email: str, name: str, event_title: str, event_date: str, event_time: str, event_location: str):
        if not HAS_SMTP or not self.smtp_user:
            logger.warning(f"Email service non configurato. Email cancellazione saltata per {email}")
            return
        try:
            subject = f"Ci mancherai: {event_title}"
            html_body = self._get_event_cancellation_template(
                name=name,
                event_title=event_title,
                event_date=event_date,
                event_time=event_time,
                event_location=event_location,
            )
            await self._send_smtp(email, subject, html_body)
            logger.info(f"Email cancellazione evento inviata a {email}")
        except Exception as e:
            logger.error(f"Errore invio email cancellazione evento: {e}")

    async def _send_smtp(self, to_email: str, subject: str, html_body: str):
        if not HAS_SMTP:
            logger.warning("aiosmtplib non disponibile")
            return
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{self.from_name} <{self.from_email}>"
        msg["To"] = to_email
        msg.attach(MIMEText(html_body, "html", "utf-8"))
        async with aiosmtplib.SMTP(hostname=self.smtp_host, port=self.smtp_port) as smtp:
            await smtp.login(self.smtp_user, self.smtp_password)
            await smtp.sendmail(self.from_email, to_email, msg.as_string())

    def _get_admin_notification_html(self, subject: str, info: dict) -> str:
        rows = "".join(
            f"<tr><td style='padding:6px 12px;color:#666;font-size:14px;white-space:nowrap;border-bottom:1px solid #f0f0f0;'>{k}</td>"
            f"<td style='padding:6px 12px;font-weight:bold;font-size:14px;border-bottom:1px solid #f0f0f0;'>{v}</td></tr>"
            for k, v in info.items() if v
        )
        return f"""<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="font-family:sans-serif;background:#F9ECD4;margin:0;padding:20px;">
  <div style="max-width:520px;margin:auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:#2D3A18;padding:20px 24px;">
      <p style="margin:0;color:#92C8B9;font-size:11px;font-weight:bold;letter-spacing:.1em;text-transform:uppercase;">Trama Viva APS · Notifica</p>
      <h1 style="margin:6px 0 0;color:white;font-size:20px;">🔔 {subject}</h1>
    </div>
    <div style="padding:24px;">
      <table style="width:100%;border-collapse:collapse;">{rows}</table>
      <div style="margin-top:20px;">
        <a href="{SITE_LINK}/admin" style="display:inline-block;background:#2D3A18;color:white;padding:10px 20px;border-radius:999px;text-decoration:none;font-weight:bold;font-size:14px;">Vai alla dashboard →</a>
      </div>
    </div>
  </div>
</body></html>"""

    def _social_links_html(self) -> str:
        return f"""
            <div style="background: linear-gradient(135deg, #5CB176 0%, #92C8B9 100%); border-radius: 12px; padding: 24px; margin: 28px 0;">
                <p style="color: white; font-weight: bold; font-size: 15px; margin: 0 0 14px 0;">Nel frattempo puoi già:</p>
                <ul style="color: white; padding-left: 20px; margin: 0; font-size: 14px; line-height: 2.2;">
                    <li>💬 Entrare nella nostra <a href="{WHATSAPP_LINK}" style="color: white; font-weight: bold; text-decoration: underline;">community WhatsApp</a> — è il posto più veloce per restare aggiornat*!</li>
                    <li>📅 Dare un'occhiata agli <a href="{SITE_LINK}" style="color: white; font-weight: bold; text-decoration: underline;">eventi sul sito</a></li>
                    <li>📱 Seguirci su Instagram <a href="{INSTAGRAM_LINK}" style="color: white; font-weight: bold; text-decoration: underline;">@tramavivaaps</a> e TikTok <a href="{TIKTOK_LINK}" style="color: white; font-weight: bold; text-decoration: underline;">@tramavivaaps</a></li>
                    <li>📧 Scriverci a <strong>tramavivaaps@gmail.com</strong> per qualsiasi domanda</li>
                </ul>
            </div>
        """

    def _base_styles(self) -> str:
        return """
            body { font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #2D3A18; background: #F9ECD4; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
            .header { padding: 40px 20px; text-align: center; color: white; }
            .header h1 { margin: 0; font-size: 28px; font-weight: 900; }
            .content { padding: 40px 30px; }
            .content h2 { margin-top: 0; }
            .content p { color: #2D3A18; margin-bottom: 15px; font-size: 15px; }
            .box { background: #F9ECD4; border-radius: 8px; padding: 20px; margin: 20px 0; font-size: 15px; }
            .box p { margin: 6px 0; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #eee; }
        """

    def _get_registration_confirmation_template(self, first_name: str) -> str:
        return f"""<!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                {self._base_styles()}
                .header {{ background: linear-gradient(135deg, #5CB176 0%, #92C8B9 100%); }}
                .content h2 {{ color: #5CB176; }}
                .box-green {{ border-left: 4px solid #5CB176; }}
                .box-bordeaux {{ border-left: 4px solid #5D1723; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Benvenut* in Trama Viva! 🧵</h1>
                </div>
                <div class="content">
                    <h2>Ciao {first_name}! 👋</h2>
                    <p>Grazie per aver scelto di far parte di <strong>Trama Viva APS</strong> — siamo davvero felici di accoglierti!</p>
                    <p>Abbiamo ricevuto la tua richiesta di iscrizione e abbiamo già tutto quello che ci serve.</p>

                    <div class="box box-green">
                        <p>📋 <strong>Cosa abbiamo ricevuto</strong></p>
                        <p>Il modulo di iscrizione precompilato con i tuoi dati e le tue preferenze, pronto per la firma.</p>
                    </div>

                    <div class="box box-bordeaux">
                        <p>✍️ <strong>Un ultimo passo — la firma</strong></p>
                        <p>La tua iscrizione diventa ufficiale con la firma del modulo associativo. Non ti preoccupare: la facciamo insieme, di persona, al nostro primo incontro. È anche il modo migliore per conoscersi! 😊</p>
                    </div>

                    {self._social_links_html()}

                    <p style="margin-top: 28px;"><em>A presto — non vediamo l'ora di intrecciare il tuo filo con il nostro!</em></p>
                    <p><strong>Il team di Trama Viva APS</strong></p>
                </div>
                <div class="footer">
                    <p>Trama Viva APS | "Intrecciamo storie, persone e opportunità"</p>
                </div>
            </div>
        </body>
        </html>"""

    def _get_event_confirmation_template(self, name: str, event_title: str, event_date: str, event_time: str, event_location: str) -> str:
        return f"""<!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                {self._base_styles()}
                .header {{ background: linear-gradient(135deg, #5CB176 0%, #92C8B9 100%); }}
                .content h2 {{ color: #5CB176; }}
                .box {{ border-left: 4px solid #5CB176; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>✅ Presenza confermata!</h1>
                </div>
                <div class="content">
                    <h2>Ciao {name}!</h2>
                    <p>La tua presenza all'evento <strong>{event_title}</strong> è stata confermata dal team di Trama Viva APS.</p>
                    <div class="box">
                        <p>📅 <strong>{event_date}</strong> alle <strong>{event_time}</strong></p>
                        <p>📍 {event_location}</p>
                    </div>
                    <p>Qualche piccolo consiglio:</p>
                    <ul style="font-size: 14px; line-height: 2; padding-left: 20px;">
                        <li>✓ Arriva qualche minuto prima dell'orario indicato</li>
                        <li>✓ Se non riesci a venire, faccelo sapere il prima possibile</li>
                    </ul>

                    {self._social_links_html()}

                    <p style="margin-top: 28px;"><em>Non vediamo l'ora di vederti! A presto,</em></p>
                    <p><strong>Il team di Trama Viva APS</strong></p>
                </div>
                <div class="footer">
                    <p>Trama Viva APS | "Intrecciamo storie, persone e opportunità"</p>
                </div>
            </div>
        </body>
        </html>"""

    def _get_event_reminder_template(self, name: str, event_title: str, event_date: str, event_time: str, event_location: str) -> str:
        return f"""<!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                {self._base_styles()}
                .header {{ background: linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%); }}
                .content h2 {{ color: #D97706; }}
                .box {{ border-left: 4px solid #F59E0B; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📅 Ci vediamo presto!</h1>
                </div>
                <div class="content">
                    <h2>Ciao {name}!</h2>
                    <p>Ti scriviamo per ricordarti dell'evento a cui hai confermato la partecipazione:</p>
                    <div class="box">
                        <p><strong>🎉 {event_title}</strong></p>
                        <p>📅 <strong>{event_date}</strong> alle <strong>{event_time}</strong></p>
                        <p>📍 {event_location}</p>
                    </div>
                    <p>Se per qualsiasi motivo non riesci a venire, ti chiediamo gentilmente di avvisarci il prima possibile scrivendo a <strong>tramavivaaps@gmail.com</strong>.</p>
                    {self._social_links_html()}
                    <p style="margin-top: 28px;"><em>Non vediamo l'ora di vederti! A presto,</em></p>
                    <p><strong>Il team di Trama Viva APS</strong></p>
                </div>
                <div class="footer">
                    <p>Trama Viva APS | "Intrecciamo storie, persone e opportunità"</p>
                </div>
            </div>
        </body>
        </html>"""

    async def send_participant_notification(self, email: str, name: str, subject: str, body_text: str, notification_type: str, event_title: str):
        if not HAS_SMTP or not self.smtp_user:
            logger.warning(f"Email service non configurato. Notifica saltata per {email}")
            return
        try:
            html_body = self._get_participant_notification_template(
                body_text=body_text, notification_type=notification_type, event_title=event_title
            )
            await self._send_smtp(email, subject, html_body)
            logger.info(f"Notifica partecipante inviata a {email} [{notification_type}]")
        except Exception as e:
            logger.error(f"Errore invio notifica partecipante: {e}")
            raise

    def _get_participant_notification_template(self, body_text: str, notification_type: str, event_title: str) -> str:
        configs = {
            "reminder":        {"emoji": "📅", "label": "Reminder evento",         "header": "linear-gradient(135deg, #2D3A18 0%, #5CB176 100%)", "accent": "#2D6A4F", "bg": "#F0F7F4"},
            "cambio_location": {"emoji": "📍", "label": "Aggiornamento location",  "header": "linear-gradient(135deg, #F97316 0%, #FB923C 100%)",  "accent": "#EA580C", "bg": "#FFF7ED"},
            "cambio_data":     {"emoji": "📅", "label": "Cambio data",             "header": "linear-gradient(135deg, #0284C7 0%, #38BDF8 100%)",  "accent": "#0369A1", "bg": "#F0F9FF"},
            "cambio_orario":   {"emoji": "🕐", "label": "Cambio orario",           "header": "linear-gradient(135deg, #B45309 0%, #F59E0B 100%)",  "accent": "#92400E", "bg": "#FFFBEB"},
            "annullamento":    {"emoji": "❌", "label": "Evento annullato",         "header": "linear-gradient(135deg, #5D1723 0%, #9F1239 100%)",  "accent": "#881337", "bg": "#FFF1F2"},
            "avviso_generico": {"emoji": "📢", "label": "Avviso",                  "header": "linear-gradient(135deg, #2D3A18 0%, #5CB176 100%)", "accent": "#2D6A4F", "bg": "#F0F7F4"},
        }
        cfg = configs.get(notification_type, configs["avviso_generico"])
        body_html = "".join(
            f"<p style='margin:0 0 16px;font-size:15px;color:#2D3A18;line-height:1.75;'>{para.replace(chr(10), '<br>')}</p>"
            for para in body_text.split("\n\n") if para.strip()
        )
        return f"""<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:'Manrope',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#F9ECD4;margin:0;padding:24px 12px;">
  <div style="max-width:600px;margin:0 auto;border-radius:24px;overflow:hidden;box-shadow:0 6px 30px rgba(0,0,0,0.15);">

    <!-- Header -->
    <div style="background:{cfg['header']};padding:36px 32px 30px;">
      <p style="margin:0 0 8px;font-size:11px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:rgba(255,255,255,.70);">{cfg['emoji']} {cfg['label']}</p>
      <h1 style="margin:0;font-size:28px;font-weight:900;color:white;line-height:1.2;letter-spacing:-.02em;">{event_title}</h1>
    </div>

    <!-- Accent stripe -->
    <div style="height:5px;background:{cfg['accent']};opacity:.35;"></div>

    <!-- Content -->
    <div style="background:white;padding:36px 32px 28px;">
      {body_html}
    </div>

    <!-- Colored footer band -->
    <div style="background:{cfg['bg']};border-top:2px solid {cfg['accent']}22;padding:22px 32px;text-align:center;">
      <p style="margin:0;font-size:13px;font-weight:700;color:{cfg['accent']};">Trama Viva APS</p>
      <p style="margin:4px 0 0;font-size:12px;color:#888;">"Intrecciamo storie, persone e opportunità"</p>
      <p style="margin:10px 0 0;font-size:11px;color:#aaa;">Hai ricevuto questa email perché sei iscritto a un nostro evento.</p>
    </div>

  </div>
</body>
</html>"""

    def _get_event_cancellation_template(self, name: str, event_title: str, event_date: str, event_time: str, event_location: str) -> str:
        return f"""<!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                {self._base_styles()}
                .header {{ background: linear-gradient(135deg, #5D1723 0%, #8c2a38 100%); }}
                .content h2 {{ color: #5D1723; }}
                .box {{ border-left: 4px solid #5D1723; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Ci mancherai 💙</h1>
                </div>
                <div class="content">
                    <h2>Ciao {name},</h2>
                    <p>Ci dispiace sapere che non potrai essere con noi per <strong>{event_title}</strong>. Speriamo di rivederti presto!</p>
                    <div class="box">
                        <p>📅 <strong>{event_date}</strong> alle <strong>{event_time}</strong></p>
                        <p>📍 {event_location}</p>
                    </div>
                    <p>Non preoccuparti — Trama Viva ti aspetta al prossimo appuntamento!</p>

                    {self._social_links_html()}

                    <p style="margin-top: 28px;"><em>A presto,</em></p>
                    <p><strong>Il team di Trama Viva APS</strong></p>
                </div>
                <div class="footer">
                    <p>Trama Viva APS | "Intrecciamo storie, persone e opportunità"</p>
                </div>
            </div>
        </body>
        </html>"""
