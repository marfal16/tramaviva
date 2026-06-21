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


class EmailService:
    """
    Servizio per l'invio di email.
    Supporta SMTP standard e servizi come SendGrid (tramite SMTP).
    """
    
    def __init__(self):
        self.smtp_host = os.environ.get("SMTP_HOST", "smtp.gmail.com")
        self.smtp_port = int(os.environ.get("SMTP_PORT", "587"))
        self.smtp_user = os.environ.get("SMTP_USER", "")
        self.smtp_password = os.environ.get("SMTP_PASSWORD", "")
        self.from_email = os.environ.get("FROM_EMAIL", "noreply@tramavivaaps.it")
        self.from_name = os.environ.get("FROM_NAME", "Trama Viva APS")
    
    async def send_registration_confirmation(self, email: str, first_name: str, registration_id: str):
        """
        Invia email di conferma iscrizione.
        """
        if not HAS_SMTP or not self.smtp_user:
            logger.warning(f"Email service non configurato. Email saltata per {email}")
            return
        
        try:
            subject = "Grazie per la tua iscrizione a Trama Viva APS!"
            
            # Crea l'HTML dell'email
            html_body = self._get_registration_confirmation_template(
                first_name=first_name,
                registration_id=registration_id
            )
            
            await self._send_smtp(email, subject, html_body)
            
            logger.info(f"Email di conferma inviata a {email}")
            
        except Exception as e:
            logger.error(f"Errore nell'invio dell'email: {e}")
            # Non solleva eccezione per non interrompere il flusso
    
    async def send_event_confirmation(self, email: str, name: str, event_title: str, event_date: str, event_time: str, event_location: str):
        """Invia email di conferma partecipazione all'evento."""
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
        """Invia email di cancellazione partecipazione all'evento."""
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
        """
        Invia un'email tramite SMTP.
        """
        if not HAS_SMTP:
            logger.warning("aiosmtplib non disponibile")
            return
        
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{self.from_name} <{self.from_email}>"
        msg["To"] = to_email
        
        # Aggiungi il corpo HTML
        html_part = MIMEText(html_body, "html", "utf-8")
        msg.attach(html_part)
        
        # Invia via SMTP
        async with aiosmtplib.SMTP(hostname=self.smtp_host, port=self.smtp_port) as smtp:
            await smtp.login(self.smtp_user, self.smtp_password)
            await smtp.sendmail(self.from_email, to_email, msg.as_string())
    
    def _get_registration_confirmation_template(self, first_name: str, registration_id: str) -> str:
        """
        Template HTML per l'email di conferma iscrizione.
        """
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{
                    font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    line-height: 1.6;
                    color: #2D3A18;
                    background: #F9ECD4;
                    margin: 0;
                    padding: 0;
                }}
                .container {{
                    max-width: 600px;
                    margin: 20px auto;
                    background: white;
                    border-radius: 20px;
                    overflow: hidden;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
                }}
                .header {{
                    background: linear-gradient(135deg, #5CB176 0%, #92C8B9 100%);
                    color: white;
                    padding: 40px 20px;
                    text-align: center;
                }}
                .header h1 {{
                    margin: 0;
                    font-size: 28px;
                    font-weight: 900;
                }}
                .content {{
                    padding: 40px 30px;
                }}
                .content h2 {{
                    color: #5CB176;
                    margin-top: 0;
                }}
                .content p {{
                    color: #2D3A18;
                    margin-bottom: 15px;
                }}
                .highlight {{
                    background: #F9ECD4;
                    padding: 20px;
                    border-left: 4px solid #5CB176;
                    border-radius: 8px;
                    margin: 20px 0;
                }}
                .highlight strong {{
                    color: #5CB176;
                }}
                .footer {{
                    background: #f8f9fa;
                    padding: 20px;
                    text-align: center;
                    font-size: 12px;
                    color: #666;
                    border-top: 1px solid #eee;
                }}
                .cta-button {{
                    display: inline-block;
                    background: #5CB176;
                    color: white;
                    padding: 12px 30px;
                    border-radius: 20px;
                    text-decoration: none;
                    font-weight: bold;
                    margin: 20px 0;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Benvenuto* a Trama Viva!</h1>
                </div>
                <div class="content">
                    <h2>Ciao {first_name}! 👋</h2>
                    
                    <p>Grazie mille per esserti iscritto a <strong>Trama Viva APS</strong>!</p>
                    
                    <div class="highlight">
                        <p><strong>La tua iscrizione</strong> è stata registrata con successo. Abbiamo ricevuto i tuoi dati personali e il tuo pagamento è in corso di elaborazione.</p>
                    </div>
                    
                    <h3>Cosa succede adesso?</h3>
                    <p>La tua iscrizione sarà ultimata non appena ci incontreremo per procedere con la <strong>firma ufficiale del documento</strong>. Nel frattempo:</p>
                    
                    <ul>
                        <li>✓ I tuoi dati sono al sicuro e protetti secondo la normativa GDPR</li>
                        <li>✓ Riceverai presto informazioni su come programmare il nostro primo incontro</li>
                        <li>✓ Potrai partecipare agli eventi pubblici indicati sul nostro sito</li>
                        <li>✓ Rimani aggiornato sui nostri canali social @tramavivaaps</li>
                    </ul>
                    
                    <div class="highlight">
                        <p><strong>ID Registrazione:</strong> <code>{registration_id[:8]}</code><br/>
                        Conserva questo codice per qualsiasi chiarimento futuro.</p>
                    </div>
                    
                    <h3>Domande?</h3>
                    <p>Se hai domande o hai bisogno di aiuto, contattaci pure:</p>
                    <ul>
                        <li>📧 Email: <strong>tramavivaaps@gmail.com</strong></li>
                        <li>📱 Instagram: <strong>@tramavivaaps</strong></li>
                    </ul>
                    
                    <p><em>A presto, e grazie ancora per aver scelto di intrecciare il tuo filo con il nostro!</em></p>
                    
                    <p><strong>Il team di Trama Viva</strong></p>
                </div>
                <div class="footer">
                    <p>Trama Viva APS | "Intrecciamo storie, persone e opportunità"</p>
                    <p>Generated: {datetime.now().strftime('%d/%m/%Y %H:%M')}</p>
                </div>
            </div>
        </body>
        </html>
        """

    def _get_event_confirmation_template(self, name: str, event_title: str, event_date: str, event_time: str, event_location: str) -> str:
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{
                    font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    line-height: 1.6;
                    color: #2D3A18;
                    background: #F9ECD4;
                    margin: 0;
                    padding: 0;
                }}
                .container {{
                    max-width: 600px;
                    margin: 20px auto;
                    background: white;
                    border-radius: 20px;
                    overflow: hidden;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                }}
                .header {{
                    background: linear-gradient(135deg, #5CB176 0%, #92C8B9 100%);
                    color: white;
                    padding: 40px 20px;
                    text-align: center;
                }}
                .header h1 {{ margin: 0; font-size: 28px; font-weight: 900; }}
                .content {{ padding: 40px 30px; }}
                .content h2 {{ color: #5CB176; margin-top: 0; }}
                .event-box {{
                    background: #F9ECD4;
                    border-left: 4px solid #5CB176;
                    border-radius: 8px;
                    padding: 20px;
                    margin: 20px 0;
                    font-size: 15px;
                }}
                .event-box p {{ margin: 6px 0; }}
                .footer {{
                    background: #f8f9fa;
                    padding: 20px;
                    text-align: center;
                    font-size: 12px;
                    color: #666;
                    border-top: 1px solid #eee;
                }}
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
                    <div class="event-box">
                        <p>📅 <strong>{event_date}</strong> alle <strong>{event_time}</strong></p>
                        <p>📍 {event_location}</p>
                    </div>
                    <p>Qualche piccolo consiglio:</p>
                    <ul>
                        <li>✓ Arriva qualche minuto prima dell'orario indicato</li>
                        <li>✓ Se non riesci a venire, faccelo sapere il prima possibile</li>
                        <li>✓ Per qualsiasi info scrivici a <strong>tramavivaaps@gmail.com</strong></li>
                    </ul>
                    <p><em>Non vediamo l'ora di vederti! A presto,</em></p>
                    <p><strong>Il team di Trama Viva APS</strong></p>
                </div>
                <div class="footer">
                    <p>Trama Viva APS | "Intrecciamo storie, persone e opportunità"</p>
                    <p>Generated: {datetime.now().strftime('%d/%m/%Y %H:%M')}</p>
                </div>
            </div>
        </body>
        </html>
        """

    def _get_event_cancellation_template(self, name: str, event_title: str, event_date: str, event_time: str, event_location: str) -> str:
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{
                    font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    line-height: 1.6; color: #2D3A18; background: #F9ECD4; margin: 0; padding: 0;
                }}
                .container {{
                    max-width: 600px; margin: 20px auto; background: white;
                    border-radius: 20px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                }}
                .header {{
                    background: linear-gradient(135deg, #5D1723 0%, #8c2a38 100%);
                    color: white; padding: 40px 20px; text-align: center;
                }}
                .header h1 {{ margin: 0; font-size: 28px; font-weight: 900; }}
                .content {{ padding: 40px 30px; }}
                .content h2 {{ color: #5D1723; margin-top: 0; }}
                .event-box {{
                    background: #F9ECD4; border-left: 4px solid #5D1723;
                    border-radius: 8px; padding: 20px; margin: 20px 0; font-size: 15px;
                }}
                .event-box p {{ margin: 6px 0; }}
                .footer {{
                    background: #f8f9fa; padding: 20px; text-align: center;
                    font-size: 12px; color: #666; border-top: 1px solid #eee;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header"><h1>Ci mancherai 💙</h1></div>
                <div class="content">
                    <h2>Ciao {name},</h2>
                    <p>Ci dispiace sapere che non potrai essere con noi per <strong>{event_title}</strong>. Speriamo di rivederti presto!</p>
                    <div class="event-box">
                        <p>📅 <strong>{event_date}</strong> alle <strong>{event_time}</strong></p>
                        <p>📍 {event_location}</p>
                    </div>
                    <p>Non preoccuparti — ti avvisiamo per i prossimi eventi. Trama Viva ti aspetta al prossimo appuntamento!</p>
                    <p>Per qualsiasi info scrivici a <strong>tramavivaaps@gmail.com</strong>.</p>
                    <p><em>A presto,</em><br/><strong>Il team di Trama Viva APS</strong></p>
                </div>
                <div class="footer">
                    <p>Trama Viva APS | "Intrecciamo storie, persone e opportunità"</p>
                    <p>Generated: {datetime.now().strftime('%d/%m/%Y %H:%M')}</p>
                </div>
            </div>
        </body>
        </html>
        """
