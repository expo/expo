import { ContactDetails } from './Contact.types';

/**
 * Enum representing the various fields of a contact. These fields can be used
 * to specify which details to retrieve from a contact.
 */
export enum ContactField {
  IS_FAVOURITE = 'isFavourite',
  FULL_NAME = 'fullName',
  GIVEN_NAME = 'givenName',
  MIDDLE_NAME = 'middleName',
  FAMILY_NAME = 'familyName',
  MAIDEN_NAME = 'maidenName',
  NICKNAME = 'nickname',
  PREFIX = 'prefix',
  SUFFIX = 'suffix',
  PHONETIC_GIVEN_NAME = 'phoneticGivenName',
  PHONETIC_MIDDLE_NAME = 'phoneticMiddleName',
  PHONETIC_FAMILY_NAME = 'phoneticFamilyName',
  COMPANY = 'company',
  DEPARTMENT = 'department',
  JOB_TITLE = 'jobTitle',
  NOTE = 'note',
  IMAGE = 'image',
  BIRTHDAY = 'birthday',
  NON_GREGORIAN_BIRTHDAY = 'nonGregorianBirthday',
  EMAILS = 'emails',
  PHONES = 'phones',
  ADDRESSES = 'addresses',
  EXTRA_NAMES = 'extraNames',
  DATES = 'dates',
  RELATIONS = 'relations',
  URL_ADDRESSES = 'urlAddresses',
  SOCIAL_PROFILES = 'socialProfiles',
  IM_ADDRESSES = 'imAddresses',
}

/**
 * Enum representing the sort order options for querying contacts.
 */
export enum ContactsSortOrder {
  UserDefault = 'userDefault',
  GivenName = 'givenName',
  FamilyName = 'familyName',
  None = 'none',
}

/**
 * Options for querying multiple contacts.
 */
export type ContactQueryOptions = {
  /*
   * Maximum number of contacts to return. If not specified, all matching contacts are returned.
   */
  limit?: number;
  /*
   * Number of contacts to skip from the start of the result set. If not specified, starts from the beginning.
   */
  offset?: number;
  /*
   * Sort order for the returned contacts. If not specified, the default sort order is used.
   */
  sortOrder?: ContactsSortOrder;
  /*
   * A string to filter contacts by name. If specified, only contacts whose name contains this string are returned.
   */
  name?: string;
  /*
   * Whether to include raw contact data in the results. Default is false.
   * @platform ios
   */
  rawContacts?: boolean;
};

/**
 * Denotes the functionality of a native contact form.
 * @platform ios
 */
export type FormOptions = {
  /**
   * The properties that will be displayed when viewing a contact.
   */
  displayedPropertyKeys?: ContactField[];
  /**
   * The message displayed under the name of the contact. Only applies when editing an existing contact.
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
   * The name of the left bar button. Only applies when editing an existing contact.
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

// @hidden
export type ContactFieldKey = {
  [ContactField.IS_FAVOURITE]: 'isFavourite';
  [ContactField.FULL_NAME]: 'fullName';
  [ContactField.GIVEN_NAME]: 'givenName';
  [ContactField.MIDDLE_NAME]: 'middleName';
  [ContactField.FAMILY_NAME]: 'familyName';
  [ContactField.MAIDEN_NAME]: 'maidenName';
  [ContactField.NICKNAME]: 'nickname';
  [ContactField.PREFIX]: 'prefix';
  [ContactField.SUFFIX]: 'suffix';
  [ContactField.PHONETIC_GIVEN_NAME]: 'phoneticGivenName';
  [ContactField.PHONETIC_MIDDLE_NAME]: 'phoneticMiddleName';
  [ContactField.PHONETIC_FAMILY_NAME]: 'phoneticFamilyName';
  [ContactField.COMPANY]: 'company';
  [ContactField.DEPARTMENT]: 'department';
  [ContactField.JOB_TITLE]: 'jobTitle';
  [ContactField.NOTE]: 'note';
  [ContactField.IMAGE]: 'image';
  [ContactField.BIRTHDAY]: 'birthday';
  [ContactField.NON_GREGORIAN_BIRTHDAY]: 'nonGregorianBirthday';
  [ContactField.EMAILS]: 'emails';
  [ContactField.PHONES]: 'phones';
  [ContactField.ADDRESSES]: 'addresses';
  [ContactField.DATES]: 'dates';
  [ContactField.EXTRA_NAMES]: 'extraNames';
  [ContactField.RELATIONS]: 'relations';
  [ContactField.URL_ADDRESSES]: 'urlAddresses';
  [ContactField.SOCIAL_PROFILES]: 'socialProfiles';
  [ContactField.IM_ADDRESSES]: 'imAddresses';
};

// @hidden
export type PartialContactDetails<T extends readonly ContactField[]> = {
  id: string;
} & {
  [K in T[number]]: ContactDetails[K];
};
