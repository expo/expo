---
'expo-router': patch
---

Make the `renderingMode` prop of `NativeTabs.Trigger.Icon` work on Android and for SF Symbols, and accept a separate mode for the selected state. The default and selected icons can now use different rendering modes on iOS. On iOS, a `src` icon without `renderingMode` is now drawn as a template in the selected state when only that state has an icon color.

**Breaking change:** On Android, `renderingMode="original"` on a `src` icon now keeps its own colors. Set `renderingMode="template"` to keep the old tint.
