---
'expo-contacts': patch
---

[iOS] Fix `Contact.getNote`, `Contact.setNote`, and `Contact.patch` with a `note` stopping the app when the app cannot access the note field. `getNote` now resolves to `null`, like `getDetails`, and the setters reject with an error.
