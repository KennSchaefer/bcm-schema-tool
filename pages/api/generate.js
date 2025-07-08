// File: pages/api/generate.js
import OpenAI from 'openai'
import { scrapePage } from '../../utils/scraper'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { url, html, type } = req.body
  if ((!url && !html) || !type) {
    return res.status(400).json({ error: 'Missing url/html or type' })
  }

  let pageHtml = html || ''
  if (url) {
    try {
      pageHtml = await scrapePage(url)
    } catch {
      return res.status(500).json({ error: 'Unable to fetch page HTML' })
    }
  }

  // Build the prompt for JSON-LD generation
  const prompt = `
You are an SEO and Schema.org expert. Generate valid JSON-LD for type "${type}" based on this HTML:

${pageHtml.slice(0, 5000)}
`

  try {
    const completion = await openai.chat.completions.create({
      model: 'o4-mini',
      messages: [{ role: 'user', content: prompt }],
    })
    let jsonLd = completion.choices[0].message.content.trim()
    // Strip markdown fences if present
    jsonLd = jsonLd.replace(/^```(?:json)?\n?/, '').replace(/```$/, '').trim()
    return res.status(200).json({ jsonLd })
  } catch (err) {
    console.error('Generate API error:', err)
    return res.status(502).json({ error: 'Failed to generate JSON-LD' })
  }
}
