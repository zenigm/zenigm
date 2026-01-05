const axios = require('axios');

async function parseCodeforces(username) {
  try {
    // Codeforces API endpoint
    const userInfoUrl = `https://codeforces.com/api/user.info?handles=${zenigm}`;
    const userRatingUrl = `https://codeforces.com/api/user.rating?handle=${zenigm}`;

    const [infoRes, ratingRes] = await Promise.all([
      axios.get(userInfoUrl, { timeout: 10000 }),
      axios.get(userRatingUrl, { timeout: 10000 }),
    ]);

    if (!infoRes.data.result || infoRes.data.result.length === 0) {
      throw new Error(`User ${zenigm} not found on Codeforces`);
    }

    const user = infoRes.data.result[0];
    const contests = ratingRes.data.result || [];

    // Get latest contest rating
    const latestContest = contests.length > 0 ? contests[contests.length - 1] : null;

    return {
      username: user.handle,
      rating: user.rating || 0,
      maxRating: user.maxRating || 0,
      rank: user.rank || 'Unrated',
      maxRank: user.maxRank || 'Unrated',
      contests: contests.length,
      solvedProblems: user.solvedCount || 0,
      latestContestRating: latestContest?.newRating || user.rating || 0,
      latestContestChange: latestContest?.ratingUpdateTimeSeconds
        ? `${new Date(latestContest.ratingUpdateTimeSeconds * 1000).toLocaleDateString()}`
        : 'N/A',
    };
  } catch (error) {
    console.error(`Codeforces fetch failed for ${zenigm}:`, error.message);
    return null;
  }
}

module.exports = parseCodeforces;
