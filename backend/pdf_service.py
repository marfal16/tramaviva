import io
import base64
from pathlib import Path
from datetime import datetime
from pypdf import PdfWriter, PdfReader
from pypdf.generic import NameObject

BASE_DIR = Path(__file__).resolve().parent

# Radio button kid indices:
# consenso_a/b/c/d : 0=Acconsento,  1=Non acconsento
# qualita           : 0=genitore,    1=tutore,      2=esercente
# pagamento         : 0=Contanti,    1=Bonifico,    2=Elettronico
# esito             : 0=Accolta,     1=Respinta


def _set_radio(writer: PdfWriter, field_name: str, kid_index: int) -> None:
    try:
        acroform = writer._root_object.get("/AcroForm")
        if acroform is None:
            return
        for field_ref in acroform.get("/Fields", []):
            field = field_ref.get_object()
            if field.get("/T") == field_name:
                kids = field.get("/Kids", [])
                for i, kid_ref in enumerate(kids):
                    kid = kid_ref.get_object()
                    if i == kid_index:
                        kid.update({NameObject("/AS"): NameObject(f"/{i}"),
                                    NameObject("/V"): NameObject(f"/{i}")})
                    else:
                        kid.update({NameObject("/AS"): NameObject("/Off")})
                field.update({NameObject("/V"): NameObject(f"/{kid_index}")})
                return
    except Exception as e:
        print(f"[pdf_service] set_radio error ({field_name}): {e}")


class PDFService:
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

            comune    = registration_data.get("comune", "")
            provincia = registration_data.get("provincia", "")
            cap       = registration_data.get("cap", "")

            text_fields = {
                "nome_cognome":    f"{registration_data.get('first_name', '')} {registration_data.get('last_name', '')}".strip(),
                "luogo_nascita":   registration_data.get("luogo_nascita", ""),
                "data_nascita":    registration_data.get("data_nascita", ""),
                "codice_fiscale":  registration_data.get("codice_fiscale", ""),
                "cittadinanza":    registration_data.get("cittadinanza", ""),
                "doc_tipo":        registration_data.get("documento_tipo", ""),
                "doc_numero":      registration_data.get("documento_numero", ""),
                "rilasciato_da":   registration_data.get("documento_rilasciato", ""),
                "data_rilascio":   registration_data.get("documento_data", ""),
                "comune_prov_cap": f"{comune} {provincia} {cap}".strip(),
                "indirizzo":       registration_data.get("indirizzo", ""),
                "cellulare":       registration_data.get("cellulare", "") or registration_data.get("phone", ""),
                "email":           registration_data.get("email", ""),
                "luogo":           "",
                "data_versamento": "",
            }

            if registration_data.get("is_minorenne", False):
                luogo_g = registration_data.get("genitore_luogo_nascita", "")
                data_g  = registration_data.get("genitore_data_nascita", "")
                text_fields.update({
                    "min_cognome_nome": f"{registration_data.get('genitore_cognome', '')} {registration_data.get('genitore_nome', '')}".strip(),
                    "min_luogo_data":   f"{luogo_g} - {data_g}".strip(" -"),
                    "min_cf":           registration_data.get("genitore_codice_fiscale", ""),
                    "min_tel_email":    registration_data.get("genitore_telefono", ""),
                    "min_doc_tipo":     registration_data.get("genitore_documento_tipo", ""),
                    "min_doc_numero":   registration_data.get("genitore_documento_numero", ""),
                })

            for page in writer.pages:
                writer.update_page_form_field_values(page, text_fields)

            if registration_data.get("is_minorenne", False):
                checkbox_fields = {
                    "min_dich_statuto":  "/Yes",
                    "min_dich_attivita": "/Yes",
                    "min_dich_tutela":   "/Yes",
                }
                for page in writer.pages:
                    writer.update_page_form_field_values(page, checkbox_fields)

            # Radio: consensi
            _set_radio(writer, "consenso_a", 0 if registration_data.get("consenso_comunicazioni") else 1)
            _set_radio(writer, "consenso_b", 0 if registration_data.get("consenso_pubblico") else 1)
            _set_radio(writer, "consenso_c", 0 if registration_data.get("consenso_telefono") else 1)
            _set_radio(writer, "consenso_d", 0 if registration_data.get("consenso_chat") else 1)

            # Radio: qualità genitore
            if registration_data.get("is_minorenne", False):
                _set_radio(writer, "qualita", 0)

            # Radio: pagamento (0=Contanti, 1=Bonifico, 2=Elettronico)
            metodo = registration_data.get("metodo_pagamento", "elettronico").lower()
            pagamento_idx = {"contanti": 0, "bonifico": 1, "elettronico": 2}.get(metodo, 2)
            _set_radio(writer, "pagamento", pagamento_idx)

            buffer = io.BytesIO()
            writer.write(buffer)
            pdf_bytes = buffer.getvalue()
            buffer.close()

            return base64.b64encode(pdf_bytes).decode("utf-8")

        except Exception as e:
            print(f"Errore generazione PDF: {e}")
            return ""
