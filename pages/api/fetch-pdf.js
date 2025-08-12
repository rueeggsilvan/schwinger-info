// pages/api/fetch-pdf.js
export default async function handler(req, res) {
  try {
    const url = req.query.u;
    if (!url) {
      res.status(400).json({ error: 'Missing ?u=' });
      return;
    }

    // Serverseitig laden (CORS-Problem existiert hier nicht)
    const resp = await fetch(url, { redirect: 'follow' });
    if (!resp.ok) {
      res.status(resp.status).json({ error: `Fetch failed: ${resp.status}` });
      return;
    }

    const arrayBuffer = await resp.arrayBuffer();
    const buf = Buffer.from(arrayBuffer);

    // PDF Bytes an den Client weitergeben
    res.setHeader('Content-Type', 'application/pdf');
    // optional: Caching etwas erlauben
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=600');
    res.status(200).send(buf);
  } catch (err) {
    console.error('fetch-pdf error:', err);
    res.status(500).json({ error: 'Server error fetching PDF' });
  }
}
