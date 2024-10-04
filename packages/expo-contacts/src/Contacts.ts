import { PermissionResponse, PermissionStatus, UnavailabilityError } from 'expo-modules-core';
import { Platform, Share } from 'react-native';
import { v4 as uuidv4 } from 'uuid';

import ExpoContacts from './ExpoContacts';

export type CalendarFormatType = CalendarFormats | `${CalendarFormats}`;

export type ContainerType = ContainerTypes | `${ContainerTypes}`;

export type ContactType = ContactTypes | `${ContactTypes}`;

export type FieldType = Fields | `${Fields}`;

export type Date = {
  /**
   * Day.
   */
  day?: number;
  /**
   * Month - adjusted for JavaScript `Date` which starts at `0`.
   */
  month?: number;
  /**
   * Year.
   */
  year?: number;
  /**
   * Unique ID.
   */
  id: string;
  /**
   * Localized display name.
   */
  label: string;
  /**
   * Format for the input date.
   */
  format?: CalendarFormatType;
};

export type Relationship = {
  /**
   * Localized display name.
   */
  label: string;
  /**
   * Name of related contact.
   */
  name?: string;
  /**
   * Unique ID.
   */
  id: string;
};

export type Email = {
  /**
   * Email address.
   */
  email?: string;
  /**
   * Flag signifying if it is a primary email address.
   */
  isPrimary?: boolean;
  /**
   * Localized display name.
   */
  label: string;
  /**
   * Unique ID.
   */
  id: string;
};

export type PhoneNumber = {
  /**
   * Phone number.
   */
  number?: string;
  /**
   * Flag signifying if it is a primary phone number.
   */
  isPrimary?: boolean;
  /**
   * Phone number without format.
   * @example `8674305`
   */
  digits?: string;
  /**
   * Country code.
   * @example `+1`
   */
  countryCode?: string;
  /**
   * Localized display name.
   */
  label: string;
  /**
   * Unique ID.
   */
  id: string;
};

export type Address = {
  /**
   * Street name.
   */
  street?: string;
  /**
   * City name.
   */
  city?: string;
  /**
   * Country name
   */
  country?: string;
  /**
   * Region or state name.
   */
  region?: string;
  /**
   * Neighborhood name.
   */
  neighborhood?: string;
  /**
   * Local post code.
   */
  postalCode?: string;
  /**
   * P.O. Box.
   */
  poBox?: string;
  /**
   * [Standard country code](https://www.iso.org/iso-3166-country-codes.html).
   */
  isoCountryCode?: string;
  /**
   * Localized display name.
   */
  label: string;
  /**
   * Unique ID.
   */
  id: string;
};

/**
 * @platform ios
 */
export type SocialProfile = {
  /**
   * Name of social app.
   */
  service?: string;
  /**
   * Localized profile name.
   */
  localizedProfile?: string;
  /**
   * Web URL.
   */
  url?: string;
  /**
   * Username in social app.
   */
  username?: string;
  /**
   * Username ID in social app.
   */
  userId?: string;
  /**
   * Localized display name.
   */
  label: string;
  /**
   * Unique ID.
   */
  id: string;
};

export type InstantMessageAddress = {
  /**
   * Name of instant messaging app.
   */
  service?: string;
  /**
   * Username in IM app.
   */
  username?: string;
  /**
   * Localized name of app.
   */
  localizedService?: string;
  /**
   * Localized display name.
   */
  label: string;
  /**
   * Unique ID.
   */
  id: string;
};

export type UrlAddress = {
  /**
   * Localized display name.
   */
  label: string;
  /**
   * Web URL.
   */
  url?: string;
  /**
   * Unique ID.
   */
  id: string;
};

// @needs-audit
/**
 * Information regarding thumbnail images.
 * > On Android you can get dimensions using [`Image.getSize`](https://reactnative.dev/docs/image#getsize) method.
 */
