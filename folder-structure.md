# Phases Project Folder Structure

```
phases/
├── package.json
├── readme.md
├── .github
|     ├── scripts
|     |     ├── fetch-stats.js
|     |     ├── parse-atCoder.js
|     |     ├── parse-chess.js
|     |     ├── parse-codechef.js
|     |     ├── parse-codeforces.js
|     |     ├── parse-leetcode.js
|     |     ├── parse-mal.js
|     |     └── update-readme.js
|     |
│     └── workflow
|          └── update-readme.yml
├── src/
│   ├── index.ts
│   ├── api/
│   │   └── routes.ts
│   ├── core/
│   │   ├── achievement-manager.ts
│   │   ├── badge-unlocker.ts
│   │   ├── event-emitter.ts
│   │   ├── leaderboard-manager.ts
│   │   └── xp-calculator.ts
│   ├── database/
│   │   └── schema.ts
│   ├── integrations/
│   │   └── github-webhook.ts
│   ├── tests/
│   │   └── acievement.test.ts
│   └── types/
│       ├── achievement.ts
│       ├── badge.ts
│       ├── leaderboard.ts
│       └── xp.ts
```
