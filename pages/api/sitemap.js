import { XMLParser } from 'fast-xml-parser';

export default async function handler(req, res) {
  try {
    const sitemapUrl = 'https://www.beebyclarkmeyler.com/sitemap.xml';
    const response = await fetch(sitemapUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch sitemap: ${response.status}`);
    }
    const xml = await response.text();

    const parser = new XMLParser({ ignoreAttributes: false });
    const json = parser.parse(xml);
    const urls = Array.isArray(json.urlset.url)
      ? json.urlset.url.map(entry => entry.loc)
      : [json.urlset.url.loc];

    res.status(200).json({ urls });
  } catch (error) {
    console.error('Sitemap API error:', error);
    res.status(500).json({ error: 'Failed to fetch sitemap' });
  }
}
