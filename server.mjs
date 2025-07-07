// server.mjs
import express from 'express';
import fetch from 'node-fetch';
import NodeCache from 'node-cache';
import { XMLParser } from 'fast-xml-parser';

const app    = express();
const PORT   = process.env.PORT || 3000;
const cache  = new NodeCache({ stdTTL: 300 });        // cache sitemap for 5 minutes
const BCM_SITEMAP = 'https://www.beebyclarkmeyler.com/sitemap.xml';

// 1) Health‐check / root
app.get('/', (req, res) => {
  res.send('Hello from the schema tool server!');
});

// 2) Sitemap URLs endpoint
app.get('/api/sitemap-urls', async (req, res) => {
  // for now we always use the BCM example sitemap
  const url = BCM_SITEMAP;

  // return cached if available
  let urls = cache.get(url);
  if (!urls) {
    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`Fetch failed: ${resp.status}`);
      const xml = await resp.text();

      // parse out <loc> entries
      const parser = new XMLParser({ ignoreAttributes: false });
      const json   = parser.parse(xml);
      const entries = json.urlset?.url || [];
      urls = entries.map(e => e.loc).filter(Boolean);

      cache.set(url, urls);
    } catch (err) {
      console.error('Error fetching/parsing sitemap:', err);
      return res.status(502).json({ error: 'Unable to load sitemap' });
    }
  }

  res.json({ urls });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
