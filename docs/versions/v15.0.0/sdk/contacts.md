---
title: Contacts
old_permalink: /versions/v12.0.0/sdk/contacts.html
previous___FILE: ./constants.md
next___FILE: ./facebook.md
---

Provides access to the phone's system contacts.

### `Exponent.Contacts.getContactsAsync(fields)`

Get a list of all entries in the system contacts. This returns the name and optionally phone number and email of each contact.

#### Arguments

-   **fields (_array_)** -- An array describing fields to retrieve per contact. Each element must be one of `Exponent.Contacts.PHONE_NUMBERS` or `Exponent.Contacts.EMAILS`.

#### Returns

An array of objects of the form `{ id, name, phoneNumbers, emails, addresses, jobTitle, company  }` with `phoneNumbers`, `emails`, and `addresses` only present if they were requested through the `fields` parameter. iOS also includes `firstName, middleName, lastName`.

#### Example

```javascript
async function showFirstContactAsync() {
  const contacts = await Exponent.Contacts.getContactsAsync([
    Exponent.Contacts.PHONE_NUMBERS,
    Exponent.Contacts.EMAILS,
  ]);
  if (contacts.length > 0) {
    Alert.alert(
      'Your first contact is...',
      `Name: ${contacts[0].name}\n` +
      `Phone: ${JSON.stringify(contacts[0].phoneNumbers)}\n` +
      `Email: ${JSON.stringify(contacts[0].emails)}`
    );
  }
}
```

This function will display the first entry in the user's contacts.
