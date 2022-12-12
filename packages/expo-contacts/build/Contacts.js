import { PermissionStatus, UnavailabilityError } from 'expo-modules-core';
import { Platform, Share } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import ExpoContacts from './ExpoContacts';
export { PermissionStatus };
/**
 * Returns whether the Contacts API is enabled on the current device. This method does not check the app permissions.
 * @returns A promise that fulfills with a `boolean`, indicating whether the Contacts API is available on the current device. It always resolves to `false` on web.
 */
export async function isAvailableAsync() {
    return !!ExpoContacts.getContactsAsync;
}
export async function shareContactAsync(contactId, message, shareOptions = {}) {
    if (Platform.OS === 'ios') {
        const url = await writeContactToFileAsync({
            id: contactId,
        });
        return await Share.share({
            url,
            message,
        }, shareOptions);
    }
    else if (!ExpoContacts.shareContactAsync) {
        throw new UnavailabilityError('Contacts', 'shareContactAsync');
    }
    return await ExpoContacts.shareContactAsync(contactId, message);
}
/**
 * Return a list of contacts that fit a given criteria. You can get all of the contacts by passing no criteria.
 * @param contactQuery Object used to query contacts.
 * @return A promise that fulfills with `ContactResponse` object returned from the query.
 * @example
 * ```js
 * const { data } = await Contacts.getContactsAsync({
 *   fields: [Contacts.Fields.Emails],
 * });
 *
 * if (data.length > 0) {
 *   const contact = data[0];
 *   console.log(contact);
 * }
 * ```
 */
export async function getContactsAsync(contactQuery = {}) {
    if (!ExpoContacts.getContactsAsync) {
        throw new UnavailabilityError('Contacts', 'getContactsAsync');
    }
    return await ExpoContacts.getContactsAsync(contactQuery);
}
export async function getPagedContactsAsync(contactQuery = {}) {
    const { pageSize, ...nOptions } = contactQuery;
    if (pageSize && pageSize <= 0) {
        throw new Error('Error: Contacts.getPagedContactsAsync: `pageSize` must be greater than 0');
    }
    return await getContactsAsync({
        ...nOptions,
        pageSize,
    });
}
/**
 * Used for gathering precise data about a contact. Returns a contact matching the given `id`.
 * @param id The ID of a system contact.
 * @param fields If specified, the fields defined will be returned. When skipped, all fields will be returned.
 * @return A promise that fulfills with `Contact` object with ID matching the input ID, or `undefined` if there is no match.
 * @example
 * ```js
 * const contact = await Contacts.getContactByIdAsync('161A368D-D614-4A15-8DC6-665FDBCFAE55');
 * if (contact) {
 *   console.log(contact);
 * }
 * ```
 */
export async function getContactByIdAsync(id, fields) {
    if (!ExpoContacts.getContactsAsync) {
        throw new UnavailabilityError('Contacts', 'getContactsAsync');
    }
    if (id == null) {
        throw new Error('Error: Contacts.getContactByIdAsync: Please pass an ID as a parameter');
    }
    else {
        const results = await ExpoContacts.getContactsAsync({
            pageSize: 1,
            pageOffset: 0,
            fields,
            id,
        });
        if (results && results.data && results.data.length > 0) {
            return results.data[0];
        }
    }
    return undefined;
}
/**
 * Creates a new contact and adds it to the system.
 * > **Note**: For Android users, the Expo Go app does not have the required `WRITE_CONTACTS` permission to write to Contacts.
 * > You will need to create a [development build](/development/create-development-builds) and add permission in there manually to use this method.
 * @param contact A contact with the changes you wish to persist. The `id` parameter will not be used.
 * @param containerId @tag-ios The container that will parent the contact.
 * @return A promise that fulfills with ID of the new system contact.
 * @example
 * ```js
 * const contact = {
 *   [Contacts.Fields.FirstName]: 'Bird',
 *   [Contacts.Fields.LastName]: 'Man',
 *   [Contacts.Fields.Company]: 'Young Money',
 * };
 * const contactId = await Contacts.addContactAsync(contact);
 * ```
 */
