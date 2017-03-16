---
title: Contacts
---

Provides access to the phone's system contacts.

### `Expo.Contacts.getContactsAsync(fields)`

Get a list of all entries in the system contacts. This returns the name and optionally phone number and email of each contact.

#### Arguments

-   **fields (_array_)** -- An array describing fields to retrieve per contact. Each element must be one of `Expo.Contacts.PHONE_NUMBERS` or `Expo.Contacts.EMAILS`.

#### Returns

An array of objects of the form `{ id, name, phoneNumbers, emails, addresses, jobTitle, company  }` with `phoneNumbers`, `emails`, and `addresses` only present if they were requested through the `fields` parameter. iOS also includes `firstName, middleName, lastName`.

#### Example

```javascript
async function showFirstContactAsync() {
  // Ask for permission to query contacts.
  const permission = await Expo.Permissions.askAsync(Expo.Permissions.CONTACTS);
  if (permission.status !== 'granted') {
    // Permission was denied...
    return;
  }
  const contacts = await Expo.Contacts.getContactsAsync([
    Expo.Contacts.PHONE_NUMBERS,
    Expo.Contacts.EMAILS,
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
