---
'@expo/ui': patch
---

[iOS] Reduce the binary size of modifiers. Simple modifiers are now functions instead of structs, so they do not add type metadata or a `ViewModifier` conformance.
