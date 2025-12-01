import { SocialProfile } from '../../Contacts';
import {
  ContactField,
  ContactQueryOptions,
  CreateContactRecord,
  FormOptions,
  PartialContactDetails,
} from './ContactProps.type';

export namespace Email {
  export type Existing = {
    id: string;
    label?: string;
    address?: string;
  };
  export type New = {
    label?: string;
    address?: string;
  };
}

export namespace Phone {
  export type Existing = {
    id: string;
    label?: string;
    number?: string;
  };
  export type New = {
    label?: string;
    number?: string;
  };
}

export namespace Date {
  export type Existing = {
    id: string;
    label?: string;
    date?: ContactDate;
  };
  export type New = {
    label?: string;
    date?: ContactDate;
  };
}

export namespace ExtraName {
  export type Existing = {
    id: string;
    label?: string;
    name?: string;
  };
  export type New = {
    label?: string;
    name?: string;
  };
}

export namespace Address {
  export type Existing = {
    id: string;
    label?: string;
    street?: string;
    city?: string;
    region?: string;
    postcode?: string;
    country?: string;
  };
  export type New = {
    label?: string;
    street?: string;
    city?: string;
    region?: string;
    postcode?: string;
    country?: string;
  };
}

export namespace Relation {
  export type Existing = {
    id: string;
    label?: string;
    name?: string;
  };
  export type New = {
    label?: string;
    name?: string;
  };
}

export namespace UrlAddress {
  export type Existing = {
    id: string;
    label?: string;
    url?: string;
  };
  export type New = {
    label?: string;
    url?: string;
  };
}

export namespace ImAddress {
  export type Existing = {
    id: string;
    label?: string;
    username?: string;
    service?: string;
  };
  export type New = {
    label?: string;
    username?: string;
    service?: string;
  };
}

export namespace SocialProfile {
  export type Existing = {
    id: string;
    label?: string;
    username?: string;
    service?: string;
    url?: string;
    userId?: string;
  };
  export type New = {
    label?: string;
    username?: string;
    service?: string;
    url?: string;
    userId?: string;
  };
}

export type ContactDate = {
  year?: string;
  month: string;
  day: string;
};

export type ContactPatch = {
  isFavourite?: boolean | null;
  nickname?: string | null;
  maidenName?: string | null;
  givenName?: string | null;
  middleName?: string | null;
  familyName?: string | null;
  prefix?: string | null;
  suffix?: string | null;
  phoneticGivenName?: string | null;
  phoneticMiddleName?: string | null;
  phoneticFamilyName?: string | null;
  company?: string | null;
  department?: string | null;
  jobTitle?: string | null;
  phoneticCompanyName?: string | null;
  note?: string | null;
  emails?: (Email.Existing | Email.New)[] | null;
  phones?: (Phone.Existing | Phone.New)[] | null;
  dates?: (Date.Existing | Date.New)[] | null;
  extraNames?: (ExtraName.Existing | ExtraName.New)[] | null;
  addresses?: (Address.Existing | Address.New)[] | null;
  relations?: (Relation.Existing | Relation.New)[] | null;
  urlAddresses?: (UrlAddress.Existing | UrlAddress.New)[] | null;
};

export declare class Contact {
  constructor(id: string);
  id: string;
  /**
   * Deletes the contact from the device.
   * @returns A promise that resolves when the contact has been deleted.
   * @usage ```ts
   * await contact.delete();
   * ```
   */
  delete(): Promise<void>;
  /**
   * Patches the contact with the provided fields. If a field is set to `null`, it will be removed from the contact.
   * If a field is omitted, it will remain unchanged.
   * @param contact  An object containing the fields to update.
   * @returns A promise that resolves when the contact has been updated.
   * @usage ```ts
   * await contact.patch({
   *   givenName: 'Updated',
   *   familyName: null, // This will remove the family name from the contact
   *   phones: [{ label: 'mobile', number: '123-456-7890' }], // This will replace all existing phones
   * });
   * ```
   */
  patch(contact: ContactPatch): Promise<void>;
  /**
   * Updates the contact with the provided fields. All fields will be replaced with the new values.
   * @param contact  An object containing the new contact details.
   * @returns A promise that resolves when the contact has been updated.
   * @usage ```ts
   * await contact.update({
   *   givenName: 'NewGiven',
   *   familyName: 'NewFamily',
   *   phones: [{ label: 'home', number: '098-765-4321' }],
   *   // All other
   * });
   * ```
   */
  update(contact: CreateContactRecord): Promise<void>;
  /**
   * Gets the contact details for the specified fields.
   * @param fields  An array of `ContactField` to retrieve. If not provided, all details will be fetched.
   * @returns A promise resolving to an object containing the requested contact details.
   * @usage ```ts
   * const contactDetails = await contact.getDetails(['givenName', 'phones', 'emails']);
   * console.log(contactDetails);
   * ```
   */
  getDetails<T extends readonly ContactField[]>(fields?: T): Promise<PartialContactDetails<T>>;

