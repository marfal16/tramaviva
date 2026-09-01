const BOT_RE = /facebookexternalhit|twitterbot|telegrambot|whatsapp|linkedinbot|slackbot|discordbot|applebot|bingbot|googlebot|yandexbot|duckduckbot|baiduspider|sogou|exabot|ia_archiver/i;

const BACKEND = process.env.REACT_APP_BACKEND_URL || process.env.BACKEND_URL || '';
const SITE = 'https://www.tramavivaaps.com';

function esc(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export const config = {
  matcher: ['/eventi/:slug*'],
};

export default async function middleware(request) {
  const ua = request.headers.get('user-agent') || '';
  if (!BOT_RE.test(ua)) return; // real user — pass through to SPA

  const url = new URL(request.url);
  const parts = url.pathname.split('/').filter(Boolean);
  const slug = parts[1] || '';
  if (!slug) return;

  let title = 'Trama Viva APS — Evento';
  let description = 'Un evento di Trama Viva APS — Intrecciamo storie, persone e opportunità.';
  let imageUrl = `${SITE}/tramaviva-full.jpg`;
  const eventUrl = `${SITE}/eventi/${slug}`;

  try {
    const res = await fetch(`${BACKEND}/api/events/${slug}`, { cf: { cacheTtl: 60 } });
    if (res.ok) {
      const ev = await res.json();
      title = `${ev.title || 'Evento'} — Trama Viva APS`;
      description = (ev.description || description).slice(0, 250);
      if (ev.has_image) imageUrl = `${BACKEND}/api/events/${ev.id || slug}/image`;
    }
  } catch (_) { /* usa defaults */ }

  const html = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Trama Viva APS">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:image" content="${esc(imageUrl)}">
  <meta property="og:url" content="${esc(eventUrl)}">
  <meta property="og:locale" content="it_IT">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${esc(imageUrl)}">
  <meta http-equiv="refresh" content="0; url=${esc(eventUrl)}">
</head>
<body></body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=60' },
  });
}
