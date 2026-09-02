import type { ShareOptions } from 'react-native';

import type * as Legacy from './legacy/Contacts';

export {
  CalendarFormats,
  ContactTypes,
  ContainerTypes,
  Fields,
  PermissionStatus,
  SortTypes,
} from './legacy/Contacts';

export type {
  Address,
  CalendarFormatType,
  ContactQuery,
  ContactResponse,
  ContactSort,
  ContactType,
  ContainerQuery,
  ContainerType,
  Date,
  Email,
  ExistingContact,
  FieldType,
  GroupQuery,
  Image,
  InstantMessageAddress,
  PhoneNumber,
  Relationship,
  SocialProfile,
  UrlAddress,
} from './legacy/Contacts';

function errorOnLegacyMethodUse(methodName: string): Error {
  const message = `Method ${methodName} imported from "expo-contacts" is deprecated.\nUse the new class-based API from "expo-contacts" or import the legacy API from "expo-contacts/legacy".\nSee the migration guide: https://docs.expo.dev/guides/sdk-libraries-migration/contacts/`;
  console.warn(message);
  return new Error(message);
}

/**
 * @deprecated Import this method from `expo-contacts/legacy`. This method will throw in runtime.
 */
export async function isAvailableAsync(): Promise<boolean> {
  throw errorOnLegacyMethodUse('isAvailableAsync');
}

/**
 * @deprecated Use `Contact.hasAny()` or import this method from `expo-contacts/legacy`. This method will throw in runtime.
 */
export async function hasContactsAsync(): Promise<boolean> {
  throw errorOnLegacyMethodUse('hasContactsAsync');
}

/**
 * @deprecated Import this method from `expo-contacts/legacy`. This method will throw in runtime.
 */
export async function shareContactAsync(
  contactId: string,
  message: string,
  shareOptions: ShareOptions = {}
): Promise<any> {
  throw errorOnLegacyMethodUse('shareContactAsync');
}

/**
 * @deprecated Use `Contact.getAll()` or import this method from `expo-contacts/legacy`. This method will throw in runtime.
 */
export async function getContactsAsync(
  contactQuery: Legacy.ContactQuery = {}
): Promise<Legacy.ContactResponse> {
  throw errorOnLegacyMethodUse('getContactsAsync');
}

/**
 * @deprecated Use `Contact.getAll()` or import this method from `expo-contacts/legacy`. This method will throw in runtime.
 */
export async function getPagedContactsAsync(
  contactQuery: Legacy.ContactQuery = {}
): Promise<Legacy.ContactResponse> {
  throw errorOnLegacyMethodUse('getPagedContactsAsync');
}

/**
 * @deprecated Use `new Contact(id).getDetails()` or import this method from `expo-contacts/legacy`. This method will throw in runtime.
 */
export async function getContactByIdAsync(
  id: string,
  fields?: Legacy.FieldType[]
): Promise<Legacy.ExistingContact | undefined> {
  throw errorOnLegacyMethodUse('getContactByIdAsync');
}

/**
 * @deprecated Use `Contact.create()` or import this method from `expo-contacts/legacy`. This method will throw in runtime.
 */
export async function addContactAsync(
  contact: Legacy.Contact,
  containerId?: string
): Promise<string> {
  throw errorOnLegacyMethodUse('addContactAsync');
}

/**
 * @deprecated Use `contact.update()` or `contact.patch()` or import this method from `expo-contacts/legacy`. This method will throw in runtime.
 */
export async function updateContactAsync(
  contact: { id: string } & Partial<Legacy.ExistingContact>
): Promise<string> {
  throw errorOnLegacyMethodUse('updateContactAsync');
}

/**
 * @deprecated Use `contact.delete()` or import this method from `expo-contacts/legacy`. This method will throw in runtime.
 */
export async function removeContactAsync(contactId: string): Promise<any> {
  throw errorOnLegacyMethodUse('removeContactAsync');
}

/**
 * @deprecated Import this method from `expo-contacts/legacy`. This method will throw in runtime.
 */
