const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Import all parsers
const parseLeetCode = require('./parse-leetcode.js');
const parseCodeforces = require('./parse-codeforces.js');
const parseCodeChef = require('./parse-codechef.js');
const parseAtCoder = require('./parse-atcoder.js');
const parseChess = require('./parse-chess.js');
const parseMAL = require('./parse-mal.js');

async function fetchAllStats() {
  const stats = {
    timestamp: new Date().toUTCString(),
    platforms: {
      leetcode: null,
      codeforces: null,
      codechef: null,
      atcoder: null,
      chess: null,
      mal: null,
    },
  };

  // Fetch LeetCode stats
  if (process.env.LEETCODE_USERNAME) {
    console.log('📖 Fetching LeetCode stats...');
    try {
      stats.platforms.leetcode = await parseLeetCode(process.env.LEETCODE_USERNAME);
      console.log('✅ LeetCode stats fetched');
    } catch (err) {
      console.error('❌ LeetCode error:', err.message);
    }
  }

  // Fetch Codeforces stats
  if (process.env.CODEFORCES_USERNAME) {
    console.log('⚔️ Fetching Codeforces stats...');
    try {
      stats.platforms.codeforces = await parseCodeforces(process.env.CODEFORCES_USERNAME);
      console.log('✅ Codeforces stats fetched');
    } catch (err) {
      console.error('❌ Codeforces error:', err.message);
    }
  }

  // Fetch CodeChef stats
  if (process.env.CODECHEF_USERNAME) {
    console.log('🍳 Fetching CodeChef stats...');
    try {
      stats.platforms.codechef = await parseCodeChef(process.env.CODECHEF_USERNAME);
      console.log('✅ CodeChef stats fetched');
    } catch (err) {
      console.error('❌ CodeChef error:', err.message);
    }
  }

  // Fetch AtCoder stats
  if (process.env.ATCODER_USERNAME) {
    console.log('🏯 Fetching AtCoder stats...');
    try {
      stats.platforms.atcoder = await parseAtCoder(process.env.ATCODER_USERNAME);
      console.log('✅ AtCoder stats fetched');
    } catch (err) {
      console.error('❌ AtCoder error:', err.message);
    }
  }

  // Fetch Chess.com stats (no auth required)
  if (process.env.CHESS_USERNAME) {
    console.log('♟️ Fetching Chess.com stats...');
    try {
      stats.platforms.chess = await parseChess(process.env.CHESS_USERNAME, 1000);
      console.log('✅ Chess.com stats fetched');
    } catch (err) {
      console.error('❌ Chess.com error:', err.message);
    }
  }

  // Fetch MyAnimeList stats (requires OAuth2 token)
  if (process.env.MAL_USERNAME && process.env.MAL_ACCESS_TOKEN) {
    console.log('🎌 Fetching MyAnimeList stats...');
    try {
      stats.platforms.mal = await parseMAL(
        process.env.MAL_USERNAME,
        process.env.MAL_ACCESS_TOKEN,
        1000
      );
      console.log('✅ MyAnimeList stats fetched');
    } catch (err) {
      console.error('❌ MyAnimeList error:', err.message);
    }
  }

  // Output stats as JSON
  const statsJson = JSON.stringify(stats);
  console.log(`\n📦 Total stats size: ${statsJson.length} bytes`);
  console.log(`::set-output name=stats::${statsJson}`);

  // Save to temp file for next step
  fs.writeFileSync('/tmp/cp-stats.json', statsJson);
  console.log('✅ Stats saved to /tmp/cp-stats.json');
}

fetchAllStats().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
