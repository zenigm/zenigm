const fs = require('fs');
const path = require('path');

function generateStatsMarkdown(stats) {
  let markdown = `<!-- START_SECTION:COMPETITIVE_STATS -->

## 🏆 Competitive Programming Stats

> Last updated: ${new Date().toUTCString()}

`;

  // LeetCode section
  if (stats.platforms.leetcode) {
    const lc = stats.platforms.leetcode;
    markdown += `
### 📖 LeetCode
| Metric | Value |
|--------|-------|
| **Username** | [\`${lc.username}\`](https://leetcode.com/u/${lc.username}/) |
| **Total Solved** | ${lc.solvedCount} problems |
| **Easy** | ${lc.totalSolvedByDifficulty.easy} ⭐ |
| **Medium** | ${lc.totalSolvedByDifficulty.medium} ⭐⭐ |
| **Hard** | ${lc.totalSolvedByDifficulty.hard} ⭐⭐⭐ |
| **Badges** | ${lc.badges} 🏅 |
| **Acceptance Rate** | ${(lc.solvedCount / (lc.totalSubmissions || 1) * 100).toFixed(2)}% |

`;
  }

  // Codeforces section
  if (stats.platforms.codeforces) {
    const cf = stats.platforms.codeforces;
    markdown += `
### ⚔️ Codeforces
| Metric | Value |
|--------|-------|
| **Handle** | [\`${cf.username}\`](https://codeforces.com/profile/${cf.username}) |
| **Current Rating** | ${cf.rating} |
| **Max Rating** | ${cf.maxRating} |
| **Rank** | ${cf.rank} |
| **Max Rank** | ${cf.maxRank} |
| **Contests** | ${cf.contests} 🎭 |
| **Solved Problems** | ${cf.solvedProblems} ✅ |

`;
  }

  // CodeChef section
  if (stats.platforms.codechef) {
    const cc = stats.platforms.codechef;
    markdown += `
### 🍳 CodeChef
| Metric | Value |
|--------|-------|
| **Username** | [\`${cc.username}\`](https://www.codechef.com/users/${cc.username}) |
| **Current Rating** | ${cc.rating} |
| **Best Rating** | ${cc.maxRating} |
| **Contests** | ${cc.contests} 📊 |
| **Global Rank** | ${cc.globalRank} |
| **Solved Problems** | ${cc.solvedProblems} (Short) / ${cc.allSolvedProblems} (All) |
| **Submissions** | ${cc.totalSubmissions} |

`;
  }

  // AtCoder section
  if (stats.platforms.atcoder) {
    const ac = stats.platforms.atcoder;
    markdown += `
### 🏯 AtCoder
| Metric | Value |
|--------|-------|
| **Username** | [\`${ac.username}\`](${ac.profileUrl}) |
| **Rating** | ${ac.rating} |
| **Max Rating** | ${ac.maxRating} |
| **Contests** | ${ac.contests} 🎪 |

`;
  }

  markdown += `
<!-- END_SECTION:COMPETITIVE_STATS -->`;

  return markdown;
}

function updateReadme(statsJson) {
  const readmePath = path.join(process.cwd(), 'README.md');
  let readmeContent = fs.readFileSync(readmePath, 'utf8');

  // Parse stats from JSON (read from file if env var is too large)
  let stats;
  if (process.env.STATS_JSON) {
    stats = JSON.parse(process.env.STATS_JSON);
  } else {
    stats = JSON.parse(fs.readFileSync('/tmp/cp-stats.json', 'utf8'));
  }

  const newMarkdown = generateStatsMarkdown(stats);

  // Replace or append section
  if (readmeContent.includes('START_SECTION:COMPETITIVE_STATS')) {
    readmeContent = readmeContent.replace(
      /<!-- START_SECTION:COMPETITIVE_STATS -->[\s\S]*?<!-- END_SECTION:COMPETITIVE_STATS -->/,
      newMarkdown
    );
  } else {
    // Append to end of file
    readmeContent += '\n\n' + newMarkdown;
  }

  fs.writeFileSync(readmePath, readmeContent, 'utf8');
  console.log('✅ README updated with competitive programming stats');
}

try {
  updateReadme();
  console.log('✨ Update completed successfully');
} catch (error) {
  console.error('❌ Error updating README:', error.message);
  process.exit(1);
}
