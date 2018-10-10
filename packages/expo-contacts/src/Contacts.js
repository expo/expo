// @flow

//TODO:Bacon: No React Native
import { Share } from 'react-native';
import { NativeModulesProxy, Platform } from 'expo-core';
import UUID from 'uuid-js';

const { ExpoContacts } = NativeModulesProxy;

type CalendarFormatType =
  | typeof CalendarFormats.Gregorian
  | typeof CalendarFormats.Buddhist
  | typeof CalendarFormats.Chinese
  | typeof CalendarFormats.Coptic
  | typeof CalendarFormats.EthiopicAmeteMihret
  | typeof CalendarFormats.EthiopicAmeteAlem
  | typeof CalendarFormats.Hebrew
  | typeof CalendarFormats.ISO8601
  | typeof CalendarFormats.Indian
  | typeof CalendarFormats.Islamic
  | typeof CalendarFormats.IslamicCivil
  | typeof CalendarFormats.Japanese
  | typeof CalendarFormats.Persian
  | typeof CalendarFormats.RepublicOfChina
  | typeof CalendarFormats.IslamicTabular
  | typeof CalendarFormats.IslamicUmmAlQura;

type ContainerType =
  | typeof ContainerTypes.Local
  | typeof ContainerTypes.Exchange
  | typeof ContainerTypes.CardDAV
  | typeof ContainerTypes.Unassigned;

type ContactType = typeof ContactTypes.Person | typeof ContactTypes.Company;

type FieldType =
  | typeof Fields.ID
  | typeof Fields.ContactType
  | typeof Fields.Name
  | typeof Fields.FirstName
  | typeof Fields.MiddleName
  | typeof Fields.LastName
  | typeof Fields.MaidenName
  | typeof Fields.NamePrefix
  | typeof Fields.NameSuffix
  | typeof Fields.Nickname
  | typeof Fields.PhoneticFirstName
  | typeof Fields.PhoneticMiddleName
  | typeof Fields.PhoneticLastName
  | typeof Fields.Birthday
  | typeof Fields.NonGregorianBirthday
  | typeof Fields.Emails
  | typeof Fields.PhoneNumbers
  | typeof Fields.Addresses
  | typeof Fields.SocialProfiles
  | typeof Fields.InstantMessageAddresses
  | typeof Fields.UrlAddresses
  | typeof Fields.Company
  | typeof Fields.JobTitle
  | typeof Fields.Department
  | typeof Fields.ImageAvailable
  | typeof Fields.Image
  | typeof Fields.RawImage
  | typeof Fields.ExtraNames
  | typeof Fields.Note
  | typeof Fields.Dates
  | typeof Fields.Relationships;

type Date = {
  day?: number,
  month?: number,
  year?: number,
  id: string,
  label: string,
  format?: CalendarFormatType,
};

type Relationship = {
  label: string,
  name?: string,
  id: string,
};

type Email = {
  email?: string,
  isPrimary?: boolean,
  label: string,
  id: string,
};

type PhoneNumber = {
  number?: string,
  isPrimary?: boolean,
  digits?: string,
  countryCode?: string,
  label: string,
  id: string,
};

type Address = {
  street?: string,
  city?: string,
  country?: string,
  region?: string,
  neighborhood?: string,
  postalCode?: string,
  poBox?: string,
  isoCountryCode?: string,
  label: string,
  id: string,
};

type SocialProfile = {
  service?: string,
  localizedProfile?: string,
  url?: string,
  username?: string,
  userId?: string,
  label: string,
  id: string,
};

type InstantMessageAddress = {
  service?: string,
  username?: string,
  localizedService?: string,
  label: string,
  id: string,
};

type UrlAddress = {
  label: string,
  url?: string,
  id: string,
};

type Image = {
  uri?: string,
  width?: number,
  height?: number,
  base64?: string,
};

type Contact = {
  id: string,
  contactType: ContactType,
  name: string,
  firstName?: string,
  middleName?: string,
  lastName?: string,
  maidenName?: string,
  namePrefix?: string,
  nameSuffix?: string,
  nickname?: string,
  phoneticFirstName?: string,
  phoneticMiddleName?: string,
  phoneticLastName?: string,
  company?: string,
  jobTitle?: string,
  department?: string,
  note?: string,
  imageAvailable?: boolean,
  image?: Image,
  rawImage?: Image,
  birthday?: Date,
  dates?: Date[],
  relationships?: Relationship[],
  emails?: Email[],
  phoneNumbers?: PhoneNumber[],
  addresses?: Address[],
  instantMessageAddresses?: InstantMessageAddress[],
  urlAddresses?: UrlAddress[],

  nonGregorianBirthday?: Date,
  socialProfiles?: SocialProfile[],
};

type ContactResponse = {
  data: Contact[],
  hasNextPage: boolean,
  hasPreviousPage: boolean,
};

type ContactSort =
  | typeof SortTypes.UserDefault
  | typeof SortTypes.FirstName
  | typeof SortTypes.LastName
  | typeof SortTypes.None;

type ContactQuery = {
  pageSize?: number,
  pageOffset?: number,
  fields?: FieldType[],
  sort?: ContactSort,
  name?: string,
  id?: string | string[],
  groupId?: string,
  containerId?: string,
  rawContacts?: boolean,
};

type FormOptions = {
  displayedPropertyKeys?: FieldType[],
  message?: string,
  alternateName?: string,
  allowsEditing?: boolean,
  allowsActions?: boolean,
  shouldShowLinkedContacts?: boolean,
  isNew?: boolean,
  cancelButtonTitle?: string,
  preventAnimation?: boolean,
  groupId?: string,
};

