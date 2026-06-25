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