export async function addContactAsync(contact, containerId) {
    if (!ExpoContacts.addContactAsync) {
        throw new UnavailabilityError('Contacts', 'addContactAsync');
    }
    return await ExpoContacts.addContactAsync(contact, containerId);
}
/**
 * Mutate the information of an existing contact. Due to an iOS bug, `nonGregorianBirthday` field cannot be modified.
 * > **info** On Android, you can use [`presentFormAsync`](#contactspresentformasynccontactid-contact-formoptions) to make edits to contacts.
 * @param contact A contact object including the wanted changes.
 * @return A promise that fulfills with ID of the updated system contact if mutation was successful.
 * @example
 * ```js
 * const contact = {
 *   id: '161A368D-D614-4A15-8DC6-665FDBCFAE55',
 *   [Contacts.Fields.FirstName]: 'Drake',
 *   [Contacts.Fields.Company]: 'Young Money',
 * };
 * await Contacts.updateContactAsync(contact);
 * ```
 * @platform ios
 */
export async function updateContactAsync(contact) {
    if (!ExpoContacts.updateContactAsync) {
        throw new UnavailabilityError('Contacts', 'updateContactAsync');
    }
    return await ExpoContacts.updateContactAsync(contact);
}
// @needs-audit
/**
 * Delete a contact from the system.
 * @param contactId ID of the contact you want to delete.
 * @example
 * ```js
 * await Contacts.removeContactAsync('161A368D-D614-4A15-8DC6-665FDBCFAE55');
 * ```
 * @platform ios
 */
export async function removeContactAsync(contactId) {
    if (!ExpoContacts.removeContactAsync) {
        throw new UnavailabilityError('Contacts', 'removeContactAsync');
    }
    return await ExpoContacts.removeContactAsync(contactId);
}
/**
 * Query a set of contacts and write them to a local URI that can be used for sharing.
 * @param contactQuery Used to query contact you want to write.
 * @return A promise that fulfills with shareable local URI, or `undefined` if there was no match.
 * @example
 * ```js
 * const localUri = await Contacts.writeContactToFileAsync({
 *   id: '161A368D-D614-4A15-8DC6-665FDBCFAE55',
 * });
 * Share.share({ url: localUri, message: 'Call me!' });
 * ```
 */
export async function writeContactToFileAsync(contactQuery = {}) {
    if (!ExpoContacts.writeContactToFileAsync) {
        throw new UnavailabilityError('Contacts', 'writeContactToFileAsync');
    }
    return await ExpoContacts.writeContactToFileAsync(contactQuery);
}
// @needs-audit
/**
 * Present a native form for manipulating contacts.
 * @param contactId The ID of a system contact.
 * @param contact A contact with the changes you want to persist.
 * @param formOptions Options for the native editor.
 * @example
 * ```js
 * await Contacts.presentFormAsync('161A368D-D614-4A15-8DC6-665FDBCFAE55');
 * ```
 */
export async function presentFormAsync(contactId, contact, formOptions = {}) {
    if (!ExpoContacts.presentFormAsync) {
        throw new UnavailabilityError('Contacts', 'presentFormAsync');
    }
    if (Platform.OS === 'ios') {
        const adjustedOptions = formOptions;
        if (contactId) {
            if (contact) {
                contact = undefined;
                console.log('Expo.Contacts.presentFormAsync: You should define either a `contact` or a `contactId` but not both.');
            }
            if (adjustedOptions.isNew !== undefined) {
                console.log('Expo.Contacts.presentFormAsync: `formOptions.isNew` is not supported with `contactId`');
            }
        }
        return await ExpoContacts.presentFormAsync(contactId, contact, adjustedOptions);
    }
    else {
        return await ExpoContacts.presentFormAsync(contactId, contact, formOptions);
    }
}
// iOS Only
/**
 * Add a group to a container.
 * @param groupId The group you want to target.
 * @param containerId The container you want to add membership to.
 * @example
 * ```js
 * await Contacts.addExistingGroupToContainerAsync(
 *   '161A368D-D614-4A15-8DC6-665FDBCFAE55',
 *   '665FDBCFAE55-D614-4A15-8DC6-161A368D'
 * );
 * ```
 * @platform ios
 */
