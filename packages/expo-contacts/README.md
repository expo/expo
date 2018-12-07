# expo-contacts

## Installation

### iOS (Cocoapods)

If you're using Cocoapods, add the dependency to your `Podfile`:

`pod 'EXContacts'`

and run `pod install`.

### Android

1. Append the following lines to `android/settings.gradle`:

   ```gradle
   include ':expo-contacts'
   project(':expo-contacts').projectDir = new File(rootProject.projectDir, '../node_modules/expo-contacts/android')
   ```

   and if not already included

   ```gradle
   include ':expo-permissions-interface'
   project(':expo-permissions-interface').projectDir = new File(rootProject.projectDir, '../node_modules/expo-permissions-interface/android')

      include ':expo-filesystem-interface'
   project(':expo-filesystem-interface').projectDir = new File(rootProject.projectDir, '../node_modules/expo-filesystem-interface/android')
   ```

2. Insert the following lines inside the dependencies block in `android/app/build.gradle`:
   ```gradle
   compile project(':expo-contacts')
   ```
   and if not already included
   ```gradle
   compile project(':expo-permissions-interface')
   compile project(':expo-filesystem-interface')
   ```

## Introduction

Provides access to the phone's system contacts.

## Methods

### getContactsAsync

```js
getContactsAsync(contactQuery: ContactQuery): Promise<ContactResponse>
```

Return a list of contacts that fit a given criteria.
You can get all of the contacts by passing no criteria.

**Parameters**

| Name         | Type           | Description             |
| ------------ | -------------- | ----------------------- |
| contactQuery | `ContactQuery` | Used to query contacts. |

**Returns**

| Name            | Type              | Description                       |
| --------------- | ----------------- | --------------------------------- |
| contactResponse | `ContactResponse` | Contacts returned from the query. |

**Example**

```js
const { data } = await Contacts.getContactsAsync({
  fields: [Contacts.Fields.Emails],
});

if (data.length > 0) {
  const contact = data[0];
  console.log(contact);
}
```

### getContactByIdAsync

```js
getContactByIdAsync(contactId: string, fields: FieldType[]): Promise<Contact>
```

Returns a contact matching the input id. Used for gathering precise data about a contact.

**Parameters**

| Name      | Type          | Description                                                                                  |
| --------- | ------------- | -------------------------------------------------------------------------------------------- |
| contactId | `string`      | The ID of a system contact.                                                                  |
| fields    | `FieldType[]` | If available the fields defined will be returned. If `nil` then all fields will be returned. |

**Returns**

| Name    | Type      | Description                               |
| ------- | --------- | ----------------------------------------- |
| contact | `Contact` | Contact with an ID matching the input ID. |

**Example**

```js
const contact = await Contacts.getContactByIdAsync('161A368D-D614-4A15-8DC6-665FDBCFAE55');
if (contact) {
  console.log(contact);
}
```

### addContactAsync

> iOS Only - temporary

```js
addContactAsync(contact: Contact, containerId: string): Promise<string>
```

Creates a new contact and adds it to the system.

**Parameters**

| Name        | Type      | Description                                                                          |
| ----------- | --------- | ------------------------------------------------------------------------------------ |
| contact     | `Contact` | A contact with the changes you wish to persist. The `id` parameter will not be used. |
| containerId | `string`  | IOS ONLY: The container that will parent the contact                                 |

**Returns**

| Name      | Type     | Description                   |
| --------- | -------- | ----------------------------- |
| contactId | `string` | ID of the new system contact. |

**Example**

```js
const contact = {
  [Contacts.Fields.FirstName]: 'Bird',
  [Contacts.Fields.LastName]: 'Man',
  [Contacts.Fields.Company]: 'Young Money',
};
const contactId = await Contacts.addContactAsync(contact);
```

### updateContactAsync

> iOS Only - temporary

```js
updateContactAsync(contact: Contact): Promise<string>
```

Mutate the information of an existing contact.

> On Android, you can use `presentFormAsync` to make edits to contacts.
> Do to an error with the Apple API, `nonGregorianBirthday` cannot be modified.