export async function writeContactToFileAsync(
  contactQuery: Legacy.ContactQuery = {}
): Promise<string | undefined> {
  throw errorOnLegacyMethodUse('writeContactToFileAsync');
}

/**
 * @deprecated Use `contact.editWithForm()` or `Contact.presentCreateForm()` or import this method from `expo-contacts/legacy`. This method will throw in runtime.
 */
export async function presentFormAsync(
  contactId?: string | null,
  contact?: Legacy.Contact | null,
  formOptions: Legacy.FormOptions = {}
): Promise<any> {
  throw errorOnLegacyMethodUse('presentFormAsync');
}

/**
 * @deprecated Use `container.addGroup()` or import this method from `expo-contacts/legacy`. This method will throw in runtime.
 */
export async function addExistingGroupToContainerAsync(
  groupId: string,
  containerId: string
): Promise<any> {
  throw errorOnLegacyMethodUse('addExistingGroupToContainerAsync');
}

/**
 * @deprecated Use `Group.create()` or import this method from `expo-contacts/legacy`. This method will throw in runtime.
 */
export async function createGroupAsync(name?: string, containerId?: string): Promise<string> {
  throw errorOnLegacyMethodUse('createGroupAsync');
}

/**
 * @deprecated Use `group.setName()` or import this method from `expo-contacts/legacy`. This method will throw in runtime.
 */
export async function updateGroupNameAsync(groupName: string, groupId: string): Promise<any> {
  throw errorOnLegacyMethodUse('updateGroupNameAsync');
}

/**
 * @deprecated Use `group.delete()` or import this method from `expo-contacts/legacy`. This method will throw in runtime.
 */
export async function removeGroupAsync(groupId: string): Promise<any> {
  throw errorOnLegacyMethodUse('removeGroupAsync');
}

/**
 * @deprecated Use `group.addContact()` or import this method from `expo-contacts/legacy`. This method will throw in runtime.
 */
export async function addExistingContactToGroupAsync(
  contactId: string,
  groupId: string
): Promise<any> {
  throw errorOnLegacyMethodUse('addExistingContactToGroupAsync');
}

/**
 * @deprecated Use `group.removeContact()` or import this method from `expo-contacts/legacy`. This method will throw in runtime.
 */
export async function removeContactFromGroupAsync(
  contactId: string,
  groupId: string
): Promise<any> {
  throw errorOnLegacyMethodUse('removeContactFromGroupAsync');
}

/**
 * @deprecated Use `Group.getAll()` or import this method from `expo-contacts/legacy`. This method will throw in runtime.
 */
export async function getGroupsAsync(groupQuery: Legacy.GroupQuery): Promise<Legacy.Group[]> {
  throw errorOnLegacyMethodUse('getGroupsAsync');
}

/**
 * @deprecated Use `Contact.presentPicker()` or import this method from `expo-contacts/legacy`. This method will throw in runtime.
 */
export async function presentContactPickerAsync(): Promise<Legacy.ExistingContact | null> {
  throw errorOnLegacyMethodUse('presentContactPickerAsync');
}

/**
 * @deprecated Use `Container.getDefault()` or import this method from `expo-contacts/legacy`. This method will throw in runtime.
 */
export async function getDefaultContainerIdAsync(): Promise<string> {
  throw errorOnLegacyMethodUse('getDefaultContainerIdAsync');
}

/**
 * @deprecated Use `Container.getAll()` or import this method from `expo-contacts/legacy`. This method will throw in runtime.
 */
export async function getContainersAsync(
  containerQuery: Legacy.ContainerQuery
): Promise<Legacy.Container[]> {
  throw errorOnLegacyMethodUse('getContainersAsync');
}

/**
 * @deprecated Use `Contact.presentAccessPicker()` or import this method from `expo-contacts/legacy`. This method will throw in runtime.
 */
export async function presentAccessPickerAsync(): Promise<string[]> {
  throw errorOnLegacyMethodUse('presentAccessPickerAsync');
}
