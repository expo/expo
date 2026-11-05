---
'expo-contacts': patch
---

[iOS] Fix `Contact.getNote`, `Contact.setNote`, and `Contact.patch` with a `note` stopping the app when the app cannot access the note field. They now reject with `ERR_CONTACT_NOTES_NOT_ACCESSIBLE`.
