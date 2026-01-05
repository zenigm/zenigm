const axios = require('axios');

async function parseCodeChef(username) {
  try {
    // CodeChef unofficial API (using community wrapper)
    const response = await axios.get(`https://codechef-api.vercel.app/handle/${username}`, {
      timeout: 10000,
    });

    if (!response.data || response.data.error) {
      throw new Error(`User ${username} not found on CodeChef`);
    }

    const user = response.data;

    return {
      username: user.username || username,
      rating: user.currentRating || 0,
      maxRating: user.bestRating || 0,
      contests: user.contestsAttended || 0,
      globalRank: user.globalRank || 'Unranked',
      countryRank: user.countryRank || 'Unranked',
      solvedProblems: user.totalSolved || 0,
      allSolvedProblems: user.allSolved || 0,
      totalSubmissions: user.totalSubmissions || 0,
    };
  } catch (error) {
    console.error(`CodeChef fetch failed for ${username}:`, error.message);
    return null;
  }
}

module.exports = parseCodeChef;
