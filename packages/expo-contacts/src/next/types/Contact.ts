import {
  ContactField,
  ContactQueryOptions,
  FormOptions,
  PartialContactDetails,
} from './Contact.props';
import {
  ExistingEmail,
  ExistingPhone,
  ExistingDate,
  ExistingExtraName,
  ExistingAddress,
  ExistingRelation,
  ExistingUrlAddress,
  ExistingSocialProfile,
  ExistingImAddress,
  NewEmail,
  NewPhone,
  NewDate,
  NewExtraName,
  NewAddress,
  NewRelation,
  NewUrlAddress,
  NewSocialProfile,
  NewImAddress,
  ContactPatch,
  CreateContactRecord,
  ContactDate,
  NonGregorianBirthday,
} from './Contact.types';

export declare class Contact {
  /**
   * Constructor for Contact instance.
   * While you can instantiate this class directly if you have an ID, the recommended way to obtain a `Contact` instance
   * is to use static methods like `Contact.getAll`, `Contact.presentPicker`, or `Contact.create`.
   *
   * @param id - The unique identifier of the contact.
   */
  constructor(id: string);

  /**
   * The unique identifier for the contact.
   * - For iOS it is the unique UUID string.
   * - For Android it is the `_ID` column from `ContactsContract.Contacts` table.
   */
  id: string;

  /**
   * Deletes the contact from the device's address book.
   * @returns a promise that resolves when the contact is successfully deleted.
   * @example
   * ```ts
   * await contact.delete();
   * ```
   */
  delete(): Promise<void>;

  /**
   * Applies partial updates to the contact. Undefined fields are ignored.
   * Lists like `emails` or `phones` are entirely replaced if provided.
   * If you want to overwrite the entire contact, use the `update` method instead.
   * @param contact - A partial contact record containing the fields to update.
   * @example
   * ```ts
   * const details = await contact.getDetails([ContactField.GivenName, ContactField.FamilyName, ContactField.Phones]);
   * details.givenName = 'Jane'; // updates the given name
   * details.familyName = null; // clears the family name
   * details.phones = [
   *    ...details.phones,  // keeps existing phone numbers
   *    { label: 'newPhone', number: '+12123456789' } // adds a new phone number
   * ];
   * await contact.patch(details);
   * ```
   */
  patch(contact: ContactPatch): Promise<void>;

  /**
   * Overwrites the contact data with the provided record.
   * If you want to apply partial updates, use the `patch` method instead.
   * @param contact - The new data record for the contact.
   * @example
   * ```ts
   * const newDetails: CreateContactRecord = {
   *    givenName: 'Jane',
   *    familyName: 'Doe',
   *    phones: [{ label: 'mobile', number: '+12123456789' }]
   * };
   * await contact.update(newDetails);
   * ```
   */
  update(contact: CreateContactRecord): Promise<void>;

  /**
   * Retrieves specific details for the contact.
   * This method is useful when you want to retrieve only certain fields of the contact.
   * @param fields - An array of field names to retrieve. If omitted, all available fields are fetched.
   * @returns a promise resolving to an object containing the requested details.
   * @example
   * ```ts
   * const details = await contact.getDetails([ContactField.GivenName, ContactField.Phones]);
   * details.givenName; // 'John'
   * details.familyName; // undefined
   * details.phones; // [{ label: 'mobile', number: '+12123456789' }]
   * ```
   */
  getDetails<T extends readonly ContactField[]>(fields?: T): Promise<PartialContactDetails<T>>;

  /**
   * Adds a new email address to the contact.
   * @param email - The new email object to add.
   * @returns a promise resolving to the ID of the newly added email.
   * @example
   * ```ts
   * const newEmailId = await contact.addEmail({ label: 'work', address: 'work@example.com' });
   * ```
   */
  addEmail(email: NewEmail): Promise<string>;

  /**
   * Retrieves all email addresses associated with the contact.
   * @returns a promise resolving to an array of existing emails.
   * @example
   * ```ts
   * const emails = await contact.getEmails();
   * ```
   */
  getEmails(): Promise<ExistingEmail[]>;

  /**
   * Deletes a specific email address from the contact.
   * @param email - The existing email object to delete.
   * @example
   * ```ts
   * await contact.deleteEmail(existingEmail);
   * ```
   */
  deleteEmail(email: ExistingEmail): Promise<void>;

