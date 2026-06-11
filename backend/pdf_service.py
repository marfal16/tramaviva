import io
import base64
from pathlib import Path
from datetime import datetime
from pypdf import PdfReader, PdfWriter

BASE_DIR = Path(__file__).resolve().parent


class PDFService:
    """
    Servizio per la compilazione del modulo PDF di Trama Viva.
    Usa i nomi esatti dei campi AcroForm del PDF.
    """

    @staticmethod
    def generate_pdf_from_registration(registration_data: dict) -> str:
        try:
            template_path = BASE_DIR / "Modulo_Iscrizione_TramaViva_compilabile.pdf"
            if not template_path.exists():
                template_path = BASE_DIR.parent / "Modulo_Iscrizione_TramaViva_compilabile.pdf"
                if not template_path.exists():
                    raise FileNotFoundError("Modello PDF non trovato.")

            reader = PdfReader(template_path)
            writer = PdfWriter()
            writer.clone_reader_document_root(reader)

            # ---- Helper ----
            def check(condition):
                return "/Yes" if condition else "/Off"

            # ---- Pagina 1: Dati anagrafici e residenza ----
            comune   = registration_data.get("comune", "")
            provincia = registration_data.get("provincia", "")
            cap      = registration_data.get("cap", "")

            p1 = {
                "nome_cognome":   f"{registration_data.get('first_name', '')} {registration_data.get('last_name', '')}".strip(),
                "luogo_nascita":  registration_data.get("luogo_nascita", ""),
                "data_nascita":   registration_data.get("data_nascita", ""),
                "codice_fiscale": registration_data.get("codice_fiscale", ""),
                "cittadinanza":   registration_data.get("cittadinanza", ""),
                "doc_tipo":       registration_data.get("documento_tipo", ""),
                "doc_numero":     registration_data.get("documento_numero", ""),
                "rilasciato_da":  registration_data.get("documento_rilasciato", ""),
                "data_rilascio":  registration_data.get("documento_data", ""),
                "comune_prov_cap": f"{comune} {provincia} {cap}".strip(),
                "indirizzo":      registration_data.get("indirizzo", ""),
                "cellulare":      registration_data.get("cellulare", "") or registration_data.get("phone", ""),
                "email":          registration_data.get("email", ""),
            }

            # ---- Pagina 2: Consensi ----
            comm = registration_data.get("consenso_comunicazioni", False)
            pub  = registration_data.get("consenso_pubblico", False)
            # consenso_c = condivisione recapito (usiamo consenso_privacy come proxy, adatta se hai campo dedicato)
            # consenso_d = inserimento in chat (usiamo consenso_dati come proxy)
            priv = registration_data.get("consenso_privacy", False)
            dati = registration_data.get("consenso_dati", False)

            p2 = {
                "consenso_a_si":  check(comm),
                "consenso_a_no":  check(not comm),
                "consenso_b_si":  check(pub),
                "consenso_b_no":  check(not pub),
                "consenso_c_si":  check(priv),
                "consenso_c_no":  check(not priv),
                "consenso_d_si":  check(dati),
                "consenso_d_no":  check(not dati),
            }

            # ---- Pagina 3: Minori ----
            p3 = {}
            if registration_data.get("is_minorenne", False):
                luogo_g = registration_data.get("genitore_luogo_nascita", "")
                data_g  = registration_data.get("genitore_data_nascita", "")
                p3 = {
                    "qualita_genitore":  "/Yes",
                    "qualita_tutore":    "/Off",
                    "qualita_esercente": "/Off",
                    "min_cognome_nome":  f"{registration_data.get('genitore_cognome', '')} {registration_data.get('genitore_nome', '')}".strip(),
                    "min_luogo_data":    f"{luogo_g} - {data_g}".strip(" -"),
                    "min_cf":            registration_data.get("genitore_codice_fiscale", ""),
                    "min_tel_email":     registration_data.get("genitore_telefono", ""),
                    "min_doc_tipo":      registration_data.get("genitore_documento_tipo", ""),
                    "min_doc_numero":    registration_data.get("genitore_documento_numero", ""),
                    "min_dich_statuto":  "/Yes",
                    "min_dich_attivita": "/Yes",
                    "min_dich_tutela":   "/Yes",
                }

            # ---- Pagina 4: Dichiarazione e pagamento ----
            today = datetime.now().strftime("%d/%m/%Y")
            p4 = {
                "luogo":            comune or "",
                "data_versamento":  today,
                "quota_contanti":   "/Off",
                "quota_bonifico":   "/Off",  # verrà aggiornato dopo il pagamento
            }

            # ---- Applica tutti i campi a tutte le pagine ----
            all_fields = {**p1, **p2, **p3, **p4}
            for page in writer.pages:
                writer.update_page_form_field_values(page, all_fields)

            # ---- Serializza ----
            buffer = io.BytesIO()
            writer.write(buffer)
            pdf_bytes = buffer.getvalue()
            buffer.close()

            return base64.b64encode(pdf_bytes).decode("utf-8")

        except Exception as e:
            print(f"Errore generazione PDF: {str(e)}")
            return ""
