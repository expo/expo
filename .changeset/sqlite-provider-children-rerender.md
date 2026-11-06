---
"expo-sqlite": patch
---

Fix `SQLiteProvider` skipping re-renders when only `children` change. Re-import the database when `assetSource` changes, and keep it open when a new object has the same contents.