**Parameters**

| Name    | Type      | Description                                                                           |
| ------- | --------- | ------------------------------------------------------------------------------------- |
| contact | `Contact` | A contact with the changes you wish to persist. The contact must contain a vaild `id` |

**Returns**

| Name      | Type     | Description                 |
| --------- | -------- | --------------------------- |
| contactId | `string` | The ID of a system contact. |

**Example**

```js
const contact = {
  id: '161A368D-D614-4A15-8DC6-665FDBCFAE55',
  [Contacts.Fields.FirstName]: 'Drake',
  [Contacts.Fields.Company]: 'Young Money',
};
await Contacts.updateContactAsync(contact);
```

### removeContactAsync

> iOS Only - temporary

```js
removeContactAsync(contactId: string): Promise<any>
```

Delete a contact from the system.

**Parameters**

| Name      | Type     | Description                           |
| --------- | -------- | ------------------------------------- |
| contactId | `string` | ID of the contact you want to delete. |

**Example**

```js
await Contacts.removeContactAsync('161A368D-D614-4A15-8DC6-665FDBCFAE55');
```

### writeContactToFileAsync

```js
writeContactToFileAsync(contactQuery: ContactQuery): Promise<string>
```

Query a set of contacts and write them to a local uri that can be used for sharing with `ReactNative.Share`.

**Parameters**

| Name         | Type           | Description                               |
| ------------ | -------------- | ----------------------------------------- |
| contactQuery | `ContactQuery` | Used to query contacts you want to write. |

**Returns**

| Name     | Type     | Description         |
| -------- | -------- | ------------------- |
| localUri | `string` | Shareable local uri |

**Example**

```js
const localUri = await Contacts.writeContactToFileAsync({
  id: '161A368D-D614-4A15-8DC6-665FDBCFAE55',
});
Share.share({ url: localUri, message: 'Call me!' });
```

---

## IOS Only Functions

iOS contacts have a multi-layered grouping system that you can access through this API.

### presentFormAsync

```js
presentFormAsync(contactId: string, contact: Contact, formOptions: FormOptions): Promise<any>
```

Present a native form for manipulating contacts

**Parameters**

| Name        | Type          | Description                                     |
| ----------- | ------------- | ----------------------------------------------- |
| contactId   | `string`      | The ID of a system contact.                     |
| contact     | `Contact`     | A contact with the changes you wish to persist. |
| formOptions | `FormOptions` | Options for the native editor                   |

**Example**

```js
// Edit contact
await Contacts.presentFormAsync('161A368D-D614-4A15-8DC6-665FDBCFAE55');
```

### addExistingGroupToContainerAsync

```js
addExistingGroupToContainerAsync(groupId: string, containerId: string): Promise<any>
```

Add a group to a container.

**Parameters**

| Name        | Type     | Description                             |
| ----------- | -------- | --------------------------------------- |
| groupId     | `string` | The group you wish to target.           |
| containerId | `string` | The container you to add membership to. |

**Example**

```js
await Contacts.addExistingGroupToContainerAsync(
  '161A368D-D614-4A15-8DC6-665FDBCFAE55',
  '665FDBCFAE55-D614-4A15-8DC6-161A368D'
);
```

### createGroupAsync

```js
createGroupAsync(groupName: string, containerId?: string): Promise<string>
```

Create a group with a name, and add it to a container. If the container is undefined, the default container will be targeted.

**Parameters**

| Name        | Type     | Description                             |
| ----------- | -------- | --------------------------------------- |
| name        | `string` | Name of the new group.                  |
| containerId | `string` | The container you to add membership to. |

**Returns**

| Name    | Type     | Description          |
| ------- | -------- | -------------------- |
| groupId | `string` | ID of the new group. |

**Example**

```js
const groupId = await Contacts.createGroupAsync('Sailor Moon');
```

### updateGroupNameAsync

```js
updateGroupNameAsync(groupName: string, groupId: string): Promise<any>
```

