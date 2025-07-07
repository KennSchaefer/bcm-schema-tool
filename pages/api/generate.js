// pages/api/generate.js

import OpenAI from 'openai';
import { scrapePage } from '../../utils/scraper';
import fetch from 'node-fetch';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url, type } = req.body;
  if (!url || !type) return res.status(400).json({ error: 'Missing url or type' });

  // 1. Get page HTML (Puppeteer or fetch)
  let html;
  try {
    html = await scrapePage(url);
  } catch (err) {
    console.warn('Scrape failed, falling back to fetch:', err.message);
    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`Fetch ${resp.status}`);
      html = await resp.text();
    } catch (e) {
      console.error('Fetch failed:', e);
      return res.status(500).json({ error: 'Cannot load page HTML' });
    }
  }

  // 2. Build prompt
  const prompt = `
You are an SEO and Schema.org expert. Generate a valid JSON-LD object for the Schema.org type "${type}" based on this page HTML. Include all required fields.

---
${html}
`;

  // 3. Call OpenAI
  let completion;
  try {
    completion = await openai.chat.completions.create({
      model: 'o4-mini',
      messages: [{ role: 'user', content: prompt }],
    });
  } catch (err) {
    console.error('OpenAI error:', err);
    return res.status(502).json({ error: 'OpenAI API call failed', details: err.message });
  }

  // 4. Extract the JSON blob
  let text = completion.choices[0].message.content.trim();

  // Remove any script tags or markup
  // Match the first “{ … }” block
  const match = text.match(/\{[\s\S]*\}/m);
  if (!match) {
    console.error('No JSON object found in response:', text);
    return res.status(502).json({ error: 'No JSON found in output', raw: text });
  }
  const jsonText = match[0];

  // 5. Parse and return
  try {
    const schema = JSON.parse(jsonText);
    return res.status(200).json({ schema });
  } catch (err) {
    console.error('JSON.parse failed:', err, 'jsonText:', jsonText);
    return res.status(502).json({ error: 'Generated output not valid JSON', raw: jsonText });
  }
}
