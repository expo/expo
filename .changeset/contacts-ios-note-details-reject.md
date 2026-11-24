---
'expo-contacts': major
---

[iOS] `Contact.getDetails` and `Contact.getAllDetails` now reject with `ERR_CONTACT_NOTES_NOT_ACCESSIBLE` when `fields` includes `ContactField.NOTE` and the app cannot access the note field. Before, they resolved without the note. `getDetails()` without `fields` still leaves the note out.