  /**
   * Updates an existing email address.
   * @param updatedEmail - The email object with updated values. Must contain a valid ID.
   * @example
   * ```ts
   * const emails = await contact.getEmails();
   * const emailToUpdate = emails[0];
   * emailToUpdate.address = 'new@example.com';
   * await contact.updateEmail(emailToUpdate);
   * ```
   */
  updateEmail(updatedEmail: ExistingEmail): Promise<void>;

  /**
   * Adds a new phone number to the contact.
   * @param phone - The new phone object to add.
   * @returns a promise resolving to the ID of the newly added phone number.
   * @example
   * ```ts
   * const newPhoneId = await contact.addPhone({ label: 'home', number: '+12123456789' });
   * ```
   */
  addPhone(phone: NewPhone): Promise<string>;

  /**
   * Retrieves all phone numbers associated with the contact.
   * @returns a promise resolving to an array of existing phone numbers.
   * @example
   * ```ts
   * const phones = await contact.getPhones();
   * ```
   */
  getPhones(): Promise<ExistingPhone[]>;

  /**
   * Deletes a specific phone number from the contact.
   * @param phone - The existing phone object to delete.
   * @example
   * ```ts
   * await contact.deletePhone(existingPhone);
   * ```
   */
  deletePhone(phone: ExistingPhone): Promise<void>;

  /**
   * Updates an existing phone number.
   * @param updatedPhone - The phone object with updated values. Must contain a valid ID.
   * @example
   * ```ts
   * const phones = await contact.getPhones();
   * const phoneToUpdate = phones[0];
   * phoneToUpdate.number = '+19876543210';
   * await contact.updatePhone(phoneToUpdate);
   * ```
   */
  updatePhone(updatedPhone: ExistingPhone): Promise<void>;

  /**
   * Adds a new date (e.g., anniversary, birthday) to the contact.
   * @param date - The new date object to add.
   * @returns a promise resolving to the ID of the newly added date.
   * @example
   * ```ts
   * await contact.addDate({ label: 'anniversary', date: { day: 1, month: 1 } });
   * ```
   */
  addDate(date: NewDate): Promise<string>;

  /**
   * Retrieves all dates associated with the contact.
   * @returns a promise resolving to an array of existing dates.
   * @example
   * ```ts
   * const dates = await contact.getDates();
   * ```
   */
  getDates(): Promise<ExistingDate[]>;

  /**
   * Deletes a specific date from the contact.
   * @param date - The existing date object to delete.
   * @example
   * ```ts
   * await contact.deleteDate(existingDate);
   * ```
   */
  deleteDate(date: ExistingDate): Promise<void>;

  /**
   * Updates an existing date.
   * @param updatedDate - The date object with updated values. Must contain a valid ID.
   * @example
   * ```ts
   * const dates = await contact.getDates();
   * const dateToUpdate = dates[0];
   * dateToUpdate.label = 'birthday';
   * await contact.updateDate(dateToUpdate);
   * ```
   */
  updateDate(updatedDate: ExistingDate): Promise<void>;

  /**
   * Adds a new extra name (e.g., nickname, maiden name) to the contact.
   * @platform android
   * @param extraName - The new extra name object to add.
   * @returns a promise resolving to the ID of the newly added extra name.
   * @example
   * ```ts
   * await contact.addExtraName({ label: 'nickname', name: 'Johnny' });
   * ```
   */
  addExtraName(extraName: NewExtraName): Promise<string>;

  /**
   * Retrieves all extra names associated with the contact.
   * @platform android
   * @returns a promise resolving to an array of existing extra names.
   * @example
   * ```ts
   * const extraNames = await contact.getExtraNames();
   * ```
   */
  getExtraNames(): Promise<ExistingExtraName[]>;

  /**
   * Deletes a specific extra name from the contact.
   * @platform android
   * @param extraName - The existing extra name object or its ID string.
   * @example
   * ```ts
   * await contact.deleteExtraName(existingExtraName);
   * ```
   */
  deleteExtraName(extraName: ExistingExtraName | string): Promise<void>;

  /**
   * Updates an existing extra name.
   * @platform android
   * @param updatedExtraName - The extra name object with updated values. Must contain a valid ID.
   * @example
   * ```ts
   * const names = await contact.getExtraNames();
   * const nameToUpdate = names[0];
   * nameToUpdate.name = 'Jojo';
   * await contact.updateExtraName(nameToUpdate);
   * ```
   */
  updateExtraName(updatedExtraName: ExistingExtraName): Promise<void>;

