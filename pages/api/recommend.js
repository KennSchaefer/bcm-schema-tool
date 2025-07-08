// File: pages/api/recommend.js
import OpenAI from 'openai'
import { scrapePage } from '../../utils/scraper'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { url, html } = req.body
  if (!url && !html) {
    return res.status(400).json({ error: 'Missing url or html in request body' })
  }

  // 1. Fetch HTML if URL mode
  let pageHtml = html || ''
  if (url) {
    try {
      pageHtml = await scrapePage(url)
    } catch (err) {
      console.warn('Fetch page HTML failed:', err.message)
      return res.status(500).json({ error: 'Unable to load page HTML' })
    }
  }

  // 2. Truncate to first 5KB to avoid oversized prompts
  const MAX_HTML_BYTES = 5 * 1024
  let snippet = pageHtml.slice(0, MAX_HTML_BYTES)
  if (pageHtml.length > MAX_HTML_BYTES) {
    snippet += '\n<!-- HTML truncated for prompt size -->\n'
  }

  // 3. Build prompt
  const prompt = `
You are an SEO expert. Given the following page HTML (truncated), identify up to 5 appropriate schema.org types (e.g., Article, FAQPage, WebSite, LocalBusiness, Product). Return a JSON array of objects: { "type": "...", "reason": "..." }.
---
${snippet}
`

  // 4. Call OpenAI chat API
  let completion
  try {
    completion = await openai.chat.completions.create({
      model: 'o4-mini',
      messages: [{ role: 'user', content: prompt }],
    })
  } catch (apiErr) {
    console.error('OpenAI recommendation API error:', apiErr)
    return res.status(502).json({ error: 'Recommendation API error', details: apiErr.message })
  }

  // 5. Parse JSON from response
  let raw = completion.choices[0].message.content.trim()
  raw = raw.replace(/^```(?:json)?\n?/, '').replace(/```$/, '').trim()

  let types
  try {
    types = JSON.parse(raw)
  } catch (parseErr) {
    console.error('JSON.parse error on recommendations:', parseErr, 'raw:', raw)
    return res.status(502).json({ error: 'Invalid JSON from recommendation API', raw })
  }

  // 6. Send back only the types array
  return res.status(200).json({ types })
}
