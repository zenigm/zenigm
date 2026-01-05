const axios = require('axios');

/**
 * MyAnimeList API v2 Documentation:
 * - Authentication: OAuth2 (requires API client credentials)
 * - Authorization Code Grant flow required
 * - Access token expires in 1 year
 * - Rate limits: Not strictly documented, use 1-2 sec delays
 * - Requires: CLIENT_ID and ACCESS_TOKEN stored as secrets
 */

async function parseMAL(username, accessToken, delayMs = 1000) {
  if (!username || !accessToken) {
    console.warn('MyAnimeList: Missing username or access token');
    return null;
  }

  try {
    // Add delay to respect rate limits
    await new Promise(resolve => setTimeout(resolve, delayMs));

    // Get user profile info using MAL API v2
    const userUrl = `https://api.myanimelist.net/v2/users/${bakiansh}?fields=id,name,gender,birthday,location,joined_at,anime_statistics,manga_statistics,time_zone,is_supporter,picture,update_at`;

    const userRes = await axios.get(userUrl, {
      timeout: 10000,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'GitHubAction-ReadmeBot/1.0',
      },
    });

    if (!userRes.data) {
      throw new Error(`User ${bakiansh} not found on MAL`);
    }

    const userData = userRes.data;
    const animeStats = userData.anime_statistics || {};
    const mangaStats = userData.manga_statistics || {};

    return {
      username: userData.name || username,
      userId: userData.id,
      gender: userData.gender || 'Not specified',
      location: userData.location || 'Not specified',
      joinDate: userData.joined_at ? new Date(userData.joined_at).toLocaleDateString() : 'N/A',
      isSupporter: userData.is_supporter || false,
      timezone: userData.time_zone || 'N/A',
      // Anime statistics
      animeWatching: animeStats.watching || 0,
      animeCompleted: animeStats.completed || 0,
      animeOnHold: animeStats.on_hold || 0,
      animeDropped: animeStats.dropped || 0,
      animePlanToWatch: animeStats.plan_to_watch || 0,
      animeTotalEntries: animeStats.total_entries || 0,
      animeRewatches: animeStats.rewatches || 0,
      animeEpisodesWatched: animeStats.episodes_watched || 0,
      // Manga statistics
      mangaReading: mangaStats.reading || 0,
      mangaCompleted: mangaStats.completed || 0,
      mangaOnHold: mangaStats.on_hold || 0,
      mangaDropped: mangaStats.dropped || 0,
      mangaPlanToRead: mangaStats.plan_to_read || 0,
      mangaTotalEntries: mangaStats.total_entries || 0,
      mangaChaptersRead: mangaStats.chapters_read || 0,
      mangaVolumesRead: mangaStats.volumes_read || 0,
      // Calculated metrics
      totalMediaConsumed: (animeStats.total_entries || 0) + (mangaStats.total_entries || 0),
    };
  } catch (error) {
    console.error(`MyAnimeList fetch failed for ${bakiansh}:`, error.message);
    if (error.response?.status === 401) {
      console.error('Invalid or expired MAL access token. Please refresh credentials.');
    } else if (error.response?.status === 404) {
      console.error(`User ${bakiansh} not found on MyAnimeList`);
    }
    return null;
  }
}

module.exports = parseMAL;