  /**
   * Adds a new postal address to the contact.
   * @param address - The new address object to add.
   * @returns a promise resolving to the ID of the newly added address.
   * @example
   * ```ts
   * await contact.addAddress({ label: 'home', street: '123 Main St', city: 'London' });
   * ```
   */
  addAddress(address: NewAddress): Promise<string>;

  /**
   * Retrieves all postal addresses associated with the contact.
   * @returns a promise resolving to an array of existing addresses.
   * @example
   * ```ts
   * const addresses = await contact.getAddresses();
   * ```
   */
  getAddresses(): Promise<ExistingAddress[]>;

  /**
   * Deletes a specific postal address from the contact.
   * @param address - The existing address object to delete.
   * @example
   * ```ts
   * await contact.deleteAddress(existingAddress);
   * ```
   */
  deleteAddress(address: ExistingAddress): Promise<void>;

  /**
   * Updates an existing postal address.
   * @param updatedAddress - The address object with updated values. Must contain a valid ID.
   * @example
   * ```ts
   * const addresses = await contact.getAddresses();
   * const addressToUpdate = addresses[0];
   * addressToUpdate.city = 'New York';
   * await contact.updateAddress(addressToUpdate);
   * ```
   */
  updateAddress(updatedAddress: ExistingAddress): Promise<void>;

  /**
   * Adds a new relationship (e.g., brother, sister) to the contact.
   * @param relation - The new relation object to add.
   * @returns a promise resolving to the ID of the newly added relation.
   * @example
   * ```ts
   * await contact.addRelation({ label: 'brother', name: 'Mark' });
   * ```
   */
  addRelation(relation: NewRelation): Promise<string>;

  /**
   * Retrieves all relations associated with the contact.
   * @returns a promise resolving to an array of existing relations.
   * @example
   * ```ts
   * const relations = await contact.getRelations();
   * ```
   */
  getRelations(): Promise<ExistingRelation[]>;

  /**
   * Deletes a specific relation from the contact.
   * @param relation - The existing relation object or its ID string.
   * @example
   * ```ts
   * await contact.deleteRelation(existingRelation);
   * ```
   */
  deleteRelation(relation: ExistingRelation | string): Promise<void>;

  /**
   * Updates an existing relation.
   * @param updatedRelation - The relation object with updated values. Must contain a valid ID.
   * @example
   * ```ts
   * const relations = await contact.getRelations();
   * const relationToUpdate = relations[0];
   * relationToUpdate.name = 'Marcus';
   * await contact.updateRelation(relationToUpdate);
   * ```
   */
  updateRelation(updatedRelation: ExistingRelation): Promise<void>;

  /**
   * Adds a new URL/website to the contact.
   * @param urlAddress - The new URL address object to add.
   * @returns a promise resolving to the ID of the newly added URL.
   * @example
   * ```ts
   * await contact.addUrlAddress({ label: 'blog', url: '[https://myblog.com](https://myblog.com)' });
   * ```
   */
  addUrlAddress(urlAddress: NewUrlAddress): Promise<string>;

  /**
   * Retrieves all URL addresses associated with the contact.
   * @returns a promise resolving to an array of existing URL addresses.
   * @example
   * ```ts
   * const urls = await contact.getUrlAddresses();
   * ```
   */
  getUrlAddresses(): Promise<ExistingUrlAddress[]>;

  /**
   * Deletes a specific URL address from the contact.
   * @param urlAddress - The existing URL address object to delete.
   * @example
   * ```ts
   * await contact.deleteUrlAddress(existingUrlAddress);
   * ```
   */
  deleteUrlAddress(urlAddress: ExistingUrlAddress): Promise<void>;

  /**
   * Updates an existing URL address.
   * @param updatedUrlAddress - The URL address object with updated values. Must contain a valid ID.
   * @example
   * ```ts
   * const urls = await contact.getUrlAddresses();
   * const urlToUpdate = urls[0];
   * urlToUpdate.url = '[https://updated-blog.com](https://updated-blog.com)';
   * await contact.updateUrlAddress(urlToUpdate);
   * ```
   */
  updateUrlAddress(updatedUrlAddress: ExistingUrlAddress): Promise<void>;

