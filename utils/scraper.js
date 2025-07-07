// File: utils/scraper.js
import fetch from 'node-fetch';

/**
 * Fetches and returns the raw HTML of a given URL.
 * (Pulled via HTTP rather than Puppeteer.)
 *
 * @param {string} url
 * @returns {Promise<string>}
 */
export async function scrapePage(url) {
  const resp = await fetch(url, { timeout: 30000 });
  if (!resp.ok) {
    throw new Error(`Fetch failed with status ${resp.status}`);
  }
  return await resp.text();
}
