---
'@expo/ui': patch
---

[iOS] Make the setup of `ViewModifierRegistry` at launch faster. It creates its dictionary from all built-in modifiers at once.