  /**
   * Adds a new social profile to the contact.
   * @platform ios
   * @param socialProfile - The new social profile object to add.
   * @returns a promise resolving to the ID of the newly added social profile.
   * @example
   * ```ts
   * await contact.addSocialProfile({ service: 'twitter', username: 'myhandle' });
   * ```
   */
  addSocialProfile(socialProfile: NewSocialProfile): Promise<string>;

  /**
   * Retrieves all social profiles associated with the contact.
   * @platform ios
   * @returns a promise resolving to an array of existing social profiles.
   * @example
   * ```ts
   * const profiles = await contact.getSocialProfiles();
   * ```
   */
  getSocialProfiles(): Promise<ExistingSocialProfile[]>;

  /**
   * Deletes a specific social profile from the contact.
   * @platform ios
   * @param socialProfile - The existing social profile object to delete.
   * @example
   * ```ts
   * await contact.deleteSocialProfile(existingSocialProfile);
   * ```
   */
  deleteSocialProfile(socialProfile: ExistingSocialProfile): Promise<void>;

  /**
   * Updates an existing social profile.
   * @platform ios
   * @param updatedSocialProfile - The social profile object with updated values. Must contain a valid ID.
   * @example
   * ```ts
   * const profiles = await contact.getSocialProfiles();
   * const profileToUpdate = profiles[0];
   * profileToUpdate.username = 'newhandle';
   * await contact.updateSocialProfile(profileToUpdate);
   * ```
   */
  updateSocialProfile(updatedSocialProfile: ExistingSocialProfile): Promise<void>;

  /**
   * Adds a new instant messaging address to the contact.
   * @platform ios
   * @param imAddress - The new IM address object to add.
   * @returns a promise resolving to the ID of the newly added IM address.
   * @example
   * ```ts
   * await contact.addImAddress({ service: 'Skype', username: 'user123' });
   * ```
   */
  addImAddress(imAddress: NewImAddress): Promise<string>;

  /**
   * Retrieves all instant messaging addresses associated with the contact.
   * @platform ios
   * @returns a promise resolving to an array of existing IM addresses.
   * @example
   * ```ts
   * const ims = await contact.getImAddresses();
   * ```
   */
  getImAddresses(): Promise<ExistingImAddress[]>;

  /**
   * Deletes a specific instant messaging address from the contact.
   * @platform ios
   * @param imAddress - The existing IM address object to delete.
   * @example
   * ```ts
   * await contact.deleteImAddress(existingImAddress);
   * ```
   */
  deleteImAddress(imAddress: ExistingImAddress): Promise<void>;

  /**
   * Updates an existing instant messaging address.
   * @platform ios
   * @param updatedImAddress - The IM address object with updated values. Must contain a valid ID.
   * @example
   * ```ts
   * const ims = await contact.getImAddresses();
   * const imToUpdate = ims[0];
   * imToUpdate.username = 'user456';
   * await contact.updateImAddress(imToUpdate);
   * ```
   */
  updateImAddress(updatedImAddress: ExistingImAddress): Promise<void>;

  /**
   * Opens the native contact editor for this contact.
   * @param options - Configuration options for the form.
   * @returns a promise resolving to `true` if changes were saved, `false` otherwise.
   */
  editWithForm(options?: FormOptions): Promise<boolean>;

  /**
   * Retrieves the full name of the contact. The shape of the full name depends on the platform.
   * This field is read-only and cannot be set directly. To modify name components, use the respective setters.
   * @returns a promise resolving to the full name string.
   * @example
   * ```ts
   * const fullName = await contact.getFullName(); // 'John Doe'
   */
  getFullName(): Promise<string>;

  /**
   * Retrieves whether the contact is marked as a favorite.
   * @platform android
   * @returns a promise resolving boolean indicating whether the contact is a favorite.
   * @example
   * ```ts
   *  const isFavourite = await contact.getIsFavourite() // true
   * ```
   */
  getIsFavourite(): Promise<boolean>;

  /**
   * Sets the favorite status of the contact.
   * @platform android
   * @param isFavourite - a boolean indicating whether to mark the contact as a favorite.
   * @returns a promise resolving to boolean indicating whether the operation was successful.
   * @example
   * ```ts
   * await contact.setIsFavourite(true);
   * ```
   */
  setIsFavourite(isFavourite: boolean): Promise<boolean>;

