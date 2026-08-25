export const config = { runtime: "edge" };

const IMAGE = "https://www.tramavivaaps.com/tramaviva-full.jpg";

const PAGES = {
  "/cineforum": {
    title: "Cineforum · Trama Viva APS",
    description:
      "Ogni mese un film, una serata insieme. Si guarda, si discute, si condivide — un frame alla volta.",
  },
  "/club-del-libro": {
    title: "Club del Libro · Trama Viva APS",
    description:
      "Ogni mese un libro, una conversazione, una connessione in più. Lettori di ogni livello benvenuti.",
  },
  "/iscrizione": {
    title: "Diventa socio · Trama Viva APS",
    description:
      "Unisciti a Trama Viva APS. Tessiamo relazioni vere, un filo alla volta.",
  },
  "/donazioni": {
    title: "Sostieni Trama Viva APS",
    description:
      "Ogni donazione ci aiuta a tessere relazioni vere e costruire comunità.",
  },
  "/eventi": {
    title: "Eventi · Trama Viva APS",
    description:
      "Aperitivi sociali, passeggiate di gruppo, screening salute e corsi IT base.",
  },
};

const BOTS = [
  "facebookexternalhit",
  "facebookcatalog",
  "Twitterbot",
  "WhatsApp",
  "LinkedInBot",
  "TelegramBot",
  "Slackbot",
  "Googlebot",
  "bingbot",
  "Applebot",
  "rogerbot",
  "DuckDuckBot",
  "Baiduspider",
  "ia_archiver",
  "Discordbot",
];

function getPage(pathname) {
  if (PAGES[pathname]) return PAGES[pathname];
  const parent = "/" + pathname.split("/")[1];
  return PAGES[parent] || null;
}

function ogHtml(siteBase, pathname, page) {
  const url = `${siteBase}${pathname}`;
  const title =
    page?.title || "APS Trama Viva — Intrecciamo storie, persone, opportunità";
  const desc =
    page?.description ||
    "Aperitivi sociali, passeggiate, screening salute e corsi IT base. Ogni filo conta.";
  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="utf-8"/>
  <title>${title}</title>
  <meta name="description" content="${desc}"/>
  <meta property="og:type" content="website"/>
  <meta property="og:locale" content="it_IT"/>
  <meta property="og:site_name" content="APS Trama Viva"/>
  <meta property="og:title" content="${title}"/>
  <meta property="og:description" content="${desc}"/>
  <meta property="og:image" content="${IMAGE}"/>
  <meta property="og:image:alt" content="APS Trama Viva"/>
  <meta property="og:image:width" content="1200"/>
  <meta property="og:image:height" content="630"/>
  <meta property="og:url" content="${url}"/>
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="${title}"/>
  <meta name="twitter:description" content="${desc}"/>
  <meta name="twitter:image" content="${IMAGE}"/>
</head>
<body>
  <p><a href="${url}">${title}</a></p>
  <p>${desc}</p>
</body>
</html>`;
}

export default async function handler(req) {
  const url = new URL(req.url);
  const pathname = url.pathname;
  const ua = req.headers.get("user-agent") || "";
  const isBot = BOTS.some((b) => ua.toLowerCase().includes(b.toLowerCase()));

  if (isBot) {
    const page = getPage(pathname);
    const siteBase = `${url.protocol}//${url.host}`;
    return new Response(ogHtml(siteBase, pathname, page), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  // Browser: serve the React SPA (fetch / which returns index.html)
  const indexUrl = new URL("/", req.url).toString();
  const res = await fetch(indexUrl);
  const html = await res.text();
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
