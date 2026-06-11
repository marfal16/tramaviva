import io
import base64
from pathlib import Path
from datetime import datetime
from pypdf import PdfReader, PdfWriter

# Individua la cartella principale del backend
BASE_DIR = Path(__file__).resolve().parent

class PDFService:
    """
    Servizio completo per la compilazione del modulo PDF di Trama Viva 
    con tutti i campi estratti dal database.
    """

    @staticmethod
    def generate_pdf_from_registration(registration_data: dict) -> str:
        """
        Prende il modulo PDF interattivo, compila tutti i campi (inclusi i minorenni 
        e i consensi) e restituisce la stringa base64 per MongoDB.
        """
        try:
            # Percorso del file PDF modello
            template_path = BASE_DIR / "Modulo_Iscrizione_TramaViva_compilabile.pdf"
            
            if not template_path.exists():
                template_path = BASE_DIR.parent / "Modulo_Iscrizione_TramaViva_compilabile.pdf"
                if not template_path.exists():
                    raise FileNotFoundError("Modello PDF 'Modulo_Iscrizione_TramaViva_compilabile.pdf' non trovato.")

            reader = PdfReader(template_path)
            writer = PdfWriter()

            # --- PAGINA 1: DATI ANAGRAFICI, RESIDENZA E CONTATTI ---
            writer.add_page(reader.pages[0])

            field_values_p1 = {
                "Nome e Cognome": f"{registration_data.get('first_name', '')} {registration_data.get('last_name', '')}",
                "Luogo di nascita": registration_data.get("luogo_nascita", ""),
                "Data di nascita": registration_data.get("data_nascita", ""),
                "Codice Fiscale": registration_data.get("codice_fiscale", ""),
                "Cittadinanza": registration_data.get("cittadinanza", ""),
                "Tipo:": registration_data.get("documento_tipo", ""),  # Sistemato refuso stringa
                "Numero:": registration_data.get("documento_numero", ""), # Sistemato refuso stringa
                "Rilasciato da": registration_data.get("documento_rilasciato", ""),
                "Data rilascio": registration_data.get("documento_data", ""),
                "Comune": registration_data.get("comune", ""),
                "Provincia/CAP": f"{registration_data.get('provincia', '')} {registration_data.get('cap', '')}",
                "Indirizzo": registration_data.get("indirizzo", ""),
                "Cellulare": registration_data.get("cellulare", "") or registration_data.get("phone", ""),
                "E-mail": registration_data.get("email", ""),
            }
            writer.update_page_form_field_values(writer.pages[0], field_values_p1)

            # --- PAGINA 2: PRIVACY E CONSENSI ---
            writer.add_page(reader.pages[1])
            
            # Nota: le caselle del PDF usano "/Yes" o True a seconda di come è strutturato il form
            privacy_fields = {
                "Acconsento promozionali": "/Yes" if registration_data.get("consenso_comunicazioni") else "/Off",
                "Acconsento foto video": "/Yes" if registration_data.get("consenso_pubblico") else "/Off",
                "Acconsento privacy": "/Yes" if registration_data.get("consenso_privacy") else "/Off",
                "Acconsento dati": "/Yes" if registration_data.get("consenso_dati") else "/Off"
            }
            writer.update_page_form_field_values(writer.pages[1], privacy_fields)

            # --- PAGINA 3: RISERVATA AI RICHIEDENTI MINORENNI ---
            writer.add_page(reader.pages[2])
            
            if registration_data.get("is_minorenne", False):
                minorenni_fields = {
                    "Cognome e Nome del genitore/tutore": f"{registration_data.get('genitore_nome', '')} {registration_data.get('genitore_cognome', '')}",
                    "Telefono / E-mail": registration_data.get("genitore_telefono", ""),
                    "Documento d'identità Tipo:": registration_data.get("genitore_documento_tipo", ""),
                    "Numero:": registration_data.get("genitore_documento_numero", "")
                }
                writer.update_page_form_field_values(writer.pages[2], minorenni_fields)

            # --- PAGINA 4: DICHIARAZIONI E PAGAMENTO ---
            writer.add_page(reader.pages[3])
            
            p4_fields = {
                "Luogo": registration_data.get("comune", "Terzigno").capitalize(),
                "in data": datetime.now().strftime("%d/%m/%Y"),
                "Contanti": "/Yes" if registration_data.get("referral") == "contanti" else "/Off",
                "Bonifico": "/Yes" if registration_data.get("referral") == "bonifico" else "/Off"
            }
            writer.update_page_form_field_values(writer.pages[3], p4_fields)

            # --- COSTRUZIONE FINALE ---
            buffer = io.BytesIO()
            writer.write(buffer)
            pdf_bytes = buffer.getvalue()
            buffer.close()

            return base64.b64encode(pdf_bytes).decode('utf-8')

        except Exception as e:
            print(f"Errore generazione PDF: {str(e)}")
            return ""