  /**
   * Retrieves the given name.
   * @returns a promise resolving to the given name string or `null` if not set.
   * @example
   * ```ts
   * const givenName = await contact.getGivenName(); // 'John'
   * ```
   */
  getGivenName(): Promise<string | null>;

  /**
   * Sets the given name.
   * @param givenName - The new given name string or `null` to clear it.
   * @returns a promise resolving to a boolean indicating whether the operation was successful.
   * @example
   * ```ts
   * await contact.setGivenName('Jane');
   * ```
   */
  setGivenName(givenName: string | null): Promise<boolean>;

  /**
   * Retrieves the family name.
   * @returns a promise resolving to the family name string or `null` if not set.
   * @example
   * ```ts
   * const familyName = await contact.getFamilyName(); // 'Doe'
   * ```
   */
  getFamilyName(): Promise<string | null>;

  /**
   * Sets the family name.
   * @param familyName - The new family name string or `null` to clear it.
   * @returns a promise resolving to a boolean indicating whether the operation was successful.
   * @example
   * ```ts
   * await contact.setFamilyName('Smith');
   * ```
   */
  setFamilyName(familyName: string | null): Promise<boolean>;

  /**
   * Retrieves the middle name.
   * @returns a promise resolving to the middle name string or `null` if not set.
   * @example
   * ```ts
   * const middleName = await contact.getMiddleName(); // 'Marie'
   * ```
   */
  getMiddleName(): Promise<string | null>;

  /**
   * Sets the middle name.
   * @param middleName - The new middle name string or `null` to clear it.
   * @returns a promise resolving to a boolean indicating whether the operation was successful.
   * @example
   * ```ts
   * await contact.setMiddleName('Lee');
   * ```
   */
  setMiddleName(middleName: string | null): Promise<boolean>;

  /**
   * Retrieves the maiden name.
   * @platform ios
   * @returns a promise resolving to the maiden name string or `null` if not set.
   * @example
   * ```ts
   * const maidenName = await contact.getMaidenName();
   * ```
   */
  getMaidenName(): Promise<string | null>;

  /**
   * Sets the maiden name. To set a maiden name on Android, use the `addExtraName` method with the label 'maidenname'.
   * @platform ios
   * @param maidenName - The new maiden name string or `null` to clear it.
   * @returns a promise resolving to a boolean indicating whether the operation was successful.
   * @example
   * ```ts
   * await contact.setMaidenName('Johnson');
   * ```
   */
  setMaidenName(maidenName: string | null): Promise<boolean>;

  /**
   * Retrieves the nickname.
   * @platform ios
   * @returns a promise resolving to the nickname string or `null` if not set.
   * @example
   * ```ts
   * const nickname = await contact.getNickname(); // 'Johnny'
   * ```
   */
  getNickname(): Promise<string | null>;

  /**
   * Sets the nickname. To set a nickname on Android, use the `addExtraName` method with the label 'nickname'.
   * @platform ios
   * @param nickname - The new nickname string or `null` to clear it.
   * @returns a promise resolving to a boolean indicating whether the operation was successful.
   * @example
   * ```ts
   * await contact.setNickname('Jojo');
   * ```
   */
  setNickname(nickname: string | null): Promise<boolean>;

  /**
   * Retrieves the name prefix.
   * @returns a promise resolving to the prefix string or `null` if not set.
   * @example
   * ```ts
   * const prefix = await contact.getPrefix(); // 'Dr.'
   * ```
   */
  getPrefix(): Promise<string | null>;

  /**
   * Sets the name prefix.
   * @param prefix - The new prefix string or `null` to clear it.
   * @returns a promise resolving to a boolean indicating whether the operation was successful.
   * @example
   * ```ts
   * await contact.setPrefix('Ms.');
   * ```
   */
  setPrefix(prefix: string | null): Promise<boolean>;

  /**
   * Retrieves the name suffix.
   * @returns a promise resolving to the suffix string or `null` if not set.
   * @example
   * ```ts
   * const suffix = await contact.getSuffix(); // 'Jr.'
   * ```
   */
  getSuffix(): Promise<string | null>;

  /**
   * Sets the name suffix.
   * @param suffix - The new suffix string or `null` to clear it.
   * @returns a promise resolving to a boolean indicating whether the operation was successful.
   * @example
   * ```ts
   * await contact.setSuffix('Jr.');
   * ```
   */
  setSuffix(suffix: string | null): Promise<boolean>;

