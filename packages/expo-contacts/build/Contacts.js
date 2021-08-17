import { PermissionStatus, UnavailabilityError } from 'expo-modules-core';
import { Platform, Share } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import ExpoContacts from './ExpoContacts';
export { PermissionStatus };
/**
 * Returns whether the Contacts API is enabled on the current device. This does not check the app permissions.
 *
 * @returns Async `boolean`, indicating whether the Contacts API is available on the current device. Currently this resolves to `true` on iOS and Android only.
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
export async function addContactAsync(contact, containerId) {
    if (!ExpoContacts.addContactAsync) {
        throw new UnavailabilityError('Contacts', 'addContactAsync');
    }
    return await ExpoContacts.addContactAsync(contact, containerId);
}
export async function updateContactAsync(contact) {
    if (!ExpoContacts.updateContactAsync) {
        throw new UnavailabilityError('Contacts', 'updateContactAsync');
    }
    return await ExpoContacts.updateContactAsync(contact);
}
export async function removeContactAsync(contactId) {
    if (!ExpoContacts.removeContactAsync) {
        throw new UnavailabilityError('Contacts', 'removeContactAsync');
    }
    return await ExpoContacts.removeContactAsync(contactId);
}
export async function writeContactToFileAsync(contactQuery = {}) {
    if (!ExpoContacts.writeContactToFileAsync) {
        throw new UnavailabilityError('Contacts', 'writeContactToFileAsync');
    }
    return await ExpoContacts.writeContactToFileAsync(contactQuery);
}
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
                console.log('Expo.Contacts.presentFormAsync: formOptions.isNew is not supported with `contactId`');
            }
        }
        return await ExpoContacts.presentFormAsync(contactId, contact, adjustedOptions);
    }
    else {
        return await ExpoContacts.presentFormAsync(contactId, contact, formOptions);
    }
}
// iOS Only
export async function addExistingGroupToContainerAsync(groupId, containerId) {
    if (!ExpoContacts.addExistingGroupToContainerAsync) {
        throw new UnavailabilityError('Contacts', 'addExistingGroupToContainerAsync');
    }
    return await ExpoContacts.addExistingGroupToContainerAsync(groupId, containerId);
}
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
export async function updateGroupNameAsync(groupName, groupId) {
    if (!ExpoContacts.updateGroupNameAsync) {
        throw new UnavailabilityError('Contacts', 'updateGroupNameAsync');
    }
    return await ExpoContacts.updateGroupNameAsync(groupName, groupId);
}
export async function removeGroupAsync(groupId) {
    if (!ExpoContacts.removeGroupAsync) {
        throw new UnavailabilityError('Contacts', 'removeGroupAsync');
    }
    return await ExpoContacts.removeGroupAsync(groupId);
}
export async function addExistingContactToGroupAsync(contactId, groupId) {
    if (!ExpoContacts.addExistingContactToGroupAsync) {
        throw new UnavailabilityError('Contacts', 'addExistingContactToGroupAsync');
    }
    return await ExpoContacts.addExistingContactToGroupAsync(contactId, groupId);
}
export async function removeContactFromGroupAsync(contactId, groupId) {
    if (!ExpoContacts.removeContactFromGroupAsync) {
        throw new UnavailabilityError('Contacts', 'removeContactFromGroupAsync');
    }
    return await ExpoContacts.removeContactFromGroupAsync(contactId, groupId);
}
export async function getGroupsAsync(groupQuery) {
    if (!ExpoContacts.getGroupsAsync) {
        throw new UnavailabilityError('Contacts', 'getGroupsAsync');
    }
    return await ExpoContacts.getGroupsAsync(groupQuery);
}
export async function getDefaultContainerIdAsync() {
    if (!ExpoContacts.getDefaultContainerIdentifierAsync) {
        throw new UnavailabilityError('Contacts', 'getDefaultContainerIdentifierAsync');
    }
    return await ExpoContacts.getDefaultContainerIdentifierAsync();
}
export async function getContainersAsync(containerQuery) {
    if (!ExpoContacts.getContainersAsync) {
        throw new UnavailabilityError('Contacts', 'getContainersAsync');
    }
    return await ExpoContacts.getContainersAsync(containerQuery);
}
export async function getPermissionsAsync() {
    if (!ExpoContacts.getPermissionsAsync) {
        throw new UnavailabilityError('Contacts', 'getPermissionsAsync');
    }
    return await ExpoContacts.getPermissionsAsync();
}
export async function requestPermissionsAsync() {
    if (!ExpoContacts.requestPermissionsAsync) {
        throw new UnavailabilityError('Contacts', 'requestPermissionsAsync');
    }
    return await ExpoContacts.requestPermissionsAsync();
}
// Legacy
export const PHONE_NUMBERS = 'phoneNumbers';
export const EMAILS = 'emails';
export const ADDRESSES = 'addresses';
export const IMAGE = 'image';
export const RAW_IMAGE = 'rawImage';
export const NOTE = 'note';
export const BIRTHDAY = 'birthday';
export const NON_GREGORIAN_BIRTHDAY = 'nonGregorianBirthday';
export const NAME_PREFIX = 'namePrefix';
export const NAME_SUFFIX = 'nameSuffix';
export const PHONETIC_FIRST_NAME = 'phoneticFirstName';
export const PHONETIC_MIDDLE_NAME = 'phoneticMiddleName';
export const PHONETIC_LAST_NAME = 'phoneticLastName';
export const SOCIAL_PROFILES = 'socialProfiles';
export const IM_ADDRESSES = 'instantMessageAddresses';
export const URLS = 'urlAddresses';
export const DATES = 'dates';
export const RAW_DATES = 'rawDates';
export const RELATIONSHIPS = 'relationships';
export const Fields = {
    ID: 'id',
    ContactType: 'contactType',
    Name: 'name',
    FirstName: 'firstName',
    MiddleName: 'middleName',
    LastName: 'lastName',
    MaidenName: 'maidenName',
    NamePrefix: 'namePrefix',
    NameSuffix: 'nameSuffix',
    Nickname: 'nickname',
    PhoneticFirstName: 'phoneticFirstName',
    PhoneticMiddleName: 'phoneticMiddleName',
    PhoneticLastName: 'phoneticLastName',
    Birthday: 'birthday',
    NonGregorianBirthday: 'nonGregorianBirthday',
    Emails: 'emails',
    PhoneNumbers: 'phoneNumbers',
    Addresses: 'addresses',
    SocialProfiles: 'socialProfiles',
    InstantMessageAddresses: 'instantMessageAddresses',
    UrlAddresses: 'urlAddresses',
    Company: 'company',
    JobTitle: 'jobTitle',
    Department: 'department',
    ImageAvailable: 'imageAvailable',
    Image: 'image',
    RawImage: 'rawImage',
    ExtraNames: 'extraNames',
    Note: 'note',
    Dates: 'dates',
    Relationships: 'relationships',
};
export const CalendarFormats = {
    Gregorian: 'gregorian',
    Buddhist: 'buddhist',
    Chinese: 'chinese',
    Coptic: 'coptic',
    EthiopicAmeteMihret: 'ethiopicAmeteMihret',
    EthiopicAmeteAlem: 'ethiopicAmeteAlem',
    Hebrew: 'hebrew',
    ISO8601: 'iso8601',
    Indian: 'indian',
    Islamic: 'islamic',
    IslamicCivil: 'islamicCivil',
    Japanese: 'japanese',
    Persian: 'persian',
    RepublicOfChina: 'republicOfChina',
    IslamicTabular: 'islamicTabular',
    IslamicUmmAlQura: 'islamicUmmAlQura',
};
export const ContainerTypes = {
    Local: 'local',
    Exchange: 'exchange',
    CardDAV: 'cardDAV',
    Unassigned: 'unassigned',
};
export const SortTypes = {
    UserDefault: 'userDefault',
    FirstName: 'firstName',
    LastName: 'lastName',
    None: 'none',
};
export const ContactTypes = {
    Person: 'person',
    Company: 'company',
};
//# sourceMappingURL=Contacts.js.map