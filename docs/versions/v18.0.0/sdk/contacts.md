---
title: Contacts
---

Provides access to the phone's system contacts.

### `Expo.Contacts.getContactsAsync(options)`

Get a list of all entries in the system contacts. This returns a set of data related to contact entries.

#### param object options

A map of options:

-   **fields (_array_)** -- An array describing fields to retrieve per contact. Each element must be one of constants listed in the table below.

-   **pageSize (_number_)** -- The number of contacts per page that will be returned. Defaults to 100.

-   **pageOffset (_number_)** -- The number of contacts to skip before those that will be returned. Defaults to 0.

#### Returns

A pagination object that contains the following fields.

-   **data (_array_)** -- An array of objects of the form `{ id, name, firstName, middleName, lastName, nickname, jobTitle, company, department, imageAvailable  }`. iOS also includes `previousLastName`. The additional fields are listed in the table below.

-   **hasNextPage (_boolean_)** -- If there is more contacts available.

-   **hasPreviousPage (_boolean_)** -- If there was contacts skipped. Will be true when passing a pageOffset greater than 0.

-   **total (_number_)** -- The total number of contacts available.

### `Expo.Contacts.getContactByIdAsync(options)`

Get a single contact from system contacts associated to specified `id`.

#### param object options

A map of options:

-   **id (_string/number_)** - ID of the contact to fetch. Mind that this is a _string_ on iOS and an _int_ on Android. 

-   **fields (_array_)** -- An array describing fields to retrieve. Each element must be one of constants listed in the table below.

#### Returns

An object of the form `{ id, name, firstName, middleName, lastName, nickname, jobTitle, company, department, imageAvailable  }`. iOS also includes `previousLastName`. The additional fields are listed in the table below.

#### Constants and additional fields

This table illustrates what fields will be added on demand to every contact. Sample usage: `Expo.Contacts.EMAILS`.

| Constant                     | Name of returned field            | 
| ---------------------------- | --------------------------------- |
| PHONE_NUMBERS                | phoneNumbers                      |
| EMAILS                       | emails                            |
| ADDRESSES                    | addresses                         |
| IMAGE                        | image (_iOS only_)                |
| THUMBNAIL                    | thumbnail                         |
| NOTE                         | note                              |
| NON_GREGORIAN_BIRTHDAY       | nonGregorianBirthday (_iOS only_) |
| NAME_PREFIX                  | namePrefix                        |
| NAME_SUFFIX                  | nameSuffix                        |
| PHONETIC_FIRST_NAME          | phoneticFirstName                 |
| PHONETIC_MIDDLE_NAME         | phoneticMiddleName                |
| PHONETIC_LAST_NAME           | phoneticLastName                  |
| SOCIAL_PROFILES              | socialProfiles (_iOS only_)       |
| IM_ADDRESSES                 | instantMessageAddresses           |
| URLS                         | urlAddresses                      |
| DATES                        | dates                             |

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
      `Phone numbers: ${JSON.stringify(contacts.data[0].phoneNumbers)}\n` +
      `Emails: ${JSON.stringify(contacts.data[0].emails)}`
    );
  }
}
```

This function will display the first entry in the user's contacts.

#### Related types

**phoneNumbers** -- An array containing phone numbers data of a contact.

Fields: `{ number, digits, primary (boolean), countryCode }`

**emails** -- An array containing emails data of a contact.

Fields: `{ email, primary (boolean) }`

**addresses** -- An array containing postal addresses data of a contact.

Fields: `{ street, city, country, region, neighborhood, postalCode, poBox, isoCountryCode }`

**socialProfiles** -- An array containing social profiles (Facebook, Twitter, etc.) data of a contact.

Fields: `{ service, localizedProfile, url, username, userId }`

**instantMessageAddresses** -- An array containing IM addresses (Skype, Google Hangouts, etc.) data of a contact.

Fields: `{ service, username, localizedService }`

**urls** -- An array containing website urls of a contact.

Fields: `{ url }`

**dates** -- An array containing dates assigned to a contact.

Fields: `{ day, month, year }`

**relationships** -- An array containing relationships assigned a contact.

Fields: `{ name }`

Moreover every entry in arrays above contains parameters `id` and `label`.

**birthday**, **nonGregorianBirthday** - Gregorian and non-Gregorian representation of contact's birthday.

Fields: ` { day, month, year }`

**thumbnail**, **image** - thumbnail and original image of a contact picture.

Fields: `{ uri } ` -- use this `uri` as `<Image>` component's `source` prop to display the picture. Mind that fetching these is time and resource-consuming on iOS and should not be used when fetching all contacts.