  /**
   * Retrieves the phonetic representation of the given name.
   * @returns a promise resolving to the phonetic given name string or `null` if not set.
   * @example
   * ```ts
   * const phoneticGivenName = await contact.getPhoneticGivenName(); // 'Jon'
   * ```
   */
  getPhoneticGivenName(): Promise<string | null>;

  /**
   * Sets the phonetic given name.
   * @param phoneticGivenName - The new phonetic given name string or `null` to clear it.
   * @returns a promise resolving to a boolean indicating whether the operation was successful.
   * @example
   * ```ts
   * await contact.setPhoneticGivenName('Jon');
   * ```
   */
  setPhoneticGivenName(phoneticGivenName: string | null): Promise<boolean>;

  /**
   * Retrieves the phonetic representation of the middle name.
   * @returns a promise resolving to the phonetic middle name string or `null` if not set.
   * @example
   * ```ts
   * const phoneticMiddleName = await contact.getPhoneticMiddleName(); // 'Maree'
   * ```
   */
  getPhoneticMiddleName(): Promise<string | null>;

  /**
   * Sets the phonetic middle name.
   * @param phoneticMiddleName - The new phonetic middle name string or `null` to clear it.
   * @returns a promise resolving to a boolean indicating whether the operation was successful.
   * @example
   * ```ts
   * await contact.setPhoneticMiddleName('Maree');
   * ```
   */
  setPhoneticMiddleName(phoneticMiddleName: string | null): Promise<boolean>;

  /**
   * Retrieves the phonetic representation of the family name.
   * @returns a promise resolving to the phonetic family name string or `null` if not set.
   * @example
   * ```ts
   * const phoneticFamilyName = await contact.getPhoneticFamilyName(); // 'Smyth'
   * ```
   */
  getPhoneticFamilyName(): Promise<string | null>;

  /**
   * Sets the phonetic family name.
   * @param phoneticFamilyName - The new phonetic family name string or `null` to clear it.
   * @returns a promise resolving to a boolean indicating whether the operation was successful.
   * @example
   * ```ts
   * await contact.setPhoneticFamilyName('Smyth');
   * ```
   */
  setPhoneticFamilyName(phoneticFamilyName: string | null): Promise<boolean>;

  /**
   * Retrieves the company name.
   * @returns a promise resolving to the company name string or `null` if not set.
   * @example
   * ```ts
   * const company = await contact.getCompany(); // 'Example Inc.'
   * ```
   */
  getCompany(): Promise<string | null>;

  /**
   * Sets the company name.
   * @param company - The new company name string or `null` to clear it.
   * @returns a promise resolving to a boolean indicating whether the operation was successful.
   * @example
   * ```ts
   * await contact.setCompany('Example Inc.');
   * ```
   */
  setCompany(company: string | null): Promise<boolean>;

  /**
   * Retrieves the department name.
   * @returns a promise resolving to the department name string or `null` if not set.
   * @example
   * ```ts
   * const department = await contact.getDepartment(); // 'Sales'
   * ```
   */
  getDepartment(): Promise<string | null>;

  /**
   * Sets the department name.
   * @param department - The new department name string or `null` to clear it.
   * @returns a promise resolving to a boolean indicating whether the operation was successful.
   * @example
   * ```ts
   * await contact.setDepartment('Sales');
   * ```
   */
  setDepartment(department: string | null): Promise<boolean>;

  /**
   * Retrieves the job title.
   * @returns a promise resolving to the job title string or `null` if not set.
   * @example
   * ```ts
   * const jobTitle = await contact.getJobTitle(); // 'Software Engineer'
   * ```
   */
  getJobTitle(): Promise<string | null>;

  /**
   * Sets the job title.
   * @param jobTitle - The new job title string or `null` to clear it.
   * @returns a promise resolving to a boolean indicating whether the operation was successful.
   * @example
   * ```ts
   * await contact.setJobTitle('Product Manager');
   * ```
   */
  setJobTitle(jobTitle: string | null): Promise<boolean>;

  /**
   * Retrieves the phonetic representation of the company name.
   * @returns a promise resolving to the phonetic company name string or `null` if not set.
   * @example
   * ```ts
   * const phoneticCompanyName = await contact.getPhoneticCompanyName(); // 'Ekzampl Inc.'
   * ```
   */
  getPhoneticCompanyName(): Promise<string | null>;