export async function addExistingGroupToContainerAsync(groupId, containerId) {
    if (!ExpoContacts.addExistingGroupToContainerAsync) {
        throw new UnavailabilityError('Contacts', 'addExistingGroupToContainerAsync');
    }
    return await ExpoContacts.addExistingGroupToContainerAsync(groupId, containerId);
}
/**
 * Create a group with a name, and add it to a container. If the container is undefined, the default container will be targeted.
 * @param name Name of the new group.
 * @param containerId The container you to add membership to.
 * @return A promise that fulfills with ID of the new group.
 * @example
 * ```js
 * const groupId = await Contacts.createGroupAsync('Sailor Moon');
 * ```
 * @platform ios
 */
export async function createGroupAsync(name, containerId) {
    if (!ExpoContacts.createGroupAsync) {
        throw new UnavailabilityError('Contacts', 'createGroupAsync');
    }
    name = name || uuidv4();
    if (!containerId) {
        containerId = await getDefaultContainerIdAsync();
    }
    return await ExpoContacts.createGroupAsync(name, containerId);
}
/**
 * Change the name of an existing group.
 * @param groupName New name for an existing group.
 * @param groupId ID of the group you want to edit.
 * @example
 * ```js
 * await Contacts.updateGroupName('Expo Friends', '161A368D-D614-4A15-8DC6-665FDBCFAE55');
 * ```
 * @platform ios
 */
export async function updateGroupNameAsync(groupName, groupId) {
    if (!ExpoContacts.updateGroupNameAsync) {
        throw new UnavailabilityError('Contacts', 'updateGroupNameAsync');
    }
    return await ExpoContacts.updateGroupNameAsync(groupName, groupId);
}
// @needs-audit
/**
 * Delete a group from the device.
 * @param groupId ID of the group you want to remove.
 * @example
 * ```js
 * await Contacts.removeGroupAsync('161A368D-D614-4A15-8DC6-665FDBCFAE55');
 * ```
 * @platform ios
 */
export async function removeGroupAsync(groupId) {
    if (!ExpoContacts.removeGroupAsync) {
        throw new UnavailabilityError('Contacts', 'removeGroupAsync');
    }
    return await ExpoContacts.removeGroupAsync(groupId);
}
// @needs-audit
/**
 * Add a contact as a member to a group. A contact can be a member of multiple groups.
 * @param contactId ID of the contact you want to edit.
 * @param groupId ID for the group you want to add membership to.
 * @example
 * ```js
 * await Contacts.addExistingContactToGroupAsync(
 *   '665FDBCFAE55-D614-4A15-8DC6-161A368D',
 *   '161A368D-D614-4A15-8DC6-665FDBCFAE55'
 * );
 * ```
 * @platform ios
 */
export async function addExistingContactToGroupAsync(contactId, groupId) {
    if (!ExpoContacts.addExistingContactToGroupAsync) {
        throw new UnavailabilityError('Contacts', 'addExistingContactToGroupAsync');
    }
    return await ExpoContacts.addExistingContactToGroupAsync(contactId, groupId);
}
// @needs-audit
/**
 * Remove a contact's membership from a given group. This will not delete the contact.
 * @param contactId ID of the contact you want to remove.
 * @param groupId ID for the group you want to remove membership of.
 * @example
 * ```js
 * await Contacts.removeContactFromGroupAsync(
 *   '665FDBCFAE55-D614-4A15-8DC6-161A368D',
 *   '161A368D-D614-4A15-8DC6-665FDBCFAE55'
 * );
 * ```
 * @platform ios
 */
