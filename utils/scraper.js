// File: utils/scraper.js
/**
 * Fetches and returns the raw HTML of a given URL using the built-in fetch.
 * @param {string} url
 * @returns {Promise<string>} HTML content
 */
export async function scrapePage(url) {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status}`)
    }
    return await response.text()
  } catch (err) {
    console.error(`scrapePage error for ${url}:`, err)
    throw err
  }
}
