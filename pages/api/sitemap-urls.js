// pages/api/sitemap-urls.js
import fetch from 'node-fetch';
import NodeCache from 'node-cache';
import { XMLParser } from 'fast-xml-parser';

const cache = new NodeCache({ stdTTL: 300 });
const BCM_SITEMAP = 'https://www.beebyclarkmeyler.com/sitemap.xml';

export default async function handler(req, res) {
  let urls = cache.get(BCM_SITEMAP);
  if (!urls) {
    try {
      const resp = await fetch(BCM_SITEMAP);
      if (!resp.ok) throw new Error(`Status ${resp.status}`);
      const xml = await resp.text();
      const parser = new XMLParser({ ignoreAttributes: false });
      const json   = parser.parse(xml);
      const entries = json.urlset?.url || [];
      urls = entries.map(e => e.loc).filter(Boolean);
      cache.set(BCM_SITEMAP, urls);
    } catch (err) {
      console.error(err);
      return res.status(502).json({ error: 'Unable to load sitemap' });
    }
  }
  res.status(200).json({ urls });
}
