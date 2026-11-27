---
'expo-clipboard': patch
---

[iOS] Add `onFittingSizeChange` to `ClipboardPasteButton`. It reports the size the button needs to show its whole content. `UIPasteControl` draws an empty box when its frame is smaller than its content, which happens with longer translations of "Paste" and with larger text sizes. Use the size as the minimum width and height of the button.
