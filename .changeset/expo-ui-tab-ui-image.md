---
'@expo/ui': patch
---

[iOS] Added the `uiImage` prop to `TabView.Tab`, which shows an image from a local file as the tab's icon instead of an SF Symbol. The image is drawn as a template, so the tab bar tints it, and a `@2x` / `@3x` suffix in the file name sets its scale.
