---
'expo': patch
---

Remove the deprecated `expo-video-thumbnails` from the bundled native modules, so `npx expo install` no longer pins its version. Use `generateThumbnailsAsync` from `expo-video` instead.