Change the name of an existing group.

**Parameters**

| Name      | Type     | Description                        |
| --------- | -------- | ---------------------------------- |
| groupName | `string` | New name for an existing group.    |
| groupId   | `string` | ID for the group you want to edit. |

**Example**

```js
await Contacts.updateGroupName('Sailor Moon', '161A368D-D614-4A15-8DC6-665FDBCFAE55');
```

### removeGroupAsync

```js
removeGroupAsync(groupId: string): Promise<any>
```

Delete a group from the device.

**Parameters**

| Name    | Type     | Description      |
| ------- | -------- | ---------------- |
| groupId | `string` | ID of the group. |

**Example**

```js
await Contacts.removeGroupAsync('161A368D-D614-4A15-8DC6-665FDBCFAE55');
```

### addExistingContactToGroupAsync

```js
addExistingContactToGroupAsync(contactId: string, groupId: string): Promise<any>
```

Add a contact as a member to a group. A contact can be a member of multiple groups.

**Parameters**

| Name      | Type     | Description                                     |
| --------- | -------- | ----------------------------------------------- |
| contactId | `string` | ID of the contact you want to edit.             |
| groupId   | `string` | ID for the group you want to add membership to. |

**Example**

```js
await Contacts.addExistingContactToGroupAsync(
  '665FDBCFAE55-D614-4A15-8DC6-161A368D',
  '161A368D-D614-4A15-8DC6-665FDBCFAE55'
);
```

### removeContactFromGroupAsync

```js
removeContactFromGroupAsync(contactId: string, groupId: string): Promise<any>
```

Remove a contact's membership from a given group. This will not delete the contact.

**Parameters**

| Name      | Type     | Description                                        |
| --------- | -------- | -------------------------------------------------- |
| contactId | `string` | ID of the contact you want to remove.              |
| groupId   | `string` | ID for the group you want to remove membership of. |

**Example**

```js
await Contacts.removeContactFromGroupAsync(
  '665FDBCFAE55-D614-4A15-8DC6-161A368D',
  '161A368D-D614-4A15-8DC6-665FDBCFAE55'
);
```

### getGroupsAsync

```js
getGroupsAsync(query: GroupQuery): Promise<Group[]>
```

Query and return a list of system groups.

**Parameters**

| Name  | Type         | Description                                         |
| ----- | ------------ | --------------------------------------------------- |
| query | `GroupQuery` | Information regarding which groups you want to get. |

**Returns**

| Name   | Type      | Description                          |
| ------ | --------- | ------------------------------------ |
| groups | `Group[]` | Collection of groups that fit query. |

**Example**

```js
const groups = await Contacts.getGroupsAsync({ groupName: 'sailor moon' });
const allGroups = await Contacts.getGroupsAsync({});
```

### getDefaultContainerIdAsync

```js
getDefaultContainerIdAsync(): Promise<string>
```

Get the default container's ID.

**Returns**

| Name        | Type     | Description           |
| ----------- | -------- | --------------------- |
| containerId | `string` | Default container ID. |

**Example**

```js
const containerId = await Contacts.getDefaultContainerIdAsync();
```

### getContainersAsync

```js
getContainersAsync(containerQuery: ContainerQuery): Promise<Container[]>
```

Query a list of system containers.

**Parameters**

| Name           | Type             | Description                            |
| -------------- | ---------------- | -------------------------------------- |
| containerQuery | `ContainerQuery` | Information used to gather containers. |

**Returns**

| Name        | Type     | Description                              |
| ----------- | -------- | ---------------------------------------- |
| containerId | `string` | Collection of containers that fit query. |

**Example**

```js
const allContainers = await getContainersAsync({
  contactId: '665FDBCFAE55-D614-4A15-8DC6-161A368D',
});
```

## Types

### Contact

A set of fields that define information about a single entity.