export type Image = {
  uri?: string;
  /**
   * Image width.
   * @platform ios
   */
  width?: number;
  /**
   * Image height
   * @platform ios
   */
  height?: number;
  /**
   * Image as Base64 string.
   */
  base64?: string;
};

/**
 * A set of fields that define information about a single contact entity.
 */
export type Contact = {
  /**
   * Immutable identifier used for querying and indexing.
   */
  id: string;
  /**
   * Denoting a person or company.
   */
  contactType: ContactType;
  /**
   * Full name with proper format.
   */
  name: string;
  /**
   * Given name.
   */
  firstName?: string;
  /**
   * Middle name
   */
  middleName?: string;
  /**
   * Last name.
   */
  lastName?: string;
  /**
   * Maiden name.
   */
  maidenName?: string;
  /**
   * Dr. Mr. Mrs. ect…
   */
  namePrefix?: string;
  /**
   * Jr. Sr. ect…
   */
  nameSuffix?: string;
  /**
   * An alias to the proper name.
   */
  nickname?: string;
  /**
   * Pronunciation of the first name.
   */
  phoneticFirstName?: string;
  /**
   * Pronunciation of the middle name.
   */
  phoneticMiddleName?: string;
  /**
   * Pronunciation of the last name.
   */
  phoneticLastName?: string;
  /**
   * Organization the entity belongs to.
   */
  company?: string;
  /**
   * Job description.
   */
  jobTitle?: string;
  /**
   * Job department.
   */
  department?: string;
  /**
   * Additional information.
   * > On iOS 13+, the `note` field [requires your app to request additional entitlements](https://developer.apple.com/documentation/bundleresources/entitlements/com_apple_developer_contacts_notes).
   * > The Expo Go app does not contain those entitlements, so in order to test this feature you will need to [request the entitlement from Apple](https://developer.apple.com/contact/request/contact-note-field),
   * > set the [`ios.accessesContactNotes`](./config/app.mdx#accessescontactnotes) field in app.json to `true`, and [create your development build](/development/create-development-builds).
   */
  note?: string;
  /**
   * Used for efficient retrieval of images.
   */
  imageAvailable?: boolean;
  /**
   * Thumbnail image. On iOS it size is set to 320×320px, on Android it may vary.
   */
  image?: Image;
  /**
   * Raw image without cropping, usually large.
   */
  rawImage?: Image;
  /**
   * Birthday information in Gregorian format.
   */
  birthday?: Date;
  /**
   * A labeled list of other relevant user dates in Gregorian format.
   */
  dates?: Date[];
  /**
   * Names of other relevant user connections.
   */
  relationships?: Relationship[];
  /**
   * Email addresses.
   */
  emails?: Email[];
  /**
   * Phone numbers.
   */
  phoneNumbers?: PhoneNumber[];
  /**
   * Locations.
   */
  addresses?: Address[];
  /**
   * Instant messaging connections.
   */
  instantMessageAddresses?: InstantMessageAddress[];
  /**
   * Associated web URLs.
   */
  urlAddresses?: UrlAddress[];
  /**
   * Birthday that doesn't conform to the Gregorian calendar format, interpreted based on the [calendar `format`](#date) setting.
   * @platform ios
   */
  nonGregorianBirthday?: Date;
  /**
   * Social networks.
   * @platform ios
   */
  socialProfiles?: SocialProfile[];
};

/**
 * The return value for queried contact operations like `getContactsAsync`.
 */
export type ContactResponse = {
  /**
   * An array of contacts that match a particular query.
   */
  data: Contact[];
  /**
   * This will be `true` if there are more contacts to retrieve beyond what is returned.
   */
  hasNextPage: boolean;
  /**
   * This will be `true if there are previous contacts that weren't retrieved due to `pageOffset` limit.
   */
  hasPreviousPage: boolean;
};

export type ContactSort = `${SortTypes}`;

/**
 * Used to query contacts from the user's device.
 */
