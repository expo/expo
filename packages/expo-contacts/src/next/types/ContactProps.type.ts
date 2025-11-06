import {
  Email,
  Date,
  PostalAddress,
  Phone,
  Relationship,
  UrlAddress,
  ExtraName,
} from './Contact.type';

export enum ContactField {
  GIVEN_NAME = 'givenName',
  MIDDLE_NAME = 'middleName',
  FAMILY_NAME = 'familyName',
  PREFIX = 'prefix',
  SUFFIX = 'suffix',
  PHONETIC_GIVEN_NAME = 'phoneticGivenName',
  PHONETIC_MIDDLE_NAME = 'phoneticMiddleName',
  PHONETIC_FAMILY_NAME = 'phoneticFamilyName',
  COMPANY = 'company',
  DEPARTMENT = 'department',
  JOB_TITLE = 'jobTitle',
  NOTE = 'note',
  EMAILS = 'emails',
  PHONES = 'phones',
  ADDRESSES = 'addresses',
  DATES = 'dates',
  RELATIONSHIPS = 'relationships',
  URL_ADDRESSES = 'urlAddresses',
  EXTRA_NAMES = 'extraNames',
}

export type CreateContactRecord = {
  givenName?: string | null;
  middleName?: string;
  familyName?: string;
  prefix?: string;
  suffix?: string;
  phoneticGivenName?: string;
  phoneticMiddleName?: string;
  phoneticFamilyName?: string;
  company?: string;
  department?: string;
  jobTitle?: string;
  isFavourite?: boolean;
  note?: string;
  emails?: Email.New[];
  dates?: Date.New[];
  phones?: Phone.New[];
  addresses?: PostalAddress.New[];
  relationships?: Relationship.New[];
  urlAddresses?: UrlAddress.New[];
  extraNames?: ExtraName.New[];
};

export type ContactDetails = {
  givenName?: string | null;
  middleName?: string;
  familyName?: string;
  prefix?: string;
  suffix?: string;
  phoneticGivenName?: string;
  phoneticMiddleName?: string;
  phoneticFamilyName?: string;
  company?: string;
  department?: string;
  jobTitle?: string;
  note?: string;
  emails?: Email.Existing[];
  dates?: Date.Existing[];
  phones?: Phone.New[];
  addresses?: PostalAddress.New[];
  relationships?: Relationship.New[];
  urlAddresses?: UrlAddress.New[];
  extraNames?: ExtraName.New[];
};

export type ContactFieldKey = {
  [ContactField.GIVEN_NAME]: 'givenName';
  [ContactField.MIDDLE_NAME]: 'middleName';
  [ContactField.FAMILY_NAME]: 'familyName';
  [ContactField.PREFIX]: 'prefix';
  [ContactField.SUFFIX]: 'suffix';
  [ContactField.PHONETIC_GIVEN_NAME]: 'phoneticGivenName';
  [ContactField.PHONETIC_MIDDLE_NAME]: 'phoneticMiddleName';
  [ContactField.PHONETIC_FAMILY_NAME]: 'phoneticFamilyName';
  [ContactField.COMPANY]: 'company';
  [ContactField.DEPARTMENT]: 'department';
  [ContactField.JOB_TITLE]: 'jobTitle';
  [ContactField.NOTE]: 'note';
  [ContactField.EMAILS]: 'emails';
  [ContactField.PHONES]: 'phones';
  [ContactField.ADDRESSES]: 'addresses';
  [ContactField.DATES]: 'dates';
  [ContactField.RELATIONSHIPS]: 'relationships';
  [ContactField.URL_ADDRESSES]: 'urlAddresses';
  [ContactField.EXTRA_NAMES]: 'extraNames';
};

export type PartialContactDetails<T extends readonly ContactField[]> = {
  [K in T[number]]: ContactDetails[ContactFieldKey[K]];
};
