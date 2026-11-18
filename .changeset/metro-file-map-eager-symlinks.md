---
'@expo/metro-file-map': patch
---

Fix symlinks repointed while Metro isn't running (for example by `pnpm install`) resolving to their previous target. Symlinks are now stat'd and read when the file map is built, as in upstream Metro.
