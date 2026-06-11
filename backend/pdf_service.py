"""PDF Service per compilare il PDF con i dati dell'iscrizione"""
import io
import base64
from datetime import datetime
try:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
    from reportlab.lib.units import inch
    from reportlab.lib import colors
    HAS_REPORTLAB = True
except ImportError:
    HAS_REPORTLAB = False


class PDFService:
    """
    Servizio per compilare il PDF con i dati dell'iscrizione.
    Se ReportLab non è disponibile, usa template HTML/CSS.
    """

    @staticmethod
    def generate_pdf_from_registration(registration_data: dict) -> str:
        """
        Genera un PDF compilato con i dati della registrazione.
        Ritorna il PDF in formato base64.
        """
        
        if HAS_REPORTLAB:
            return PDFService._generate_with_reportlab(registration_data)
        else:
            # Fallback: genera un documento HTML e convertilo in PDF
            return PDFService._generate_html_template(registration_data)

    @staticmethod
    def _generate_with_reportlab(data: dict) -> str:
        """
        Genera PDF usando ReportLab
        """
        buffer = io.BytesIO()
        
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            topMargin=0.5*inch,
            bottomMargin=0.5*inch,
            leftMargin=0.75*inch,
            rightMargin=0.75*inch,
        )
        
        story = []
        styles = getSampleStyleSheet()
        
        # Custom styles
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#2D3A18'),
            spaceAfter=12,
            alignment=1,  # Center
            fontName='Helvetica-Bold',
        )
        
        section_style = ParagraphStyle(
            'SectionTitle',
            parent=styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#5D1723'),
            spaceAfter=8,
            spaceBefore=12,
            fontName='Helvetica-Bold',
        )
        
        # Title
        story.append(Paragraph("TRAMA VIVA APS", title_style))
        story.append(Paragraph("DOMANDA DI AMMISSIONE A SOCIO", title_style))
        story.append(Spacer(1, 0.3*inch))
        
        # Sezione 1: Dati Anagrafici
        story.append(Paragraph("1. DATI ANAGRAFICI DEL RICHIEDENTE", section_style))
        
        data_table = [
            ["Nome e Cognome", f"{data.get('first_name', '')} {data.get('last_name', '')}"],
            ["Luogo di nascita", data.get('luogo_nascita', '')],
            ["Data di nascita", data.get('data_nascita', '')],
            ["Codice Fiscale", data.get('codice_fiscale', '')],
            ["Cittadinanza", data.get('cittadinanza', '')],
            ["Documento d'identità", f"{data.get('documento_tipo', '')}: {data.get('documento_numero', '')}"],
            ["Rilasciato da", data.get('documento_rilasciato', '')],
            ["Data rilascio", data.get('documento_data', '')],
        ]
        
        table = Table(data_table, colWidths=[2*inch, 4*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#F9ECD4')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#2D3A18')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#E0E0E0')),
        ]))
        
        story.append(table)
        story.append(Spacer(1, 0.2*inch))
        
        # Sezione 2: Residenza
        story.append(Paragraph("2. RESIDENZA E CONTATTI", section_style))
        
        residence_table = [
            ["Indirizzo", data.get('indirizzo', '')],
            ["Comune", data.get('comune', '')],
            ["Provincia / CAP", f"{data.get('provincia', '')} {data.get('cap', '')}"],
            ["Cellulare", data.get('cellulare', '')],
            ["Email", data.get('email', '')],
        ]
        
        res_table = Table(residence_table, colWidths=[2*inch, 4*inch])
        res_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#F9ECD4')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#2D3A18')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#E0E0E0')),
        ]))
        
        story.append(res_table)
        story.append(Spacer(1, 0.2*inch))
        
        # Sezione 3: Consensi
        story.append(Paragraph("3. CONSENSI", section_style))
        
        consensi_text = f"""
        a) Intendo ricevere comunicazioni promozionali: {'☑' if data.get('consenso_comunicazioni') else '☐'}<br/>
        b) Pubblicazione di dati sul sito: {'☑' if data.get('consenso_pubblico') else '☐'}<br/>
        c) Consenso privacy: {'☑' if data.get('consenso_privacy') else '☐'}<br/>
        d) Trattamento dati personali: {'☑' if data.get('consenso_dati') else '☐'}
        """
        
        story.append(Paragraph(consensi_text, styles['Normal']))
        story.append(Spacer(1, 0.3*inch))
        
        # Sezione 4: Dichiarazione
        story.append(Paragraph("4. DICHIARAZIONI DEL RICHIEDENTE", section_style))
        
        declarazione = f"""
        Io sottoscritto/a, con la presente:
        <br/><br/>
        ✓ Dichiaro di avere consapevolezza dei rischi e delle responsabilità;<br/>
        ✓ Accetto lo Statuto e il Regolamento interno di Trama Viva APS;<br/>
        ✓ Mi impegno a rispettare i valori e i principi dell'associazione;<br/>
        ✓ Autorizzo il trattamento dei dati personali secondo quanto dichiarato;<br/>
        ✓ Dichiaro l'accettazione di questa documentazione.
        """
        
        story.append(Paragraph(declarazione, styles['Normal']))
        story.append(Spacer(1, 0.5*inch))
        
        # Firma
        story.append(Paragraph(f"Data: {datetime.now().strftime('%d/%m/%Y')}", styles['Normal']))
        story.append(Spacer(1, 0.2*inch))
        story.append(Paragraph("Firma del richiedente: ____________________________", styles['Normal']))
        
        # Build PDF
        doc.build(story)
        
        # Convert to base64
        pdf_bytes = buffer.getvalue()
        buffer.close()
        
        return base64.b64encode(pdf_bytes).decode('utf-8')

    @staticmethod
    def _generate_html_template(data: dict) -> str:
        """
        Fallback: genera un template HTML e lo converte a PDF base64.
        (Implementazione placeholder)
        """
        html_content = f"""
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                h1 {{ color: #2D3A18; text-align: center; }}
                .section {{ margin-top: 20px; padding: 10px; border: 1px solid #ddd; }}
                .field {{ display: flex; margin: 8px 0; }}
                .label {{ font-weight: bold; width: 200px; }}
                .value {{ flex: 1; }}
            </style>
        </head>
        <body>
            <h1>TRAMA VIVA APS - DOMANDA DI AMMISSIONE A SOCIO</h1>
            
            <div class="section">
                <h2>1. DATI ANAGRAFICI</h2>
                <div class="field"><div class="label">Nome:</div><div class="value">{data.get('first_name', '')}</div></div>
                <div class="field"><div class="label">Cognome:</div><div class="value">{data.get('last_name', '')}</div></div>
                <div class="field"><div class="label">Data di nascita:</div><div class="value">{data.get('data_nascita', '')}</div></div>
                <div class="field"><div class="label">Luogo di nascita:</div><div class="value">{data.get('luogo_nascita', '')}</div></div>
                <div class="field"><div class="label">Codice Fiscale:</div><div class="value">{data.get('codice_fiscale', '')}</div></div>
                <div class="field"><div class="label">Cittadinanza:</div><div class="value">{data.get('cittadinanza', '')}</div></div>
            </div>
            
            <div class="section">
                <h2>2. DOCUMENTO D'IDENTITÀ</h2>
                <div class="field"><div class="label">Tipo:</div><div class="value">{data.get('documento_tipo', '')}</div></div>
                <div class="field"><div class="label">Numero:</div><div class="value">{data.get('documento_numero', '')}</div></div>
                <div class="field"><div class="label">Rilasciato da:</div><div class="value">{data.get('documento_rilasciato', '')}</div></div>
                <div class="field"><div class="label">Data rilascio:</div><div class="value">{data.get('documento_data', '')}</div></div>
            </div>
            
            <div class="section">
                <h2>3. RESIDENZA E CONTATTI</h2>
                <div class="field"><div class="label">Indirizzo:</div><div class="value">{data.get('indirizzo', '')}</div></div>
                <div class="field"><div class="label">Comune:</div><div class="value">{data.get('comune', '')}</div></div>
                <div class="field"><div class="label">Provincia:</div><div class="value">{data.get('provincia', '')}</div></div>
                <div class="field"><div class="label">CAP:</div><div class="value">{data.get('cap', '')}</div></div>
                <div class="field"><div class="label">Cellulare:</div><div class="value">{data.get('cellulare', '')}</div></div>
                <div class="field"><div class="label">Email:</div><div class="value">{data.get('email', '')}</div></div>
            </div>
            
            <div class="section">
                <h2>4. CONSENSI</h2>
                <p>Comunicazioni promozionali: {'✓' if data.get('consenso_comunicazioni') else '✗'}</p>
                <p>Pubblicazione dati: {'✓' if data.get('consenso_pubblico') else '✗'}</p>
                <p>Consenso privacy: {'✓' if data.get('consenso_privacy') else '✗'}</p>
                <p>Trattamento dati: {'✓' if data.get('consenso_dati') else '✗'}</p>
            </div>
            
            <p style="margin-top: 30px; text-align: center; color: #888; font-size: 12px;">
                Data di generazione: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}
            </p>
        </body>
        </html>
        """
        
        # Encode to base64
        html_bytes = html_content.encode('utf-8')
        return base64.b64encode(html_bytes).decode('utf-8')
