---
title: Fix the crashing (and injectable) search query
skill: expo-sqlite
---

Users report that searching notes crashes the app when the search text contains an apostrophe, like "don't". The search code is in src/db.ts. Please fix it properly.
