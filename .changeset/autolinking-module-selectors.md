---
'expo-modules-autolinking': patch
---

On iOS, the generated modules provider qualifies every class with its Swift module through a module selector, as in `ExpoClipboard::ClipboardModule`. Two packages with a class of the same name no longer make the provider ambiguous, and a type of the same name in the app target no longer shadows a package's class.
