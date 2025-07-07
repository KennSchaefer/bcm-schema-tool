import { Configuration, OpenAIApi } from 'openai';
import { scrapePage } from '../../utils/scraper';

// Initialize OpenAI client
const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(config);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'Missing url in request body' });
  }

  try {
    // 1. Scrape the page HTML (including JS-rendered content)
    const html = await scrapePage(url);

    // 2. Prompt ChatGPT for schema type recommendations
    const prompt = `
You are an SEO expert. Given the following page HTML, identify up to 5 appropriate Schema.org types (e.g., Article, FAQPage, WebSite, LocalBusiness, Product) that best fit this content.\nReturn a JSON array of objects with \"type\" and a one-sentence \"reason\".\n---\n${html}
    `;

    const completion = await openai.createChatCompletion({
      model: 'o4-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    });

    // 3. Parse OpenAI response
    let recommendations;
    const recommendationText = completion.data.choices[0].message.content;
    try {
      recommendations = JSON.parse(recommendationText);
    } catch {
      // Fallback: return raw text if JSON parsing fails
      recommendations = recommendationText;
    }

    // 4. Respond with recommendations
    return res.status(200).json({ url, recommendations });
  } catch (error) {
    console.error('Recommend error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
