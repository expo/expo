---
'expo-image': patch
---

[iOS] Report image downloads to React Native's core network reporter, so they show in the React Native DevTools Network panel. `Image.prefetch` and the blurhash and thumbhash generators now share the image loaders instead of creating a downloader per call.