  /**
   * Sets the phonetic company name.
   * @param phoneticCompanyName - The new phonetic company name string or `null` to clear it.
   * @returns a promise resolving to a boolean indicating whether the operation was successful.
   * @example
   * ```ts
   * await contact.setPhoneticCompanyName('Ekzampl Inc.');
   * ```
   */
  setPhoneticCompanyName(phoneticCompanyName: string | null): Promise<boolean>;

  /**
   * Retrieves the note associated with the contact.
   * > On iOS the `note` field [requires your app to request additional entitlements](https://developer.apple.com/documentation/bundleresources/entitlements/com_apple_developer_contacts_notes).
   * > The Expo Go app does not contain those entitlements, so in order to test this feature you will need to [request the entitlement from Apple](https://developer.apple.com/contact/request/contact-note-field),
   * > set the [`ios.accessesContactNotes`](./../config/app/#accessescontactnotes) field in **app config** to `true`, and [create your development build](/develop/development-builds/create-a-build/).
   * @returns a promise resolving to the note string or `null` if not set.
   * @example
   * ```ts
   * const note = await contact.getNote(); // 'Met at the conference'
   * ```
   */
  getNote(): Promise<string | null>;

  /**
   * Sets the note for the contact.
   * > On iOS the `note` field [requires your app to request additional entitlements](https://developer.apple.com/documentation/bundleresources/entitlements/com_apple_developer_contacts_notes).
   * > The Expo Go app does not contain those entitlements, so in order to test this feature you will need to [request the entitlement from Apple](https://developer.apple.com/contact/request/contact-note-field),
   * > set the [`ios.accessesContactNotes`](./../config/app/#accessescontactnotes) field in **app config** to `true`, and [create your development build](/develop/development-builds/create-a-build/).
   * @param note - The new note string or `null` to clear it.
   * @returns a promise resolving to a boolean indicating whether the operation was successful.
   * @example
   * ```ts
   * await contact.setNote('Remember to call back');
   * ```
   */
  setNote(note: string | null): Promise<boolean>;

  /**
   * Retrieves the URI of the contact's full-resolution image.
   * @returns a promise resolving to the image URI string or `null` if not set.
   * @example
   * ```ts
   * const imageUri = await contact.getImage();
   * ```
   */
  getImage(): Promise<string | null>;

  /**
   * Sets the contact's image.
   * > **Note**: If you have a remote URI, you have to download the image to a local file first.
   * @param imageUri - The local file URI to the image or `null` to remove it.
   * @returns a promise resolving to a boolean indicating whether the operation was successful.
   * @example
   * ```ts
   * await contact.setImage('file:///path/to/new/image.jpg');
   * ```
   */
  setImage(imageUri: string | null): Promise<boolean>;

  /**
   * Retrieves the URI of the contact's thumbnail image. This field is read-only and is derived from the full-resolution image.
   * @returns a promise resolving to the thumbnail URI string or `null` if not set.
   * @example
   * ```ts
   * const thumbnailUri = await contact.getThumbnail();
   * ```
   */
  getThumbnail(): Promise<string | null>;

  /**
   * Retrieves the birthday of the contact.
   * @platform ios
   * @returns a promise resolving to the ContactDate object or `null` if not set.
   * @example
   * ```ts
   * const birthday = await contact.getBirthday();
   * ```
   */
  getBirthday(): Promise<ContactDate | null>;

  /**
   * Sets the birthday of the contact. To set a birthday on Android, use the `addDate` method with the label 'birthday'.
   * @platform ios
   * @param birthday - The new ContactDate object or `null` to clear it.
   * @returns a promise resolving to a boolean indicating whether the operation was successful.
   * @example
   * ```ts
   * await contact.setBirthday({ year: '1990', month: '1', day: '1' });
   * ```
   */
  setBirthday(birthday: ContactDate | null): Promise<boolean>;

  /**
   * Retrieves the non-Gregorian birthday of the contact.
   * @platform ios
   * @returns a promise resolving to the NonGregorianBirthday object or `null` if not set.
   * @example
   * ```ts
   * const nonGregorianBirthday = await contact.getNonGregorianBirthday();
   * ```
   */
  getNonGregorianBirthday(): Promise<NonGregorianBirthday | null>;