| Name                    | Type                      | Description                                                    | iOS | Android |
| ----------------------- | ------------------------- | -------------------------------------------------------------- | --- | ------- |
| id                      | `string`                  | Immutable identifier used for querying and indexing.           | ✅  | ✅      |
| name                    | `string`                  | Full name with proper format.                                  | ✅  | ✅      |
| firstName               | `string`                  | Given name.                                                    | ✅  | ✅      |
| middleName              | `string`                  | Middle name.                                                   | ✅  | ✅      |
| lastName                | `string`                  | Family name.                                                   | ✅  | ✅      |
| maidenName              | `string`                  | Maiden name.                                                   | ✅  | ✅      |
| namePrefix              | `string`                  | Dr. Mr. Mrs. Ect...                                            | ✅  | ✅      |
| nameSuffix              | `string`                  | Jr. Sr. Ect...                                                 | ✅  | ✅      |
| nickname                | `string`                  | An alias to the proper name.                                   | ✅  | ✅      |
| phoneticFirstName       | `string`                  | Pronunciation of the first name.                               | ✅  | ✅      |
| phoneticMiddleName      | `string`                  | Pronunciation of the middle name.                              | ✅  | ✅      |
| phoneticLastName        | `string`                  | Pronunciation of the last name.                                | ✅  | ✅      |
| company                 | `string`                  | Organization the entity belongs to.                            | ✅  | ✅      |
| jobTitle                | `string`                  | Job description.                                               | ✅  | ✅      |
| department              | `string`                  | Job department.                                                | ✅  | ✅      |
| note                    | `string`                  | Additional information.                                        | ✅  | ✅      |
| imageAvailable          | `boolean`                 | Used for efficient retrieval of images.                        | ✅  | ✅      |
| image                   | `Image`                   | Thumbnail image (ios: 320x320)                                 | ✅  | ✅      |
| rawImage                | `Image`                   | Raw image without cropping, usually large.                     | ✅  | ✅      |
| contactType             | `ContactType`             | Denoting a person or company.                                  | ✅  | ✅      |
| birthday                | `Date`                    | Birthday information in JS format.                             | ✅  | ✅      |
| dates                   | `Date[]`                  | A list of other relevant user dates.                           | ✅  | ✅      |
| relationships           | `Relationship[]`          | Names of other relevant user connections                       | ✅  | ✅      |
| emails                  | `Email[]`                 | Email addresses                                                | ✅  | ✅      |
| phoneNumbers            | `PhoneNumber[]`           | Phone numbers                                                  | ✅  | ✅      |
| addresses               | `Address[]`               | Locations                                                      | ✅  | ✅      |
| instantMessageAddresses | `InstantMessageAddress[]` | IM connections                                                 | ✅  | ✅      |
| urlAddresses            | `UrlAddress[]`            | Web Urls                                                       | ✅  | ✅      |
| nonGregorianBirthday    | `Date`                    | Birthday that doesn't conform to the Gregorian calendar format | ✅  | ❌      |
| socialProfiles          | `SocialProfile[]`         | Social networks                                                | ✅  | ❌      |
| thumbnail               | `Image`                   | Deprecated: Use `image`                                        | ❌  | ❌      |
| previousLastName        | `string`                  | Deprecated: Use `maidenName`                                   | ❌  | ❌      |

### Group

> iOS Only

A parent to contacts. A contact can belong to multiple groups.
To get a group's children you can query with `getContactsAsync({ groupId })`

Here are some different query operations:

- Child Contacts: `getContactsAsync({ groupId })`
- Groups From Container: `getGroupsAsync({ containerId })`
- Groups Named: `getContainersAsync({ groupName })`

| Name | Type     | Description                         |
| ---- | -------- | ----------------------------------- |
| id   | `string` | Immutable id representing the group |
| name | `string` | The editable name of a group        |

### Container

> iOS Only

A parent to contacts and groups. You can query the default container with `getDefaultContainerIdAsync()`.
Here are some different query operations:

- Child Contacts: `getContactsAsync({ containerId })`
- Child Groups: `getGroupsAsync({ containerId })`
- Container from Contact: `getContainersAsync({ contactId })`
- Container from Group: `getContainersAsync({ groupId })`
- Container from ID: `getContainersAsync({ containerId })`

