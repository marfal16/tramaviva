const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

const pad = n => String(n).padStart(2, '0');

const parseEventDateTime = (event) => {
  const [y, m, d] = (event.date || '').split('-').map(Number);
  const [h, min] = (event.time || '19:00').split(':').map(Number);
  if (!y || !m || !d) return null;
  const start = new Date(y, m - 1, d, h || 19, min || 0);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  return { start, end };
};

const fmtICS = dt =>
  `${dt.getFullYear()}${pad(dt.getMonth()+1)}${pad(dt.getDate())}T${pad(dt.getHours())}${pad(dt.getMinutes())}00`;

const escICS = s =>
  (s || '').replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n');

// URL diretto al backend — funziona su iOS Safari (data: URI non funziona su iOS)
export const icsUrl = (event) => {
  const id = event.id || event.slug;
  if (!id) return null;
  return `${BACKEND_URL}/api/events/${id}/calendar.ics`;
};

// Fallback client-side per ambienti senza backend o event_id mancante
export const downloadICS = (event) => {
  const times = parseEventDateTime(event);
  if (!times) return;
  const { start, end } = times;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Trama Viva APS//IT',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `DTSTART:${fmtICS(start)}`,
    `DTEND:${fmtICS(end)}`,
    `SUMMARY:${escICS(event.title)}`,
    `LOCATION:${escICS(event.location)}`,
    `DESCRIPTION:${escICS(event.description)}`,
    `UID:${event.id || event.date}-tramaviva@tramavivaaps.com`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const uri = 'data:text/calendar;charset=utf8,' + encodeURIComponent(lines);
  const a = document.createElement('a');
  a.href = uri;
  a.download = `${(event.title || 'evento').replace(/[^a-z0-9]/gi, '_')}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

export const googleCalendarUrl = (event) => {
  const times = parseEventDateTime(event);
  if (!times) return null;
  const { start, end } = times;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title || '',
    dates: `${fmtICS(start)}/${fmtICS(end)}`,
    details: event.description || '',
    location: event.location || '',
  });
  return `https://calendar.google.com/calendar/render?${params}`;
};