  /**
   * Sets the non-Gregorian birthday of the contact.
   * @platform ios
   * @param nonGregorianBirthday - The new NonGregorianBirthday object or `null` to clear it.
   * @returns a promise resolving to a boolean indicating whether the operation was successful.
   * @example
   * ```ts
   * await contact.setNonGregorianBirthday({
   *    year: '2563',
   *    month: '5',
   *    day: '15',
   *    calendar: NonGregorianCalendar.buddhist
   * });
   * ```
   */
  setNonGregorianBirthday(nonGregorianBirthday: NonGregorianBirthday | null): Promise<boolean>;

  /**
   * A static method that retrieves all contacts from the address book.
   * @param options - Options to filter, sort, or limit the results.
   * @returns a promise resolving to an array of [`Contact`](#contact) instances.
   * @example
   * ```ts
   * const contacts = await Contact.getAll({
   *   sort: ContactSortOrder.FirstName,
   *   limit: 10,
   *   offset: 0,
   *   name: 'John'
   * });
   * ```
   */
  static getAll(options?: ContactQueryOptions): Promise<Contact[]>;

  /**
   * A static method that creates a new contact.
   * @param contact - The contact data to create.
   * @returns a promise resolving to the newly created [`Contact`](#contact) instance.
   * @example
   * ```ts
   * const newContactDetails: CreateContactRecord = {
   *    givenName: 'Jane',
   *    familyName: 'Doe',
   *    phones: [{ label: 'mobile', number: '+12123456789' }]
   * };
   * const newContact = await Contact.create(newContactDetails);
   * ```
   */
  static create(contact: CreateContactRecord): Promise<Contact>;

  /**
   * A static method that opens the native "Create Contact" form.
   * @param contact - Optional pre-filled data for the form.
   * @returns a promise resolving to `true` if a contact was created, `false` otherwise.
   * @example
   * ```ts
   * const wasCreated = await Contact.createWithForm({
   *   givenName: 'Jane',
   *   familyName: 'Doe'
   * });
   * ```
   */
  static presentCreateForm(contact?: CreateContactRecord): Promise<boolean>;

  /**
   * A static method that retrieves the total count of contacts in the address book.
   * @returns a promise resolving to the count of contacts.
   * @example
   * ```ts
   * const contactCount = await Contact.getCount(); // 42
   */
  static getCount(): Promise<number>;

  /**
   * A static method that checks if there are any contacts in the address book.
   * @returns a promise resolving to `true` if at least one contact exists.
   * @example
   * ```ts
   * const hasContacts = await Contact.hasAny(); // true
   * ```
   */
  static hasAny(): Promise<boolean>;

  /**
   * A static method that opens the native contact picker UI allowing the user to select a contact.
   * @returns a promise resolving to the selected [`Contact`](#contact) instance.
   * @example
   * ```ts
   * const contact = await Contact.presentPicker();
   * ```
   */
  static presentPicker(): Promise<Contact>;

  /**
   * A static method that presents a system dialog to request access to contacts if not already granted.
   * @platform ios
   * @returns a promise resolving to `true` if access is granted, `false` otherwise.
   * @example
   * ```ts
   * const accessGranted = await Contact.presentAccessPicker();
   * ```
   */
  static presentAccessPicker(): Promise<boolean>;

  /**
   * A static method that retrieves specific fields for all contacts or a subset of contacts.
   * This is an optimized method for fetching bulk data; it avoids creating full [`Contact`](#contact) instances.
   * @param fields - The list of fields to retrieve.
   * @param options - Query options to filter the contacts.
   * @returns a promise resolving to an array of partial contact details objects.
   * @example
   * ```ts
   * const allDetails = await Contact.getAllDetails(['givenName', 'phones'], {
   *   limit: 10,
   *   name: 'John'
   * });
   */
  static getAllDetails<T extends readonly ContactField[]>(
    fields: T,
    options?: ContactQueryOptions
  ): Promise<PartialContactDetails<T>[]>;

  /**
   * A static method that requests permissions to access contacts.
   * @returns a promise resolving to an object indicating if permission was granted.
   * @example
   * ```ts
   * const { granted } = await Contact.requestPermissionsAsync();
   * ```
   */
  static requestPermissionsAsync(): Promise<{ granted: boolean }>;
}