  /**
   * Gets the full name of the contact by combining the given name and family name.
   * @returns A promise resolving to the full name of the contact.
   * @usage ```ts
   * const fullName = await contact.getFullname();
   * console.log(fullName);
   * ```
   */
  getFullname(): Promise<string>;

  /**
   * Adds a new email to the existing contact.
   * @param email An email object
   * @returns A promise resolving to the ID of the newly added email.
   * @usage ```ts
   * const newEmailId = await contact.addEmail({
   *  label: 'work',
   *  address: 'work@example.com'
   * });
   * ```
   */
  addEmail(email: Email.New): Promise<string>;
  /**
   * Gets all emails associated with the contact.
   * @returns A promise resolving to an array of email objects.
   * @usage ```ts
   * const emails = await contact.getEmails();
   * console.log(emails);
   * ```
   */
  getEmails(): Promise<Email.Existing[]>;

  /**
   * Deletes an email from the contact.
   * @param email An existing email object to delete.
   * @returns A promise that resolves when the email has been deleted.
   * @usage ```ts
   * await contact.deleteEmail(existingEmail);
   * ```
   */
  deleteEmail(email: Email.Existing): Promise<void>;
  updateEmail(updatedEmail: Email.Existing): Promise<void>;

  addPhone(phone: Phone.New): Promise<string>;
  getPhones(): Promise<Phone.Existing[]>;
  deletePhone(phone: Phone.Existing): Promise<void>;
  updatePhone(updatedPhone: Phone.Existing): Promise<void>;

  addDate(date: Date.New): Promise<string>;
  getDates(): Promise<Date.Existing[]>;
  deleteDate(date: Date.Existing | string): Promise<void>;
  updateDate(updatedDate: Date.Existing): Promise<void>;

  addExtraName(extraName: ExtraName.New): Promise<string>;
  getExtraNames(): Promise<ExtraName.Existing[]>;
  deleteExtraName(extraName: ExtraName.Existing | string): Promise<void>;
  updateExtraName(updatedExtraName: ExtraName.Existing): Promise<void>;

  addAddress(address: Address.New): Promise<string>;
  getAddresses(): Promise<Address.Existing[]>;
  deleteAddress(address: Address.Existing | string): Promise<void>;
  updateAddress(updatedAddress: Address.Existing): Promise<void>;

  addRelation(relation: Relation.New): Promise<string>;
  getRelations(): Promise<Relation.Existing[]>;
  deleteRelation(relation: Relation.Existing | string): Promise<void>;
  updateRelation(updatedRelation: Relation.Existing): Promise<void>;

  addUrlAddress(urlAddress: UrlAddress.New): Promise<string>;
  getUrlAddresses(): Promise<UrlAddress.Existing[]>;
  deleteUrlAddress(urlAddress: UrlAddress.Existing | string): Promise<void>;
  updateUrlAddress(updatedUrlAddress: UrlAddress.Existing): Promise<void>;

  addSocialProfile(socialProfile: SocialProfile.New): Promise<string>;
  getSocialProfiles(): Promise<SocialProfile.Existing[]>;
  deleteSocialProfile(socialProfile: SocialProfile.Existing | string): Promise<void>;
  updateSocialProfile(updatedSocialProfile: SocialProfile.Existing): Promise<void>;