export type ContactQuery = {
  /**
   * The max number of contacts to return. If skipped or set to `0` all contacts will be returned.
   */
  pageSize?: number;
  /**
   * The number of contacts to skip before gathering contacts.
   */
  pageOffset?: number;
  /**
   * If specified, the defined fields will be returned. If skipped, all fields will be returned.
   */
  fields?: FieldType[];
  /**
   * Sort method used when gathering contacts.
   */
  sort?: ContactSort;
  /**
   * Get all contacts whose name contains the provided string (not case-sensitive).
   */
  name?: string;
  /**
   * Get contacts with a matching ID or array of IDs.
   */
  id?: string | string[];
  /**
   * Get all contacts that belong to the group matching this ID.
   * @platform ios
   */
  groupId?: string;
  /**
   * Get all contacts that belong to the container matching this ID.
   * @platform ios
   */
  containerId?: string;
  /**
   * Prevent unification of contacts when gathering.
   * @default false
   * @platform ios
   */
  rawContacts?: boolean;
};

/**
 * Denotes the functionality of a native contact form.
 */
export type FormOptions = {
  /**
   * The properties that will be displayed. On iOS those properties does nothing while in editing mode.
   */
  displayedPropertyKeys?: FieldType[];
  /**
   * Controller title.
   */
  message?: string;
  /**
   * Used if contact doesn't have a name defined.
   */
  alternateName?: string;
  /**
   * Allows for contact mutation.
   */
  allowsEditing?: boolean;
  /**
   * Actions like share, add, create.
   */
  allowsActions?: boolean;
  /**
   * Show or hide the similar contacts.
   */
  shouldShowLinkedContacts?: boolean;
  /**
   * Present the new contact controller. If set to `false` the unknown controller will be shown.
   */
  isNew?: boolean;
  /**
   * The name of the left bar button.
   */
  cancelButtonTitle?: string;
  /**
   * Prevents the controller from animating in.
   */
  preventAnimation?: boolean;
  /**
   * The parent group for a new contact.
   */
  groupId?: string;
};

/**
 * Used to query native contact groups.
 * @platform ios
 */
export type GroupQuery = {
  /**
   * Query the group with a matching ID.
   */
  groupId?: string;
  /**
   * Query all groups matching a name.
   */
  groupName?: string;
  /**
   * Query all groups that belong to a certain container.
   */
  containerId?: string;
};

/**
 * A parent to contacts. A contact can belong to multiple groups. Here are some query operations you can perform:
 * - Child Contacts: `getContactsAsync({ groupId })`
 * - Groups From Container: `getGroupsAsync({ containerId })`
 * - Groups Named: `getContainersAsync({ groupName })`
 * @platform ios
 */
export type Group = {
  /**
   * Immutable id representing the group.
   */
  name?: string;
  /**
   * The editable name of a group.
   */
  id?: string;
};

/**
 * Used to query native contact containers.
 * @platform ios
 */
export type ContainerQuery = {
  /**
   * Query all the containers that parent a contact.
   */
  contactId?: string;
  /**
   * Query all the containers that parent a group.
   */
  groupId?: string;
  /**
   * Query all the containers that matches ID or an array od IDs.
   */
  containerId?: string | string[];
};

export type Container = {
  name: string;
  id: string;
  type: ContainerType;
};

export { PermissionStatus, PermissionResponse };

/**
 * Returns whether the Contacts API is enabled on the current device. This method does not check the app permissions.
 * @returns A promise that fulfills with a `boolean`, indicating whether the Contacts API is available on the current device. It always resolves to `false` on web.
 */
export async function isAvailableAsync(): Promise<boolean> {
  return !!ExpoContacts.getContactsAsync;
}

