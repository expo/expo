---
'@expo/ui': patch
---

[Android] Fix a `ListItem` inside `FieldGroup.Section` being rendered inside a second Material `ListItem`, which drew an inset inner card, made the row taller than other rows and shrank its tap target. The `ListItem` is now styled as the section's row, and its ripple follows the row's rounded shape.
