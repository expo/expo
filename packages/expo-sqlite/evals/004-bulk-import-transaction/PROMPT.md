---
title: Import thousands of rows atomically
skill: expo-sqlite
---

Add an importNotesAsync(texts: string[]) function to this app that inserts up to a few thousand notes at once. If any row fails, none of them should be saved. It runs while the rest of the app keeps querying the database, and it should be reasonably fast.
