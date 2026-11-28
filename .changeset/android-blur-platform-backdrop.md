---
'expo-blur': minor
---

[Android] Add the `platformBackdrop` blur method. On Android 17 QPR (SDK 37.2) and later it blurs the content behind the view with the platform backdrop API (`RenderNode.setBackdropRenderEffect`), without `blurTarget` or a snapshot of the view tree. On older versions it falls back to `dimezisBlurViewSdk31Plus`.