export async function removeContactFromGroupAsync(contactId, groupId) {
    if (!ExpoContacts.removeContactFromGroupAsync) {
        throw new UnavailabilityError('Contacts', 'removeContactFromGroupAsync');
    }
    return await ExpoContacts.removeContactFromGroupAsync(contactId, groupId);
}
// @needs-audit
/**
 * Query and return a list of system groups.
 * @param groupQuery Information regarding which groups you want to get.
 * @example
 * ```js
 * const groups = await Contacts.getGroupsAsync({ groupName: 'sailor moon' });
 * const allGroups = await Contacts.getGroupsAsync({});
 * ```
 * @return A promise that fulfills with array of groups that fit the query.
 * @platform ios
 */
export async function getGroupsAsync(groupQuery) {
    if (!ExpoContacts.getGroupsAsync) {
        throw new UnavailabilityError('Contacts', 'getGroupsAsync');
    }
    return await ExpoContacts.getGroupsAsync(groupQuery);
}
/**
 * Get the default container's ID.
 * @return A promise that fulfills with default container ID.
 * @example
 * ```js
 * const containerId = await Contacts.getDefaultContainerIdAsync();
 * ```
 * @platform ios
 */
export async function getDefaultContainerIdAsync() {
    if (!ExpoContacts.getDefaultContainerIdentifierAsync) {
        throw new UnavailabilityError('Contacts', 'getDefaultContainerIdentifierAsync');
    }
    return await ExpoContacts.getDefaultContainerIdentifierAsync();
}
/**
 * Query a list of system containers.
 * @param containerQuery Information used to gather containers.
 * @return A promise that fulfills with array of containers that fit the query.
 * @example
 * ```js
 * const allContainers = await Contacts.getContainersAsync({
 *   contactId: '665FDBCFAE55-D614-4A15-8DC6-161A368D',
 * });
 * ```
 * @platform ios
 */
export async function getContainersAsync(containerQuery) {
    if (!ExpoContacts.getContainersAsync) {
        throw new UnavailabilityError('Contacts', 'getContainersAsync');
    }
    return await ExpoContacts.getContainersAsync(containerQuery);
}
/**
 * Checks user's permissions for accessing contacts data.
 * @return A promise that resolves to a [PermissionResponse](#permissionresponse) object.
 */
export async function getPermissionsAsync() {
    if (!ExpoContacts.getPermissionsAsync) {
        throw new UnavailabilityError('Contacts', 'getPermissionsAsync');
    }
    return await ExpoContacts.getPermissionsAsync();
}
/**
 * Asks the user to grant permissions for accessing contacts data.
 * @return A promise that resolves to a [PermissionResponse](#permissionresponse) object.
 */
export async function requestPermissionsAsync() {
    if (!ExpoContacts.requestPermissionsAsync) {
        throw new UnavailabilityError('Contacts', 'requestPermissionsAsync');
    }
    return await ExpoContacts.requestPermissionsAsync();
}
/**
 * Possible fields to retrieve for a contact.
 */
export var Fields;
(function (Fields) {
    Fields["ID"] = "id";
    Fields["ContactType"] = "contactType";
    Fields["Name"] = "name";
    Fields["FirstName"] = "firstName";
    Fields["MiddleName"] = "middleName";
    Fields["LastName"] = "lastName";
    Fields["MaidenName"] = "maidenName";
    Fields["NamePrefix"] = "namePrefix";
    Fields["NameSuffix"] = "nameSuffix";
    Fields["Nickname"] = "nickname";
    Fields["PhoneticFirstName"] = "phoneticFirstName";
    Fields["PhoneticMiddleName"] = "phoneticMiddleName";
    Fields["PhoneticLastName"] = "phoneticLastName";
    Fields["Birthday"] = "birthday";
    /**
     * @platform ios
     */
    Fields["NonGregorianBirthday"] = "nonGregorianBirthday";
    Fields["Emails"] = "emails";
    Fields["PhoneNumbers"] = "phoneNumbers";
    Fields["Addresses"] = "addresses";
    /**
     * @platform ios
     */
    Fields["SocialProfiles"] = "socialProfiles";
    Fields["InstantMessageAddresses"] = "instantMessageAddresses";
    Fields["UrlAddresses"] = "urlAddresses";
    Fields["Company"] = "company";
    Fields["JobTitle"] = "jobTitle";
    Fields["Department"] = "department";
    Fields["ImageAvailable"] = "imageAvailable";
    Fields["Image"] = "image";
    Fields["RawImage"] = "rawImage";
    Fields["ExtraNames"] = "extraNames";
    Fields["Note"] = "note";
    Fields["Dates"] = "dates";
    Fields["Relationships"] = "relationships";
})(Fields || (Fields = {}));
/**
 * This format denotes the common calendar format used to specify how a date is calculated in `nonGregorianBirthday` fields.
 */
