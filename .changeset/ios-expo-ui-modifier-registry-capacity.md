---
'@expo/ui': patch
---

[iOS] Make the setup of `ViewModifierRegistry` at launch faster. It reserves room for the built-in modifiers and hashes the name of each modifier once.
