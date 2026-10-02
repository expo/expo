---
'expo-contacts': patch
---

Fix `Contact.presentCreateForm` on iOS opening the read-only contact view instead of the new-contact editor, and resolve it with a boolean instead of `null`.
