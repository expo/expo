---
'expo-modules-autolinking': patch
---

On iOS, the generated modules provider qualifies a class with its Swift module through a module selector, as in `ExpoClipboard::ClipboardModule`, when autolinking can determine that module. That's every class of a package with one Swift module, and a scanned class of a package with several when one pod is in the closest directory above its source file. A class qualified this way no longer makes the provider ambiguous when another package has a class of the same name, and a type of the same name in the app target no longer shadows it.