| Name | Type     | Description                         |
| ---- | -------- | ----------------------------------- |
| id   | `string` | Immutable id representing the group |
| name | `string` | The editable name of a group        |

### Date

| Name   | Type                 | Description                                       |
| ------ | -------------------- | ------------------------------------------------- |
| day    | `number`             | Day.                                              |
| month  | `number`             | Month - adjusted for JS `Date` which starts at 0. |
| year   | `number`             | Year.                                             |
| format | `CalendarFormatType` | Format for input date.                            |
| id     | `string`             | Unique ID.                                        |
| label  | `string`             | Localized display name.                           |

### Relationship

| Name  | Type     | Description              |
| ----- | -------- | ------------------------ |
| name  | `string` | Name of related contact. |
| id    | `string` | Unique ID.               |
| label | `string` | Localized display name.  |

### Email

| Name      | Type      | Description             |
| --------- | --------- | ----------------------- |
| email     | `string`  | email address.          |
| isPrimary | `boolean` | Primary email address.  |
| id        | `string`  | Unique ID.              |
| label     | `string`  | Localized display name. |

### PhoneNumber

| Name        | Type      | Description                               |
| ----------- | --------- | ----------------------------------------- |
| number      | `string`  | Phone number.                             |
| isPrimary   | `boolean` | Primary phone number.                     |
| digits      | `string`  | Phone number without format, ex: 8674305. |
| countryCode | `string`  | Country code, ex: +1.                     |
| id          | `string`  | Unique ID.                                |
| label       | `string`  | Localized display name.                   |

### Address

