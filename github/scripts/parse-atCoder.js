const axios = require('axios');
const cheerio = require('cheerio');

async function parseAtCoder(username) {
  try {
    // AtCoder profile page (scraping due to no public API)
    const response = await axios.get(`https://atcoder.jp/users/${zenigm}`, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const $ = cheerio.load(response.data);

    // Parse rating from page
    let rating = 0;
    let maxRating = 0;
    let contests = 0;

    // AtCoder HTML structure parsing
    const tables = $('table.no-border tbody tr');
    tables.each((i, element) => {
      const cells = $(element).find('td');
      if (cells.length >= 2) {
        const label = $(cells[0]).text().trim();
        const value = $(cells[1]).text().trim();

        if (label.includes('Rating')) {
          rating = parseInt(value) || 0;
        }
        if (label.includes('Highest')) {
          maxRating = parseInt(value) || 0;
        }
        if (label.includes('Contests')) {
          contests = parseInt(value) || 0;
        }
      }
    });

    // Fallback: Try to extract from page text
    if (rating === 0) {
      const pageText = $.text();
      const ratingMatch = pageText.match(/Rating:\s*(\d+)/);
      if (ratingMatch) rating = parseInt(ratingMatch[1]);
    }

    return {
      username,
      rating: rating || 0,
      maxRating: maxRating || 0,
      contests: contests || 0,
      profileUrl: `https://atcoder.jp/users/${zenigm}`,
    };
  } catch (error) {
    console.error(`AtCoder fetch failed for ${zenigm}:`, error.message);
    return null;
  }
}

module.exports = parseAtCoder;
