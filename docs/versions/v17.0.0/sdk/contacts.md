---
title: Contacts
---

Provides access to the phone's system contacts.

### `Expo.Contacts.getContactsAsync(options)`

Get a list of all entries in the system contacts. This returns the name and optionally phone number and email of each contact.

#### param object options

A map of options:

-   **fields (_array_)** -- An array describing fields to retrieve per contact. Each element must be one of `Expo.Contacts.PHONE_NUMBERS` or `Expo.Contacts.EMAILS`.

-   **pageSize (_number_)** -- The number of contacts per page that will be returned. Defaults to 100.

-   **pageOffset (_number_)** -- The number of contacts to skip before those that will be returned. Defaults to 0.

#### Returns

A pagination object that contains the following fields.

-   **data (_array_)** -- An array of objects of the form `{ id, name, phoneNumbers, emails, addresses, jobTitle, company  }` with `phoneNumbers`, `emails`, and `addresses` only present if they were requested through the `fields` parameter. iOS also includes `firstName, middleName, lastName`.

-   **hasNextPage (_boolean_)** -- If there is more contacts available.

-   **hasPreviousPage (_boolean_)** -- If there was contacts skipped. Will be true when passing a pageOffset greater than 0.

-   **total (_number_)** -- The total number of contacts available.

#### Example

```javascript
async function showFirstContactAsync() {
  // Ask for permission to query contacts.
  const permission = await Expo.Permissions.askAsync(Expo.Permissions.CONTACTS);
  if (permission.status !== 'granted') {
    // Permission was denied...
    return;
  }
  const contacts = await Expo.Contacts.getContactsAsync({
    fields: [
      Expo.Contacts.PHONE_NUMBERS,
      Expo.Contacts.EMAILS,
    ],
    pageSize: 10,
    pageOffset: 0,
  });
  if (contacts.total > 0) {
    Alert.alert(
      'Your first contact is...',
      `Name: ${contacts.data[0].name}\n` +
      `Phone: ${JSON.stringify(contacts.data[0].phoneNumbers)}\n` +
      `Email: ${JSON.stringify(contacts.data[0].emails)}`
    );
  }
}
```

This function will display the first entry in the user's contacts.