export var CalendarFormats;
(function (CalendarFormats) {
    CalendarFormats["Gregorian"] = "gregorian";
    /**
     * @platform ios
     */
    CalendarFormats["Buddhist"] = "buddhist";
    /**
     * @platform ios
     */
    CalendarFormats["Chinese"] = "chinese";
    /**
     * @platform ios
     */
    CalendarFormats["Coptic"] = "coptic";
    /**
     * @platform ios
     */
    CalendarFormats["EthiopicAmeteMihret"] = "ethiopicAmeteMihret";
    /**
     * @platform ios
     */
    CalendarFormats["EthiopicAmeteAlem"] = "ethiopicAmeteAlem";
    /**
     * @platform ios
     */
    CalendarFormats["Hebrew"] = "hebrew";
    /**
     * @platform ios
     */
    CalendarFormats["ISO8601"] = "iso8601";
    /**
     * @platform ios
     */
    CalendarFormats["Indian"] = "indian";
    /**
     * @platform ios
     */
    CalendarFormats["Islamic"] = "islamic";
    /**
     * @platform ios
     */
    CalendarFormats["IslamicCivil"] = "islamicCivil";
    /**
     * @platform ios
     */
    CalendarFormats["Japanese"] = "japanese";
    /**
     * @platform ios
     */
    CalendarFormats["Persian"] = "persian";
    /**
     * @platform ios
     */
    CalendarFormats["RepublicOfChina"] = "republicOfChina";
    /**
     * @platform ios
     */
    CalendarFormats["IslamicTabular"] = "islamicTabular";
    /**
     * @platform ios
     */
    CalendarFormats["IslamicUmmAlQura"] = "islamicUmmAlQura";
})(CalendarFormats || (CalendarFormats = {}));
/**
 * @platform ios
 */
export var ContainerTypes;
(function (ContainerTypes) {
    /**
     * A local non-iCloud container.
     */
    ContainerTypes["Local"] = "local";
    /**
     * In association with email server.
     */
    ContainerTypes["Exchange"] = "exchange";
    /**
     * With cardDAV protocol used for sharing.
     */
    ContainerTypes["CardDAV"] = "cardDAV";
    /**
     * Unknown container.
     */
    ContainerTypes["Unassigned"] = "unassigned";
})(ContainerTypes || (ContainerTypes = {}));
export var SortTypes;
(function (SortTypes) {
    /**
     * The user default method of sorting.
     * @platform android
     */
    SortTypes["UserDefault"] = "userDefault";
    /**
     * Sort by first name in ascending order.
     */
    SortTypes["FirstName"] = "firstName";
    /**
     * Sort by last name in ascending order.
     */
    SortTypes["LastName"] = "lastName";
    /**
     * No sorting should be applied.
     */
    SortTypes["None"] = "none";
})(SortTypes || (SortTypes = {}));
export var ContactTypes;
(function (ContactTypes) {
    /**
     * Contact is a human.
     */
    ContactTypes["Person"] = "person";
    /**
     * Contact is group or company.
     */
    ContactTypes["Company"] = "company";
})(ContactTypes || (ContactTypes = {}));
//# sourceMappingURL=Contacts.js.map