| Name           | Type     | Description                                                       |
| -------------- | -------- | ----------------------------------------------------------------- |
| street         | `string` | Street name.                                                      |
| city           | `string` | City name.                                                        |
| country        | `string` | Country name.                                                     |
| region         | `string` | Region or state name.                                             |
| neighborhood   | `string` | Neighborhood name.                                                |
| postalCode     | `string` | Local post code.                                                  |
| poBox          | `string` | P.O. Box.                                                         |
| isoCountryCode | `string` | [Standard code](https://www.iso.org/iso-3166-country-codes.html). |
| id             | `string` | Unique ID.                                                        |
| label          | `string` | Localized display name.                                           |

### SocialProfile

> iOS Only

| Name             | Type     | Description             |
| ---------------- | -------- | ----------------------- |
| service          | `string` | Name of social app.     |
| username         | `string` | Username in social app. |
| localizedProfile | `string` | Localized name.         |
| url              | `string` | Web URL.                |
| userId           | `string` | UID for social app.     |
| id               | `string` | Unique ID.              |
| label            | `string` | Localized display name. |

### InstantMessageAddress

| Name             | Type     | Description             |
| ---------------- | -------- | ----------------------- |
| service          | `string` | Name of social app.     |
| username         | `string` | Username in IM app.     |
| localizedService | `string` | Localized name of app.  |
| id               | `string` | Unique ID.              |
| label            | `string` | Localized display name. |

### UrlAddress

| Name  | Type     | Description             |
| ----- | -------- | ----------------------- |
| url   | `string` | Web URL                 |
| id    | `string` | Unique ID.              |
| label | `string` | Localized display name. |

### Image

Information regarding thumbnail images.

| Name   | Type     | iOS | Android |
| ------ | -------- | --- | ------- |
| uri    | `string` | ✅  | ✅      |
| width  | `number` | ✅  | ❌      |
| height | `number` | ✅  | ❌      |
| base64 | `string` | ✅  | ❌      |

> Android: You can get dimensions using `ReactNative.Image.getSize`. Avoid using Base 64 in React Native

### FormOptions

Denotes the functionality of a native contact form.

| Name                     | Type          | Description                                                                         |
| ------------------------ | ------------- | ----------------------------------------------------------------------------------- |
| displayedPropertyKeys    | `FieldType[]` | The properties that will be displayed. iOS: Does nothing in editing mode.           |
| message                  | `string`      | Controller title.                                                                   |
| alternateName            | `string`      | Used if contact doesn't have a name defined.                                        |
| cancelButtonTitle        | `string`      | The name of the left bar button.                                                    |
| groupId                  | `string`      | The parent group for a new contact.                                                 |
| allowsEditing            | `boolean`     | Allows for contact mutation.                                                        |
| allowsActions            | `boolean`     | Actions like share, add, create.                                                    |
| shouldShowLinkedContacts | `boolean`     | Shows similar contacts.                                                             |
| isNew                    | `boolean`     | Present the new contact controller - if false the unknown controller will be shown. |
| preventAnimation         | `boolean`     | Prevents the controller from animating in.                                          |

### ContactQuery

Used to query contacts from the user's device.

| Name        | Type          | Description                                                                                  | iOS | Android |
| ----------- | ------------- | -------------------------------------------------------------------------------------------- | --- | ------- |
| fields      | `FieldType[]` | If available the fields defined will be returned. If `nil` then all fields will be returned. | ✅  | ✅      |
| pageSize    | `number`      | The max number of contacts to return. If `nil` or `0` then all contacts will be returned.    | ✅  | ✅      |
| pageOffset  | `number`      | The number of contacts to skip before gathering contacts.                                    | ✅  | ✅      |
| id          | `string`      | Get contacts with a matching ID .                                                            | ✅  | ✅      |
| sort        | `SortType`    | Sort method used when gathering contacts.                                                    | ❌  | ✅      |
| name        | `string`      | Query contacts matching this name.                                                           | ✅  | ❌      |
| groupId     | `string`      | Get all contacts that belong to the group matching this ID.                                  | ✅  | ❌      |
| containerId | `string`      | Get all contacts that belong to the container matching this ID.                              | ✅  | ❌      |
| rawContacts | `boolean`     | Prevent unification of contacts when gathering. Default: `false`.                            | ✅  | ❌      |

### GroupQuery

> iOS Only

Used to query native contact groups.

| Name        | Type     | Description                                          |
| ----------- | -------- | ---------------------------------------------------- |
| groupName   | `string` | Query all groups matching a name.                    |
| groupId     | `string` | Query the group with a matching ID.                  |
| containerId | `string` | Query all groups that belong to a certain container. |

### ContainerQuery

> iOS Only

Used to query native contact containers.

| Name        | Type     | Description                                     |
| ----------- | -------- | ----------------------------------------------- |
| contactId   | `string` | Query all the containers that parent a contact. |
| groupId     | `string` | Query all the containers that parent a group.   |
| containerId | `string` | Query a container from it's ID.                 |

### ContactResponse

The return value for queried contact operations like `getContactsAsync`.

| Name            | Type        | Description                                                                       |
| --------------- | ----------- | --------------------------------------------------------------------------------- |
| data            | `Contact[]` | An array of contacts that match a particular query.                               |
| hasNextPage     | `boolean`   | This will be true if there are more contacts to retrieve beyond what is returned. |
| hasPreviousPage | `boolean`   | true if there are previous contacts that weren't retrieved due to `pageOffset`.   |
| ~~total~~       | `number`    | **Deprecated:** use `data.length` to get the number of contacts returned.         |

## Constants

### Fields

```js
const contactField = Contact.Fields.FirstName;
```

| Name                    | Value                        | iOS | Android |
| ----------------------- | ---------------------------- | --- | ------- |
| ID                      | `'id'`                       | ✅  | ✅      |
| Name                    | `'name'`                     | ✅  | ✅      |
| FirstName               | `'firstName'`                | ✅  | ✅      |
| MiddleName              | `'middleName'`               | ✅  | ✅      |
| LastName                | `'lastName'`                 | ✅  | ✅      |
| NamePrefix              | `'namePrefix'`               | ✅  | ✅      |
| NameSuffix              | `'nameSuffix'`               | ✅  | ✅      |
| PhoneticFirstName       | `'phoneticFirstName'`        | ✅  | ✅      |
| PhoneticMiddleName      | `'phoneticMiddleName'`       | ✅  | ✅      |
| PhoneticLastName        | `'phoneticLastName'`         | ✅  | ✅      |
| Birthday                | `'birthday'`                 | ✅  | ✅      |
| Emails                  | `'emails'`                   | ✅  | ✅      |
| PhoneNumbers            | `'phoneNumbers'`             | ✅  | ✅      |
| Addresses               | `'addresses'`                | ✅  | ✅      |
| InstantMessageAddresses | `'instantMessageAddresses'`  | ✅  | ✅      |
| UrlAddresses            | `'urlAddresses'`             | ✅  | ✅      |
| Company                 | `'company'`                  | ✅  | ✅      |
| JobTitle                | `'jobTitle'`                 | ✅  | ✅      |
| Department              | `'department'`               | ✅  | ✅      |
| ImageAvailable          | `'imageAvailable'`           | ✅  | ✅      |
| Image                   | `'image'`                    | ✅  | ✅      |
| Note                    | `'note'`                     | ✅  | ✅      |
| Dates                   | `'dates'`                    | ✅  | ✅      |
| Relationships           | `'relationships'`            | ✅  | ✅      |
| Nickname                | `'nickname'`                 | ✅  | ✅      |
| RawImage                | `'rawImage'`                 | ✅  | ✅      |
| MaidenName              | `'maidenName'`               | ✅  | ✅      |
| ContactType             | `'contactType'`              | ✅  | ✅      |
| SocialProfiles          | `'socialProfiles'`           | ✅  | ❌      |
| NonGregorianBirthday    | `'nonGregorianBirthday'`     | ✅  | ❌      |
| Thumbnail               | Deprecated: use `Image`      | ❌  | ❌      |
| PreviousLastName        | Deprecated: use `MaidenName` | ❌  | ❌      |

### FormTypes

```js
const formType = Contacts.FormTypes.New;
```

| Name    | Value       | Description                       |
| ------- | ----------- | --------------------------------- |
| New     | `'new'`     | Creating a contact                |
| Unknown | `'unknown'` | Displaying a contact with actions |
| Default | `'default'` | Information regarding a contact   |

### ContactTypes

> iOS Only

```js
const contactType = Contacts.ContactTypes.Person;
```

| Name    | Value       | Description                 |
| ------- | ----------- | --------------------------- |
| Person  | `'person'`  | Contact is a human          |
| Company | `'company'` | Contact is group or company |

### SortTypes

```js
const sortType = Contacts.SortTypes.FirstName;
```

| Name        | Value           | Description                           | iOS | Android |
| ----------- | --------------- | ------------------------------------- | --- | ------- |
| FirstName   | `'firstName'`   | Sort by first name in ascending order | ✅  | ✅      |
| LastName    | `'lastName'`    | Sort by last name in ascending order  | ✅  | ✅      |
| UserDefault | `'userDefault'` | The user default method of sorting    | ✅  | ❌      |

### ContainerTypes

> iOS Only

```js
const containerType = Contacts.ContainerTypes.CardDAV;
```

| Name       | Value          | Description                       |
| ---------- | -------------- | --------------------------------- |
| Local      | `'local'`      | A local non-iCloud container      |
| Exchange   | `'exchange'`   | In association with Email         |
| CardDAV    | `'cardDAV'`    | cardDAV protocol used for sharing |
| Unassigned | `'unassigned'` | Unknown                           |

### CalendarFormats

```js
const calendarFormat = Contacts.CalendarFormats.Coptic;
```

This format denotes the common calendar format used to specify how a date is calculated in `nonGregorianBirthday` fields.

| Constant  | value         | iOS | Android |
| --------- | ------------- | --- | ------- |
| Gregorian | `'gregorian'` | ✅  | ✅      |
| Chinese   | `'chinese'`   | ✅  | ❌      |
| Hebrew    | `'hebrew'`    | ✅  | ❌      |
| Islamic   | `'islamic'`   | ✅  | ❌      |
