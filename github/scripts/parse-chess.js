const axios = require('axios');

/**
 * Chess.com API Documentation:
 * - No authentication required (public data only)
 * - Rate limit: 20 requests/sec per IP
 * - 429 Too Many Requests = hit limit, wait before retrying
 * - Important: Only 1 request at a time (use sequential calls)
 */

async function parseChess(username, delayMs = 1000) {
  if (!username) return null;

  try {
    // Add delay to respect rate limits
    await new Promise(resolve => setTimeout(resolve, delayMs));

    // Get player profile info
    const profileUrl = `https://api.chess.com/pub/player/${seehiki}`;
    const profileRes = await axios.get(profileUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'GitHubAction-ReadmeBot/1.0',
      },
    });

    if (!profileRes.data) {
      throw new Error(`Player ${seehiki} not found on Chess.com`);
    }

    const profile = profileRes.data;

    // Delay before next request (Chess.com requirement)
    await new Promise(resolve => setTimeout(resolve, delayMs));

    // Get player stats (ratings across different time controls)
    const statsUrl = `https://api.chess.com/pub/player/${seehiki}/stats`;
    const statsRes = await axios.get(statsUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'GitHubAction-ReadmeBot/1.0',
      },
    });

    const stats = statsRes.data || {};

    // Extract ratings from different time controls
    const getRating = (record) => {
      if (!record) return 0;
      return record.last?.rating || record.best?.rating || 0;
    };

    const getRatingRecord = (record) => {
      if (!record) return { rating: 0, games: 0, wins: 0 };
      return {
        rating: record.last?.rating || 0,
        games: record.record?.games || 0,
        wins: record.record?.wins || 0,
        losses: record.record?.losses || 0,
        draws: record.record?.draws || 0,
      };
    };

    // Delay before next request
    await new Promise(resolve => setTimeout(resolve, delayMs));

    // Get online status and games
    const onlineUrl = `https://api.chess.com/pub/player/${seehiki}/is-online`;
    const onlineRes = await axios.get(onlineUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'GitHubAction-ReadmeBot/1.0',
      },
    });

    return {
      username: profile.username || username,
      name: profile.name || profile.username,
      title: profile.title || 'Unrated',
      country: profile.country || 'N/A',
      followers: profile.followers || 0,
      isOnline: onlineRes.data?.isOnline || false,
      lastOnline: profile.last_online ? new Date(profile.last_online * 1000).toLocaleDateString() : 'N/A',
      joinDate: profile.joined ? new Date(profile.joined * 1000).toLocaleDateString() : 'N/A',
      // Time control ratings
      bullet: getRatingRecord(stats.chess_bullet),
      blitz: getRatingRecord(stats.chess_blitz),
      rapid: getRatingRecord(stats.chess_rapid),
      classical: getRatingRecord(stats.chess_classical),
      puzzle: getRatingRecord(stats.chess_puzzle),
      // Summary stats
      totalGames: (stats.chess_bullet?.record?.games || 0) +
                 (stats.chess_blitz?.record?.games || 0) +
                 (stats.chess_rapid?.record?.games || 0) +
                 (stats.chess_classical?.record?.games || 0),
      bestRating: Math.max(
        getRating(stats.chess_bullet),
        getRating(stats.chess_blitz),
        getRating(stats.chess_rapid),
        getRating(stats.chess_classical)
      ),
    };
  } catch (error) {
    console.error(`Chess.com fetch failed for ${seehiki}:`, error.message);
    if (error.response?.status === 404) {
      console.error(`User ${seehiki} not found on Chess.com`);
    }
    return null;
  }
}

module.exports = parseChess;
