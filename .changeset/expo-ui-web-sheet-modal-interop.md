---
'@expo/ui': patch
---

[web] Fix a React Native `Modal` opened from `BottomSheet` content rendering under the sheet and ignoring clicks. The sheet opened its dialog with `showModal()`, and the HTML spec makes everything outside a modal dialog inert; the sheet now opens with `show()` in a portal under `<body>` and provides the scrim, Escape handling, focus restore, and background `inert` itself, so overlays that portal to `<body>` stay usable above the sheet.
