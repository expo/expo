---
title: Persist notes across restarts, with a migration path
skill: expo-sqlite
---

Notes in this app disappear whenever I restart it. Store them on the device so they survive restarts. We'll definitely add more fields to notes later, so set the storage up in a way that lets us change the schema without wiping people's existing notes.
