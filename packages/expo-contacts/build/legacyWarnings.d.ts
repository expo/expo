import type { ShareOptions } from 'react-native';
import type * as Legacy from './legacy/Contacts';
export { CalendarFormats, ContactTypes, ContainerTypes, Fields, PermissionStatus, SortTypes, } from './legacy/Contacts';
export type { Address, CalendarFormatType, ContactQuery, ContactResponse, ContactSort, ContactType, ContainerQuery, ContainerType, Date, Email, ExistingContact, FieldType, GroupQuery, Image, InstantMessageAddress, PhoneNumber, Relationship, SocialProfile, UrlAddress, } from './legacy/Contacts';
/**
 * @deprecated Import this method from `expo-contacts/legacy`. This method will throw in runtime.
 */
export declare function isAvailableAsync(): Promise<boolean>;
/**
 * @deprecated Use `Contact.hasAny()` or import this method from `expo-contacts/legacy`. This method will throw in runtime.
 */
export declare function hasContactsAsync(): Promise<boolean>;
/**
 * @deprecated Import this method from `expo-contacts/legacy`. This method will throw in runtime.
 */
export declare function shareContactAsync(contactId: string, message: string, shareOptions?: ShareOptions): Promise<any>;
/**
 * @deprecated Use `Contact.getAll()` or import this method from `expo-contacts/legacy`. This method will throw in runtime.
 */
export declare function getContactsAsync(contactQuery?: Legacy.ContactQuery): Promise<Legacy.ContactResponse>;
/**
 * @deprecated Use `Contact.getAll()` or import this method from `expo-contacts/legacy`. This method will throw in runtime.
 */
export declare function getPagedContactsAsync(contactQuery?: Legacy.ContactQuery): Promise<Legacy.ContactResponse>;
/**
 * @deprecated Use `new Contact(id).getDetails()` or import this method from `expo-contacts/legacy`. This method will throw in runtime.
 */
export declare function getContactByIdAsync(id: string, fields?: Legacy.FieldType[]): Promise<Legacy.ExistingContact | undefined>;
/**
 * @deprecated Use `Contact.create()` or import this method from `expo-contacts/legacy`. This method will throw in runtime.
 */
export declare function addContactAsync(contact: Legacy.Contact, containerId?: string): Promise<string>;
/**
 * @deprecated Use `contact.update()` or `contact.patch()` or import this method from `expo-contacts/legacy`. This method will throw in runtime.
 */
export declare function updateContactAsync(contact: {
    id: string;
} & Partial<Legacy.ExistingContact>): Promise<string>;
/**
 * @deprecated Use `contact.delete()` or import this method from `expo-contacts/legacy`. This method will throw in runtime.
 */
export declare function removeContactAsync(contactId: string): Promise<any>;
/**
 * @deprecated Import this method from `expo-contacts/legacy`. This method will throw in runtime.
 */
export declare function writeContactToFileAsync(contactQuery?: Legacy.ContactQuery): Promise<string | undefined>;
/**
 * @deprecated Use `contact.editWithForm()` or `Contact.presentCreateForm()` or import this method from `expo-contacts/legacy`. This method will throw in runtime.
 */
export declare function presentFormAsync(contactId?: string | null, contact?: Legacy.Contact | null, formOptions?: Legacy.FormOptions): Promise<any>;
/**
 * @deprecated Use `container.addGroup()` or import this method from `expo-contacts/legacy`. This method will throw in runtime.
 */
export declare function addExistingGroupToContainerAsync(groupId: string, containerId: string): Promise<any>;
/**
 * @deprecated Use `Group.create()` or import this method from `expo-contacts/legacy`. This method will throw in runtime.
 */
export declare function createGroupAsync(name?: string, containerId?: string): Promise<string>;
/**
 * @deprecated Use `group.setName()` or import this method from `expo-contacts/legacy`. This method will throw in runtime.
 */
export declare function updateGroupNameAsync(groupName: string, groupId: string): Promise<any>;
/**
 * @deprecated Use `group.delete()` or import this method from `expo-contacts/legacy`. This method will throw in runtime.
 */
export declare function removeGroupAsync(groupId: string): Promise<any>;
/**
 * @deprecated Use `group.addContact()` or import this method from `expo-contacts/legacy`. This method will throw in runtime.
 */
export declare function addExistingContactToGroupAsync(contactId: string, groupId: string): Promise<any>;
/**
 * @deprecated Use `group.removeContact()` or import this method from `expo-contacts/legacy`. This method will throw in runtime.
 */
export declare function removeContactFromGroupAsync(contactId: string, groupId: string): Promise<any>;
/**
 * @deprecated Use `Group.getAll()` or import this method from `expo-contacts/legacy`. This method will throw in runtime.
 */
export declare function getGroupsAsync(groupQuery: Legacy.GroupQuery): Promise<Legacy.Group[]>;
/**
 * @deprecated Use `Contact.presentPicker()` or import this method from `expo-contacts/legacy`. This method will throw in runtime.
 */
export declare function presentContactPickerAsync(): Promise<Legacy.ExistingContact | null>;
/**
 * @deprecated Use `Container.getDefault()` or import this method from `expo-contacts/legacy`. This method will throw in runtime.
 */
export declare function getDefaultContainerIdAsync(): Promise<string>;
/**
 * @deprecated Use `Container.getAll()` or import this method from `expo-contacts/legacy`. This method will throw in runtime.
 */
export declare function getContainersAsync(containerQuery: Legacy.ContainerQuery): Promise<Legacy.Container[]>;
/**
 * @deprecated Use `Contact.presentAccessPicker()` or import this method from `expo-contacts/legacy`. This method will throw in runtime.
 */
export declare function presentAccessPickerAsync(): Promise<string[]>;
//# sourceMappingURL=legacyWarnings.d.ts.map