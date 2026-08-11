---
title: Replace async-storage with what expo-sqlite already provides
skill: expo-sqlite
---

We're trimming dependencies. This app already uses expo-sqlite for its notes, but src/settings.ts pulls in @react-native-async-storage/async-storage just for a few key-value settings. Get rid of that extra dependency without changing how settings behave.