  addImAddress(imAddress: ImAddress.New): Promise<string>;
  getImAddresses(): Promise<ImAddress.Existing[]>;
  deleteImAddress(imAddress: ImAddress.Existing | string): Promise<void>;
  updateImAddress(updatedImAddress: ImAddress.Existing): Promise<void>;

  editWithForm(options?: FormOptions): Promise<boolean>;
  share(subject: string): Promise<boolean>;

  getFullName(): Promise<string>;
  getIsFavourite(): Promise<boolean>;
  setIsFavourite(isFavourite: boolean): Promise<boolean>;
  getGivenName(): Promise<string | null>;
  setGivenName(givenName: string | null): Promise<boolean>;
  getFamilyName(): Promise<string | null>;
  setFamilyName(familyName: string | null): Promise<boolean>;
  getMiddleName(): Promise<string | null>;
  setMiddleName(middleName: string | null): Promise<boolean>;
  getMaidenName(): Promise<string | null>;
  setMaidenName(maidenName: string | null): Promise<boolean>;
  getNickname(): Promise<string | null>;
  setNickname(nickname: string | null): Promise<boolean>;
  getPrefix(): Promise<string | null>;
  setPrefix(prefix: string | null): Promise<boolean>;
  getSuffix(): Promise<string | null>;
  setSuffix(suffix: string | null): Promise<boolean>;
  getDisplayName(): Promise<string | null>;
  setDisplayName(displayName: string | null): Promise<boolean>;
  getPhoneticGivenName(): Promise<string | null>;
  setPhoneticGivenName(phoneticGivenName: string | null): Promise<boolean>;
  getPhoneticMiddleName(): Promise<string | null>;
  setPhoneticMiddleName(phoneticMiddleName: string | null): Promise<boolean>;
  getPhoneticFamilyName(): Promise<string | null>;
  setPhoneticFamilyName(phoneticFamilyName: string | null): Promise<boolean>;
  getCompany(): Promise<string | null>;
  setCompany(company: string | null): Promise<boolean>;
  getDepartment(): Promise<string | null>;
  setDepartment(department: string | null): Promise<boolean>;
  getJobTitle(): Promise<string | null>;
  setJobTitle(jobTitle: string | null): Promise<boolean>;
  getPhoneticCompanyName(): Promise<string | null>;
  setPhoneticCompanyName(phoneticCompanyName: string | null): Promise<boolean>;
  getNote(): Promise<string | null>;
  setNote(note: string | null): Promise<boolean>;
  getImage(): Promise<string | null>;
  setImage(imageUri: string | null): Promise<boolean>;
  getThumbnail(): Promise<string | null>;

  getBirthday(): Promise<ContactDate | null>;
  setBirthday(birthday: ContactDate | null): Promise<boolean>;

  getNonGregorianBirthday(): Promise<NonGregorianBirthday | null>;
  setNonGregorianBirthday(nonGregorianBirthday: NonGregorianBirthday | null): Promise<boolean>;

  static getAll(options?: ContactQueryOptions): Promise<Contact[]>;
  static create(contact: CreateContactRecord): Promise<Contact>;
  static createWithForm(contact?: CreateContactRecord): Promise<boolean>;
  static presentPicker(): Promise<Contact>;
  static presentAccessPicker(): Promise<boolean>;
  static getAllDetails<T extends readonly ContactField[]>(
    fields: T,
    options?: ContactQueryOptions
  ): Promise<PartialContactDetails<T>[]>;

  static requestPermissionsAsync(): Promise<{ granted: boolean }>;
}

export type NonGregorianBirthday = {
  year?: string;
  month: string;
  day: string;
  calendar: NonGregorianCalendar;
};

export enum NonGregorianCalendar {
  buddhist = 'buddhist',
  chinese = 'chinese',
  coptic = 'coptic',
  ethiopicAmeteMihret = 'ethiopicAmeteMihret',
  ethiopicAmeteAlem = 'ethiopicAmeteAlem',
  hebrew = 'hebrew',
  indian = 'indian',
  islamic = 'islamic',
  islamicCivil = 'islamicCivil',
  japanese = 'japanese',
  persian = 'persian',
  republicOfChina = 'republicOfChina',
}
