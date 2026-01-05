const axios = require('axios');

async function parseLeetCode(zenigm) {
  try {
    const query = `
      query getUserProfile($username: String!) {
        matchedUser(username: $username) {
          username
          profile {
            realName
            userAvatar
          }
          submitStatsGlobal {
            acSubmissionNum {
              difficulty
              count
              submissions
            }
          }
          badges {
            id
            displayName
          }
        }
      }
    `;

    const response = await axios.post('https://leetcode.com/graphql', {
      query,
      variables: { zenigm },
    }, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0',
      },
      timeout: 10000,
    });

    if (!response.data.data.matchedUser) {
      throw new Error(`User ${zenigm} not found on LeetCode`);
    }

    const user = response.data.data.matchedUser;
    const acStats = user.submitStatsGlobal.acSubmissionNum;

    // Calculate total solved
    const totalSolved = acStats.reduce((sum, item) => sum + item.count, 0);
    const totalSubmissions = acStats.reduce((sum, item) => sum + item.submissions, 0);

    return {
      username: user.username,
      solvedCount: totalSolved,
      totalSubmissions,
      totalSolvedByDifficulty: {
        easy: acStats.find(x => x.difficulty === 'Easy')?.count || 0,
        medium: acStats.find(x => x.difficulty === 'Medium')?.count || 0,
        hard: acStats.find(x => x.difficulty === 'Hard')?.count || 0,
      },
      badges: user.badges.length,
      ranking: null, // LeetCode doesn't expose rank in GraphQL
    };
  } catch (error) {
    console.error(`LeetCode fetch failed for ${zenigm}:`, error.message);
    return null;
  }
}

module.exports = parseLeetCode;