export async function shareContactAsync(
  contactId: string,
  message: string,
  shareOptions: object = {}
): Promise<any> {
  if (Platform.OS === 'ios') {
    const url = await writeContactToFileAsync({
      id: contactId,
    });
    return await Share.share(
      {
        url,
        message,
      },
      shareOptions
    );
  } else if (!ExpoContacts.shareContactAsync) {
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
export async function getContactsAsync(contactQuery: ContactQuery = {}): Promise<ContactResponse> {
  if (!ExpoContacts.getContactsAsync) {
    throw new UnavailabilityError('Contacts', 'getContactsAsync');
  }
  return await ExpoContacts.getContactsAsync(contactQuery);
}

export async function getPagedContactsAsync(
  contactQuery: ContactQuery = {}
): Promise<ContactResponse> {
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
export async function getContactByIdAsync(
  id: string,
  fields?: FieldType[]
): Promise<Contact | undefined> {
  if (!ExpoContacts.getContactsAsync) {
    throw new UnavailabilityError('Contacts', 'getContactsAsync');
  }

  if (id == null) {
    throw new Error('Error: Contacts.getContactByIdAsync: Please pass an ID as a parameter');
  } else {
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
export async function addContactAsync(contact: Contact, containerId?: string): Promise<string> {
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
export async function updateContactAsync(contact: Contact): Promise<string> {
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
export async function removeContactAsync(contactId: string): Promise<any> {
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
export async function writeContactToFileAsync(
  contactQuery: ContactQuery = {}
): Promise<string | undefined> {
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
export async function presentFormAsync(
  contactId?: string | null,
  contact?: Contact | null,
  formOptions: FormOptions = {}
): Promise<any> {
  if (!ExpoContacts.presentFormAsync) {
    throw new UnavailabilityError('Contacts', 'presentFormAsync');
  }
  if (Platform.OS === 'ios') {
    const adjustedOptions = formOptions;

    if (contactId) {
      if (contact) {
        contact = undefined;
        console.log(
          'Expo.Contacts.presentFormAsync: You should define either a `contact` or a `contactId` but not both.'
        );
      }
      if (adjustedOptions.isNew !== undefined) {
        console.log(
          'Expo.Contacts.presentFormAsync: `formOptions.isNew` is not supported with `contactId`'
        );
      }
    }
    return await ExpoContacts.presentFormAsync(contactId, contact, adjustedOptions);
  } else {
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
export async function addExistingGroupToContainerAsync(
  groupId: string,
  containerId: string
): Promise<any> {
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
export async function createGroupAsync(name?: string, containerId?: string): Promise<string> {
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
export async function updateGroupNameAsync(groupName: string, groupId: string): Promise<any> {
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
export async function removeGroupAsync(groupId: string): Promise<any> {
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
export async function addExistingContactToGroupAsync(
  contactId: string,
  groupId: string
): Promise<any> {
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
export async function removeContactFromGroupAsync(
  contactId: string,
  groupId: string
): Promise<any> {
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
export async function getGroupsAsync(groupQuery: GroupQuery): Promise<Group[]> {
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
export async function getDefaultContainerIdAsync(): Promise<string> {
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
export async function getContainersAsync(containerQuery: ContainerQuery): Promise<Container[]> {
  if (!ExpoContacts.getContainersAsync) {
    throw new UnavailabilityError('Contacts', 'getContainersAsync');
  }

  return await ExpoContacts.getContainersAsync(containerQuery);
}

/**
 * Checks user's permissions for accessing contacts data.
 * @return A promise that resolves to a [PermissionResponse](#permissionresponse) object.
 */
export async function getPermissionsAsync(): Promise<PermissionResponse> {
  if (!ExpoContacts.getPermissionsAsync) {
    throw new UnavailabilityError('Contacts', 'getPermissionsAsync');
  }

  return await ExpoContacts.getPermissionsAsync();
}

/**
 * Asks the user to grant permissions for accessing contacts data.
 * @return A promise that resolves to a [PermissionResponse](#permissionresponse) object.
 */
export async function requestPermissionsAsync(): Promise<PermissionResponse> {
  if (!ExpoContacts.requestPermissionsAsync) {
    throw new UnavailabilityError('Contacts', 'requestPermissionsAsync');
  }

  return await ExpoContacts.requestPermissionsAsync();
}

/**
 * Possible fields to retrieve for a contact.
 */
export enum Fields {
  ID = 'id',
  ContactType = 'contactType',
  Name = 'name',
  FirstName = 'firstName',
  MiddleName = 'middleName',
  LastName = 'lastName',
  MaidenName = 'maidenName',
  NamePrefix = 'namePrefix',
  NameSuffix = 'nameSuffix',
  Nickname = 'nickname',
  PhoneticFirstName = 'phoneticFirstName',
  PhoneticMiddleName = 'phoneticMiddleName',
  PhoneticLastName = 'phoneticLastName',
  Birthday = 'birthday',
  /**
   * @platform ios
   */
  NonGregorianBirthday = 'nonGregorianBirthday',
  Emails = 'emails',
  PhoneNumbers = 'phoneNumbers',
  Addresses = 'addresses',
  /**
   * @platform ios
   */
  SocialProfiles = 'socialProfiles',
  InstantMessageAddresses = 'instantMessageAddresses',
  UrlAddresses = 'urlAddresses',
  Company = 'company',
  JobTitle = 'jobTitle',
  Department = 'department',
  ImageAvailable = 'imageAvailable',
  Image = 'image',
  RawImage = 'rawImage',
  ExtraNames = 'extraNames',
  Note = 'note',
  Dates = 'dates',
  Relationships = 'relationships',
}

/**
 * This format denotes the common calendar format used to specify how a date is calculated in `nonGregorianBirthday` fields.
 */
export enum CalendarFormats {
  Gregorian = 'gregorian',
  /**
   * @platform ios
   */
  Buddhist = 'buddhist',
  /**
   * @platform ios
   */
  Chinese = 'chinese',
  /**
   * @platform ios
   */
  Coptic = 'coptic',
  /**
   * @platform ios
   */
  EthiopicAmeteMihret = 'ethiopicAmeteMihret',
  /**
   * @platform ios
   */
  EthiopicAmeteAlem = 'ethiopicAmeteAlem',
  /**
   * @platform ios
   */
  Hebrew = 'hebrew',
  /**
   * @platform ios
   */
  ISO8601 = 'iso8601',
  /**
   * @platform ios
   */
  Indian = 'indian',
  /**
   * @platform ios
   */
  Islamic = 'islamic',
  /**
   * @platform ios
   */
  IslamicCivil = 'islamicCivil',
  /**
   * @platform ios
   */
  Japanese = 'japanese',
  /**
   * @platform ios
   */
  Persian = 'persian',
  /**
   * @platform ios
   */
  RepublicOfChina = 'republicOfChina',
  /**
   * @platform ios
   */
  IslamicTabular = 'islamicTabular',
  /**
   * @platform ios
   */
  IslamicUmmAlQura = 'islamicUmmAlQura',
}

/**
 * @platform ios
 */
export enum ContainerTypes {
  /**
   * A local non-iCloud container.
   */
  Local = 'local',
  /**
   * In association with email server.
   */
  Exchange = 'exchange',
  /**
   * With cardDAV protocol used for sharing.
   */
  CardDAV = 'cardDAV',
  /**
   * Unknown container.
   */
  Unassigned = 'unassigned',
}

export enum SortTypes {
  /**
   * The user default method of sorting.
   * @platform android
   */
  UserDefault = 'userDefault',
  /**
   * Sort by first name in ascending order.
   */
  FirstName = 'firstName',
  /**
   * Sort by last name in ascending order.
   */
  LastName = 'lastName',
  /**
   * No sorting should be applied.
   */
  None = 'none',
}

export enum ContactTypes {
  /**
   * Contact is a human.
   */
  Person = 'person',
  /**
   * Contact is group or company.
   */
  Company = 'company',
}