type GroupQuery = {
  groupId?: string,
  groupName?: string,
  containerId?: string,
};

type Group = {
  name?: string,
  id?: string,
};

type ContainerQuery = {
  contactId?: string,
  groupId?: string,
  containerId?: string | string[],
};

type Container = {
  name: string,
  id: string,
  type: ContainerType,
};

const isIos = Platform.OS === 'ios';

export async function shareContactAsync(
  contactId: string,
  message: string,
  shareOptions: Object = {}
): Promise<any> {
  if (isIos) {
    const url = await writeContactToFileAsync({
      id: contactId,
    });
    Share.share(
      {
        url,
        message,
      },
      shareOptions
    );
  } else {
    return ExpoContacts.shareContactAsync(contactId, message);
  }
}

export function getContactsAsync(contactQuery: ContactQuery = {}): Promise<ContactResponse> {
  return ExpoContacts.getContactsAsync(contactQuery);
}

export function getPagedContactsAsync(contactQuery: ContactQuery = {}): Promise<ContactResponse> {
  const { pageSize, ...nOptions } = contactQuery;

  if (pageSize && pageSize <= 0) {
    throw new Error('Error: Contacts.getPagedContactsAsync: `pageSize` must be greater than 0');
  }

  return getContactsAsync({
    ...nOptions,
    pageSize,
  });
}

export async function getContactByIdAsync(id: string, fields?: FieldType): Promise<?Contact> {
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
    return null;
  }
}

export function addContactAsync(contact: Contact, containerId: string): Promise<string> {
  return ExpoContacts.addContactAsync(contact, containerId);
}

export function updateContactAsync(contact: Contact): Promise<string> {
  return ExpoContacts.updateContactAsync(contact);
}

export function removeContactAsync(contactId: string): Promise<any> {
  return ExpoContacts.removeContactAsync(contactId);
}

export function writeContactToFileAsync(contactQuery: ContactQuery = {}): Promise<?string> {
  return ExpoContacts.writeContactToFileAsync(contactQuery);
}

// TODO: Evan: Test
export function presentFormAsync(
  contactId: ?string,
  contact: ?Contact,
  formOptions: FormOptions = {}
): Promise<any> {
  if (isIos) {
    let adjustedOptions = formOptions;

    if (contactId) {
      if (contact) {
        contact = null;
        console.log(
          'Expo.Contacts.presentFormAsync: You should define either a `contact` or a `contactId` but not both.'
        );
      }
      if (adjustedOptions.isNew !== undefined) {
        console.log(
          'Expo.Contacts.presentFormAsync: formOptions.isNew is not supported with `contactId`'
        );
      }
    }
    return ExpoContacts.presentFormAsync(contactId, contact, adjustedOptions);
  } else {
    return ExpoContacts.presentFormAsync(contactId, contact, formOptions);
  }
}

// iOS Only

export function addExistingGroupToContainerAsync(
  groupId: string,
  containerId: string
): Promise<any> {
  if (isIos) {
    return ExpoContacts.addExistingGroupToContainerAsync(groupId, containerId);
  } else {
    throw new Error('Error: Contacts.addExistingGroupToContainerAsync: iOS Only');
  }
}

export async function createGroupAsync(name: ?string, containerId: ?string): Promise<string> {
  if (isIos) {
    name = name || UUID.create().toString();
    if (!containerId) containerId = await getDefaultContainerIdAsync();

    return ExpoContacts.createGroupAsync(name, containerId);
  } else {
    throw new Error('Error: Contacts.createGroupAsync: iOS Only');
  }
}

export function updateGroupNameAsync(groupName: string, groupId: string): Promise<any> {
  if (isIos) {
    return ExpoContacts.updateGroupNameAsync(groupName, groupId);
  } else {
    throw new Error('Error: Contacts.updateGroupNameAsync: iOS Only');
  }
}

export function removeGroupAsync(groupId: string): Promise<any> {
  if (isIos) {
    return ExpoContacts.removeGroupAsync(groupId);
  } else {
    throw new Error('Error: Contacts.removeGroupAsync: iOS Only');
  }
}

export function addExistingContactToGroupAsync(contactId: string, groupId: string): Promise<any> {
  if (isIos) {
    return ExpoContacts.addExistingContactToGroupAsync(contactId, groupId);
  } else {
    throw new Error('Error: Contacts.addExistingContactToGroupAsync: iOS Only');
  }
}

export function removeContactFromGroupAsync(contactId: string, groupId: string): Promise<any> {
  if (isIos) {
    return ExpoContacts.removeContactFromGroupAsync(contactId, groupId);
  } else {
    throw new Error('Error: Contacts.removeContactFromGroupAsync: iOS Only');
  }
}

export function getGroupsAsync(groupQuery: GroupQuery): Promise<Group[]> {
  if (isIos) {
    return ExpoContacts.getGroupsAsync(groupQuery);
  } else {
    throw new Error('Error: Contacts.getGroupsAsync: iOS Only');
  }
}

export function getDefaultContainerIdAsync(): Promise<string> {
  if (isIos) {
    return ExpoContacts.getDefaultContainerIdentifierAsync();
  } else {
    throw new Error('Error: Contacts.getDefaultContainerIdAsync: iOS Only');
  }
}

export function getContainersAsync(containerQuery: ContainerQuery): Promise<Container[]> {
  if (isIos) {
    return ExpoContacts.getContainersAsync(containerQuery);
  } else {
    throw new Error('Error: Contacts.getContainersAsync: iOS Only');
  }
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
