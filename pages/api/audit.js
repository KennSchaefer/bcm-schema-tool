import { scrapePage } from '../../utils/scraper';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: 'Missing URL parameter' });
  }

  try {
    // 1. Fetch fully-rendered HTML
    const html = await scrapePage(url);

    // 2. Extract all JSON-LD <script> blocks
    const regex = /<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
    let match;
    const existingSchema = [];
    while ((match = regex.exec(html))) {
      try {
        existingSchema.push(JSON.parse(match[1]));
      } catch {
        // skip invalid JSON
      }
    }

    // 3. Return the audit result
    return res.status(200).json({
      message: 'Audit endpoint working',
      url,
      existingSchema
    });
  } catch (error) {
    console.error('Audit error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
