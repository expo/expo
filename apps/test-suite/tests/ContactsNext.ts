import {
  Contact,
  ContactDetails,
  ContactField,
  Group,
  Container,
  ContactsSortOrder,
} from 'expo-contacts/next';
import { Platform } from 'react-native';
import { fetch } from 'expo/fetch';
import { Paths, File } from 'expo-file-system';
import { NonGregorianCalendar } from 'expo-contacts/src/next/types/Contact.type';

export const name = 'Contacts@Next';

export async function test(t) {
  const contacts: Contact[] = [];

  t.beforeAll(async () => {
    const permission = await Contact.requestPermissionsAsync();
    t.expect(permission.granted).toBe(true);
  });
  t.afterAll(async () => {
    for (const contact of contacts) {
      await contact.delete();
    }
  });

  t.describe('Contact creation', () => {
    t.it('should create a contact', async () => {
      const contactDetails = {
        givenName: 'Test',
        familyName: 'User',
        phones: [{ label: 'mobile', number: '123456789' }],
      };
      const newContact = await Contact.create(contactDetails);
      contacts.push(newContact);
      t.expect(newContact).toBeDefined();
      t.expect(newContact.id).toBeDefined();

      const fetchedDetails = await newContact.getDetails([
        ContactField.GIVEN_NAME,
        ContactField.FAMILY_NAME,
        ContactField.PHONES,
      ]);
      t.expect(fetchedDetails.givenName).toBe(contactDetails.givenName);
      t.expect(fetchedDetails.familyName).toBe(contactDetails.familyName);
      t.expect(fetchedDetails.phones.length).toBe(1);
      t.expect(fetchedDetails.phones[0].number).toBe(contactDetails.phones[0].number);
    });

    t.it('should create full contact details', async () => {
      const contactDetails: ContactDetails = {
        givenName: 'Full',
        middleName: 'Detail',
        familyName: 'User',
        prefix: 'Mr.',
        suffix: 'Jr.',
        nickname: 'FDUser',
        company: 'Expo',
        department: 'Engineering',
        jobTitle: 'Developer',
        phoneticFamilyName: 'Yoo-zer',
        phoneticGivenName: 'Ful-Dee',
        phoneticMiddleName: 'Tay',
        emails: [{ label: 'work', address: 'full.detail@expo.com' }],
        dates: [{ label: 'birthday', date: { year: '1990', month: '01', day: '01' } }],
        phones: [{ label: 'mobile', number: '987654321' }],
        addresses: [{ label: 'home', street: '123 Expo St', city: 'Expo City', country: 'USA' }],
        relations: [{ label: 'spouse', name: 'Partner User' }],
        urlAddresses: [{ label: 'website', url: 'https://expo.dev' }],
      };
      const newContact = await Contact.create(contactDetails);
      contacts.push(newContact);
      t.expect(newContact).toBeDefined();
      t.expect(newContact.id).toBeDefined();
      const fetchedDetails = await newContact.getDetails();
      t.expect(fetchedDetails.givenName).toBe(contactDetails.givenName);
      t.expect(fetchedDetails.middleName).toBe(contactDetails.middleName);
      t.expect(fetchedDetails.familyName).toBe(contactDetails.familyName);
      t.expect(fetchedDetails.prefix).toBe(contactDetails.prefix);
      t.expect(fetchedDetails.suffix).toBe(contactDetails.suffix);
      if (Platform.OS === 'ios') {
        t.expect(fetchedDetails.nickname).toBe(contactDetails.nickname);
      } else {
        t.expect(fetchedDetails.nickname).toBeUndefined();
      }
      t.expect(fetchedDetails.company).toBe(contactDetails.company);
      t.expect(fetchedDetails.department).toBe(contactDetails.department);
      t.expect(fetchedDetails.jobTitle).toBe(contactDetails.jobTitle);
      t.expect(fetchedDetails.phoneticFamilyName).toBe(contactDetails.phoneticFamilyName);
      t.expect(fetchedDetails.phoneticGivenName).toBe(contactDetails.phoneticGivenName);
      t.expect(fetchedDetails.phoneticMiddleName).toBe(contactDetails.phoneticMiddleName);
      t.expect(fetchedDetails.emails.length).toBe(1);
      t.expect(fetchedDetails.emails[0].address).toBe(contactDetails.emails[0].address);
      t.expect(fetchedDetails.dates.length).toBe(1);
      t.expect(fetchedDetails.dates[0].date.year).toBe(contactDetails.dates[0].date.year);
      t.expect(fetchedDetails.phones.length).toBe(1);
      t.expect(fetchedDetails.phones[0].number).toBe(contactDetails.phones[0].number);
      t.expect(fetchedDetails.addresses.length).toBe(1);
      t.expect(fetchedDetails.addresses[0].street).toBe(contactDetails.addresses[0].street);
      t.expect(fetchedDetails.relations.length).toBe(1);
      t.expect(fetchedDetails.relations[0].name).toBe(contactDetails.relations[0].name);
      t.expect(fetchedDetails.urlAddresses.length).toBe(1);
      t.expect(fetchedDetails.urlAddresses[0].url).toBe(contactDetails.urlAddresses[0].url);
    });
    t.it('should create a contact with an image', async () => {
      const url = 'https://picsum.photos/200';
      const response = await fetch(url);
      const src = new File(Paths.cache, 'file.pdf');
      src.write(await response.bytes());
      const contactDetails = {
        givenName: 'Image',
        familyName: 'User',
        image: src.uri,
      };
      const newContact = await Contact.create(contactDetails);
      contacts.push(newContact);
      t.expect(newContact).toBeDefined();
      t.expect(newContact.id).toBeDefined();
      const fetchedDetails = await newContact.getDetails([
        ContactField.GIVEN_NAME,
        ContactField.FAMILY_NAME,
        ContactField.IMAGE,
      ]);
      t.expect(fetchedDetails.givenName).toBe(contactDetails.givenName);
      t.expect(fetchedDetails.familyName).toBe(contactDetails.familyName);
      t.expect(fetchedDetails.image != null).toBe(true);
    });
  });

  t.describe('getDetails()', () => {
    const scalarFields = {
      [ContactField.GIVEN_NAME]: 'TestGivenName',
      [ContactField.MIDDLE_NAME]: 'TestMiddleName',
      [ContactField.FAMILY_NAME]: 'TestFamilyName',
      [ContactField.MAIDEN_NAME]: 'TestMaidenName',
      [ContactField.NICKNAME]: 'TestNickname',
      [ContactField.PREFIX]: 'Dr.',
      [ContactField.SUFFIX]: 'Jr.',
      [ContactField.PHONETIC_GIVEN_NAME]: 'PhoneticGiven',
      [ContactField.PHONETIC_MIDDLE_NAME]: 'PhoneticMiddle',
      [ContactField.PHONETIC_FAMILY_NAME]: 'PhoneticFamily',
      [ContactField.COMPANY]: 'Test Company',
      [ContactField.DEPARTMENT]: 'Engineering',
      [ContactField.JOB_TITLE]: 'Developer',
    };

    Object.entries(scalarFields).forEach(([key, value]) => {
      const field = key as ContactField;

      t.it(`should fetch ${field}`, async () => {
        const newContact = await Contact.create({ [field]: value });
        contacts.push(newContact);

        const fetchedDetails = await newContact.getDetails([field]);

        t.expect(fetchedDetails[field]).toBe(value);
      });
    });

    const listFields = {
      [ContactField.EMAILS]: [{ label: 'work', address: 'test@example.com' }],
      [ContactField.PHONES]: [{ label: 'mobile', number: '123456789' }],
      [ContactField.ADDRESSES]: [
        {
          label: 'home',
          street: 'Main St',
          city: 'City',
          country: 'Country',
          region: 'Region',
          postcode: '12345',
        },
      ],
      [ContactField.DATES]: [{ label: 'birthday', date: { day: '01', month: '01', year: '2000' } }],
      [ContactField.URL_ADDRESSES]: [{ label: 'blog', url: 'https://example.com' }],
      [ContactField.IM_ADDRESSES]: [{ label: 'skype', service: 'Skype', username: 'user123' }],
      [ContactField.SOCIAL_PROFILES]: [
        {
          label: 'twitter',
          service: 'Twitter',
          username: '@user',
          url: 'https://twitter.com/user',
          userId: '123',
        },
      ],
      [ContactField.RELATIONS]: [{ label: 'mother', name: 'Jane Doe' }],
    };

    Object.entries(listFields).forEach(([key, value]) => {
      const field = key as ContactField;

      t.it(`should fetch ${field}`, async () => {
        const newContact = await Contact.create({ [field]: value });
        contacts.push(newContact);

        const fetchedDetails = await newContact.getDetails([field]);

        const inputItem = value[0];
        const fetchedItem = fetchedDetails[field][0];

        t.expect(fetchedDetails[field].length).toBe(1);

        Object.keys(inputItem).forEach((prop) => {
          if (prop === 'date') {
            t.expect(fetchedItem.date).toBeDefined();
            t.expect(fetchedItem.date.year).toBe(inputItem.date.year);
            t.expect(fetchedItem.date.month).toBe(inputItem.date.month);
            t.expect(fetchedItem.date.day).toBe(inputItem.date.day);
          } else {
            t.expect(fetchedItem[prop]).toBe(inputItem[prop]);
          }
        });
      });
    });
  });
  t.describe('.getAll()', () => {
    t.it('.getAll() should fetch all contacts', async () => {
      const allContacts = await Contact.getAll();
      t.expect(allContacts).toBeDefined();
      t.expect(Array.isArray(allContacts)).toBe(true);
    });

    t.it('.getAll({limit}) should fetch correct number of contacts', async () => {
      const limit = 2;
      const limitedContacts = await Contact.getAll({ limit });
      t.expect(limitedContacts).toBeDefined();
      t.expect(Array.isArray(limitedContacts)).toBe(true);
      t.expect(limitedContacts.length).toBeLessThanOrEqual(limit);
    });

    t.it('.getAll({offset}) should skip correct number of contacts', async () => {
      const allContacts = await Contact.getAll();
      const offset = 2;
      const offsetContacts = await Contact.getAll({ offset });
      t.expect(offsetContacts).toBeDefined();
      t.expect(Array.isArray(offsetContacts)).toBe(true);
      t.expect(offsetContacts[0].id).toBe(allContacts[offset].id);
    });
  });

  t.describe('Fetch contacts', () => {
    t.it('should fetch all contacts', async () => {
      const contacts = await Contact.getAll();
      t.expect(contacts).toBeDefined();
      t.expect(Array.isArray(contacts)).toBe(true);
    });

    t.it('should fetch by name', async () => {
      const contactDetails = {
        givenName: 'NameFilter',
        familyName: 'Tester',
      };
      const otherContactDetails = {
        givenName: 'Other',
        familyName: 'Person',
      };

      const newContact = await Contact.create(contactDetails);
      const otherContact = await Contact.create(otherContactDetails);
      contacts.push(newContact);
      contacts.push(otherContact);
      const fetchedContacts = await Contact.getAll({ name: 'NameFilter' });

      t.expect(fetchedContacts.length).toBeGreaterThan(0);
      const fetchedContact = fetchedContacts.find((c) => c.id === newContact.id);
      const notFetchedContact = fetchedContacts.find((c) => c.id === otherContact.id);
      t.expect(fetchedContact).toBeDefined();
      t.expect(notFetchedContact).toBeUndefined();
    });

    t.it('should fetch contact details', async () => {
      const contactDetails = {
        givenName: 'Detail',
        familyName: 'Fetcher',
      };
      const newContact = await Contact.create(contactDetails);
      contacts.push(newContact);
      const fetchedDetails = await newContact.getDetails([
        ContactField.GIVEN_NAME,
        ContactField.FAMILY_NAME,
      ]);
      t.expect(fetchedDetails.givenName).toBe(contactDetails.givenName);
      t.expect(fetchedDetails.familyName).toBe(contactDetails.familyName);
    });

    t.it('should fetch contact emails and phones', async () => {
      const contactDetails = {
        givenName: 'Info',
        familyName: 'Fetcher',
        emails: [{ label: 'work', address: 'info@fetcher.com' }],
        phones: [{ label: 'mobile', number: '123456789' }],
      };

      const newContact = await Contact.create(contactDetails);
      contacts.push(newContact);
      const fetchedDetails = await newContact.getDetails([
        ContactField.GIVEN_NAME,
        ContactField.FAMILY_NAME,
        ContactField.EMAILS,
        ContactField.PHONES,
      ]);
      t.expect(fetchedDetails.givenName).toBe(contactDetails.givenName);
      t.expect(fetchedDetails.familyName).toBe(contactDetails.familyName);
      t.expect(fetchedDetails.emails.length).toBe(1);
      t.expect(fetchedDetails.emails[0].address).toBe(contactDetails.emails[0].address);
      t.expect(fetchedDetails.phones.length).toBe(1);
      t.expect(fetchedDetails.phones[0].number).toBe(contactDetails.phones[0].number);
    });

    t.it('should fetch all contacts with details', async () => {
      const contactDetails1 = {
        givenName: 'AllDetails1',
        emails: [{ label: 'work', address: 'all@details.com' }],
      };
      const contactDetails2 = {
        givenName: 'AllDetails2',
        relations: [{ label: 'spouse', name: 'Partner' }],
      };
      const newContact1 = await Contact.create(contactDetails1);
      contacts.push(newContact1);
      const newContact2 = await Contact.create(contactDetails2);
      contacts.push(newContact2);
      const allContacts = await Contact.getAllDetails([
        ContactField.GIVEN_NAME,
        ContactField.EMAILS,
        ContactField.RELATIONS,
      ]);
      const fetchedContact1 = allContacts.find((c) => c.id === newContact1.id);
      const fetchedContact2 = allContacts.find((c) => c.id === newContact2.id);
      t.expect(fetchedContact1).toBeDefined();
      t.expect(fetchedContact1.emails.length).toBe(1);
      t.expect(fetchedContact1.emails[0].address).toBe(contactDetails1.emails[0].address);
      t.expect(fetchedContact1.relations.length).toBe(0);
      t.expect(fetchedContact2).toBeDefined();
      t.expect(fetchedContact2.relations.length).toBe(1);
      t.expect(fetchedContact2.emails.length).toBe(0);
      t.expect(fetchedContact2.relations[0].name).toBe(contactDetails2.relations[0].name);
    });
  });

  t.describe('Set, Get properties', () => {
    let contact: Contact;

    t.beforeAll(async () => {
      const contactDetails = {
        givenName: 'Name',
        familyName: 'Tester',
      };
      contact = await Contact.create(contactDetails);
      t.expect(contact.id).toBeDefined();
    });

    t.afterAll(async () => {
      await contact.delete();
    });

    t.it('should set and get givenName', async () => {
      const newGivenName = 'John';
      await contact.setGivenName(newGivenName);
      const retrievedGivenName = await contact.getGivenName();
      t.expect(retrievedGivenName).toBe(newGivenName);
    });

    t.it('should set and get familyName', async () => {
      const newFamilyName = 'Doe';
      await contact.setFamilyName(newFamilyName);
      const retrievedFamilyName = await contact.getFamilyName();
      t.expect(retrievedFamilyName).toBe(newFamilyName);
    });

    t.it('should set and get middleName', async () => {
      const newMiddleName = 'Robert';
      await contact.setMiddleName(newMiddleName);
      const retrievedMiddleName = await contact.getMiddleName();
      t.expect(retrievedMiddleName).toBe(newMiddleName);
    });

    if (Platform.OS === 'ios') {
      t.it('should set and get maidenName', async () => {
        const newMaidenName = 'Smith';
        await contact.setMaidenName(newMaidenName);
        const retrievedMaidenName = await contact.getMaidenName();
        t.expect(retrievedMaidenName).toBe(newMaidenName);
      });

      t.it('should set and get nickname', async () => {
        const newNickname = 'Johnny';
        await contact.setNickname(newNickname);
        const retrievedNickname = await contact.getNickname();
        t.expect(retrievedNickname).toBe(newNickname);
      });
    }

    t.it('should set and get prefix', async () => {
      const newPrefix = 'Dr.';
      await contact.setPrefix(newPrefix);
      const retrievedPrefix = await contact.getPrefix();
      t.expect(retrievedPrefix).toBe(newPrefix);
    });

    t.it('should set and get suffix', async () => {
      const newSuffix = 'Jr.';
      await contact.setSuffix(newSuffix);
      const retrievedSuffix = await contact.getSuffix();
      t.expect(retrievedSuffix).toBe(newSuffix);
    });

    t.it('should set and get phoneticGivenName', async () => {
      const newPhoneticGivenName = 'Jon';
      await contact.setPhoneticGivenName(newPhoneticGivenName);
      const retrievedPhoneticGivenName = await contact.getPhoneticGivenName();
      t.expect(retrievedPhoneticGivenName).toBe(newPhoneticGivenName);
    });

    t.it('should set and get phoneticMiddleName', async () => {
      const newPhoneticMiddleName = 'Rob-ert';
      await contact.setPhoneticMiddleName(newPhoneticMiddleName);
      const retrievedPhoneticMiddleName = await contact.getPhoneticMiddleName();
      t.expect(retrievedPhoneticMiddleName).toBe(newPhoneticMiddleName);
    });

    t.it('should set and get phoneticFamilyName', async () => {
      const newPhoneticFamilyName = 'Doh';
      await contact.setPhoneticFamilyName(newPhoneticFamilyName);
      const retrievedPhoneticFamilyName = await contact.getPhoneticFamilyName();
      t.expect(retrievedPhoneticFamilyName).toBe(newPhoneticFamilyName);
    });

    t.it('should handle setting a field to null', async () => {
      const middleName = 'InitialMiddle';
      await contact.setMiddleName(middleName);
      let retrieved = await contact.getMiddleName();
      t.expect(retrieved).toBe(middleName);

      await contact.setMiddleName(null);
      retrieved = await contact.getMiddleName();
      t.expect(retrieved).toBeNull();
    });
    t.it('should set and get company', async () => {
      const newCompany = 'Expo';
      await contact.setCompany(newCompany);
      const retrievedCompany = await contact.getCompany();
      t.expect(retrievedCompany).toBe(newCompany);
    });

    t.it('should set and get department', async () => {
      const newDepartment = 'Engineering';
      await contact.setDepartment(newDepartment);
      const retrievedDepartment = await contact.getDepartment();
      t.expect(retrievedDepartment).toBe(newDepartment);
    });

    t.it('should set and get jobTitle', async () => {
      const newJobTitle = 'Software Developer';
      await contact.setJobTitle(newJobTitle);
      const retrievedJobTitle = await contact.getJobTitle();
      t.expect(retrievedJobTitle).toBe(newJobTitle);
    });

    t.it('should set and get phoneticCompanyName', async () => {
      const newPhoneticName = 'Eks-po';
      await contact.setPhoneticCompanyName(newPhoneticName);
      const retrievedPhoneticName = await contact.getPhoneticCompanyName();
      t.expect(retrievedPhoneticName).toBe(newPhoneticName);
    });

    t.it('should set and get image', async () => {
      const url = 'https://picsum.photos/200';
      const response = await fetch(url);
      const src = new File(Paths.cache, 'file.pdf');
      src.write(await response.bytes());

      await contact.setImage(src.uri);
      const retrievedImage = await contact.getImage();
      const retrievedThumbnail = await contact.getThumbnail();
      t.expect(retrievedThumbnail != null).toBe(true);
      t.expect(retrievedImage != null).toBe(true);
    });

    // A Note property requires an additional permission on iOS which is not avaiable in bare-expo
    if (Platform.OS !== 'ios') {
      t.it('should set and get note', async () => {
        const newNotes = 'These are some notes.';
        await contact.setNote(newNotes);
        const retrievedNotes = await contact.getNote();
        t.expect(retrievedNotes).toBe(newNotes);
      });
    }

    if (Platform.OS === 'ios') {
      const calendarsToTest = [
        { type: NonGregorianCalendar.buddhist, name: 'buddhist', year: '2567' },
        { type: NonGregorianCalendar.chinese, name: 'chinese', year: '1' },
        { type: NonGregorianCalendar.coptic, name: 'coptic', year: '1740' },
        {
          type: NonGregorianCalendar.ethiopicAmeteMihret,
          name: 'ethiopicAmeteMihret',
          year: '2016',
        },
        { type: NonGregorianCalendar.ethiopicAmeteAlem, name: 'ethiopicAmeteAlem', year: '7516' },
        { type: NonGregorianCalendar.hebrew, name: 'hebrew', year: '5784' },
        { type: NonGregorianCalendar.indian, name: 'indian', year: '1945' },
        { type: NonGregorianCalendar.islamic, name: 'islamic', year: '1445' },
        { type: NonGregorianCalendar.islamicCivil, name: 'islamicCivil', year: '1445' },
        { type: NonGregorianCalendar.japanese, name: 'japanese', year: '6' },
        { type: NonGregorianCalendar.persian, name: 'persian', year: '1403' },
        { type: NonGregorianCalendar.republicOfChina, name: 'republicOfChina', year: '113' },
      ];

      calendarsToTest.forEach((calendarCase) => {
        t.it(`should set and get ${calendarCase.name} nonGregorianBirthday`, async () => {
          const birthday = { year: calendarCase.year, month: '3', day: '15' };

          await contact.setNonGregorianBirthday({
            ...birthday,
            calendar: calendarCase.type,
          });

          const retrievedBirthday = await contact.getNonGregorianBirthday();

          t.expect(retrievedBirthday.calendar).toBe(calendarCase.type);

          t.expect(retrievedBirthday.year).toBe(birthday.year);
          t.expect(retrievedBirthday.month).toBe(birthday.month);
          t.expect(retrievedBirthday.day).toBe(birthday.day);
        });
      });
    }

    t.it('should handle setting an organization field to null', async () => {
      const company = 'Initial Organization';
      await contact.setCompany(company);
      let retrieved = await contact.getCompany();
      t.expect(retrieved).toBe(company);

      await contact.setCompany(null);
      retrieved = await contact.getCompany();
      t.expect(retrieved).toBeNull();
    });
  });

  t.describe('Add, Get, Update, Delete list properties', () => {
    let contact: Contact;
    t.beforeAll(async () => {
      const contactDetails = {
        givenName: 'List',
        familyName: 'Tester',
      };
      contact = await Contact.create(contactDetails);
    });

    t.afterAll(async () => {
      await contact.delete();
    });

    t.it('should add, get, update, and delete emails', async () => {
      const emailId = await contact.addEmail({ label: 'work', address: 'work@example.com' });
      t.expect(emailId).not.toBeNull();
      let emails = await contact.getEmails();
      t.expect(emails.length).toBe(1);
      t.expect(emails[0].id).toBe(emailId);

      await contact.updateEmail({
        id: emailId,
        label: 'work-updated',
        address: 'work-updated@example.com',
      });
      emails = await contact.getEmails();
      t.expect(emails[0].label).toBe('work-updated');
      t.expect(emails[0].address).toBe('work-updated@example.com');
      await contact.deleteEmail(emails[0]);
      emails = await contact.getEmails();
      t.expect(emails.length).toBe(0);
    });

    t.it('should add, get, update, and delete phones', async () => {
      const phoneId = await contact.addPhone({ label: 'mobile', number: '123456789' });
      let phones = await contact.getPhones();
      t.expect(phones.length).toBe(1);
      t.expect(phones[0].id).toBe(phoneId);

      await contact.updatePhone({ id: phoneId, label: 'mobile-updated', number: '987654321' });
      phones = await contact.getPhones();
      t.expect(phones[0].label).toBe('mobile-updated');
      t.expect(phones[0].number).toBe('987654321');

      await contact.deletePhone(phones[0]);
      phones = await contact.getPhones();
      t.expect(phones.length).toBe(0);
    });

    t.it('should add, get, update, and delete dates', async () => {
      const dateId = await contact.addDate({
        label: 'birthday',
        date: {
          year: '1991',
          month: '02',
          day: '02',
        },
      });
      t.expect(dateId).toBeDefined();
      let dates = await contact.getDates();
      t.expect(dates.length).toBe(1);
      t.expect(dates[0].id).toBe(dateId);

      await contact.updateDate({
        id: dateId,
        label: 'birthday-updated',
        date: {
          year: '1991',
          month: '02',
          day: '02',
        },
      });
      dates = await contact.getDates();
      t.expect(dates[0].label).toBe('birthday-updated');
      t.expect(dates[0].date.year).toBe('1991');
      t.expect(dates[0].date.month).toBe('02');
      t.expect(dates[0].date.day).toBe('02');
      await contact.deleteDate(dates[0]);
      dates = await contact.getDates();
      t.expect(dates.length).toBe(0);
    });

    t.it('should add, get, update, and delete addresses', async () => {
      const postalAddressId = await contact.addAddress({
        label: 'home',
        street: '123 Main St',
        city: 'Springfield',
        postcode: '12345',
        country: 'USA',
      });
      let addresses = await contact.getAddresses();
      t.expect(addresses.length).toBe(1);
      t.expect(addresses[0].id).toBe(postalAddressId);

      await contact.updateAddress({
        id: postalAddressId,
        label: 'home-updated',
        street: '456 Oak St',
        city: 'Shelbyville',
        postcode: '54321',
        country: 'USA',
      });
      addresses = await contact.getAddresses();
      t.expect(addresses[0].label).toBe('home-updated');
      t.expect(addresses[0].street).toBe('456 Oak St');

      await contact.deleteAddress(addresses[0]);
      addresses = await contact.getAddresses();
      t.expect(addresses.length).toBe(0);
    });

    t.it('should add, get, update, and delete relationships', async () => {
      const relationshipId = await contact.addRelation({ label: 'spouse', name: 'Jane Doe' });
      let relationships = await contact.getRelations();
      t.expect(relationships.length).toBe(1);
      t.expect(relationships[0].id).toBe(relationshipId);

      await contact.updateRelation({
        id: relationshipId,
        label: 'partner',
        name: 'Jane Smith',
      });
      relationships = await contact.getRelations();
      t.expect(relationships[0].label).toBe('partner');
      t.expect(relationships[0].name).toBe('Jane Smith');

      await contact.deleteRelation(relationships[0]);
      relationships = await contact.getRelations();
      t.expect(relationships.length).toBe(0);
    });

    t.it('should add, get, update, and delete URL addresses', async () => {
      const urlId = await contact.addUrlAddress({ label: 'website', url: 'https://example.com' });
      let urls = await contact.getUrlAddresses();
      t.expect(urls.length).toBe(1);
      t.expect(urls[0].id).toBe(urlId);

      await contact.updateUrlAddress({
        id: urlId,
        label: 'website-updated',
        url: 'https://updated.com',
      });
      urls = await contact.getUrlAddresses();
      t.expect(urls[0].label).toBe('website-updated');
      t.expect(urls[0].url).toBe('https://updated.com');

      await contact.deleteUrlAddress(urls[0]);
      urls = await contact.getUrlAddresses();
      t.expect(urls.length).toBe(0);
    });
  });

  t.describe('Contact patch', () => {
    t.it('should update structuredName fields correctly', async () => {
      const contactDetails = {
        givenName: 'InitialGiven',
        middleName: 'InitialMiddle',
        familyName: 'InitialFamily',
      };
      const newContact = await Contact.create(contactDetails);
      contacts.push(newContact);

      await newContact.patch({
        givenName: 'UpdatedGiven',
        familyName: null,
      });

      const givenName = await newContact.getGivenName();
      const middleName = await newContact.getMiddleName();
      const familyName = await newContact.getFamilyName();

      t.expect(givenName).toBe('UpdatedGiven');
      t.expect(middleName).toBe('InitialMiddle');
      t.expect(familyName).toBe(null);
    });

    t.it('should update organization fields correctly', async () => {
      const contactDetails = {
        company: 'InitialCompany',
        department: 'InitialDepartment',
        jobTitle: 'InitialJobTitle',
      };
      const newContact = await Contact.create(contactDetails);
      contacts.push(newContact);

      await newContact.patch({
        company: 'UpdatedCompany',
        jobTitle: null,
      });

      const company = await newContact.getCompany();
      const department = await newContact.getDepartment();
      const jobTitle = await newContact.getJobTitle();
      t.expect(company).toBe('UpdatedCompany');
      t.expect(department).toBe('InitialDepartment');
      t.expect(jobTitle).toBe(null);
    });

    t.it('should update an existing email and add a new one', async () => {
      const contactDetails = {
        givenName: 'Email',
        familyName: 'User',
        emails: [{ label: 'work', address: 'work@example.com' }],
      };
      const newContact = await Contact.create(contactDetails);
      contacts.push(newContact);
      const emails = await newContact.getEmails();

      const emailId = emails[0].id;
      await newContact.patch({
        emails: [
          { id: emailId, address: 'work_updated@example.com' },
          { label: 'personal', address: 'personal_updated@example.com' },
        ],
      });
      const updatedEmails = await newContact.getEmails();
      t.expect(updatedEmails.length).toBe(2);
      t.expect(updatedEmails.some((e) => e.id === emailId)).toBe(true);
      t.expect(updatedEmails.some((e) => e.label === 'work')).toBe(true);
      t.expect(updatedEmails.some((e) => e.address === 'work_updated@example.com')).toBe(true);
      t.expect(updatedEmails.some((e) => e.address === 'personal_updated@example.com')).toBe(true);
      t.expect(updatedEmails.some((e) => e.address === 'work@example.com')).toBe(false);
    });

    t.it('should clear emails if patch is called with null', async () => {
      const contactDetails = {
        givenName: 'Email',
        familyName: 'User',
        emails: [{ label: 'work', address: 'work@example.com' }],
      };
      const newContact = await Contact.create(contactDetails);
      contacts.push(newContact);
      await newContact.getEmails();
      await newContact.patch({
        emails: null,
      });
      const updatedEmails = await newContact.getEmails();
      t.expect(updatedEmails.length).toBe(0);
    });

    t.it('should update an existing phone and add a new one', async () => {
      const contactDetails = {
        givenName: 'Phone',
        familyName: 'User',
        phones: [{ label: 'work', number: '123456789' }],
      };
      const newContact = await Contact.create(contactDetails);
      contacts.push(newContact);

      const phones = await newContact.getPhones();
      await newContact.patch({
        phones: [
          { ...phones[0], number: '+48987654321' },
          { label: 'personal', number: '+48111222333' },
        ],
      });

      const updatedPhones = await newContact.getPhones();
      t.expect(updatedPhones.length).toBe(2);
      t.expect(updatedPhones.some((p) => p.number === '+48987654321')).toBe(true);
      t.expect(updatedPhones.some((p) => p.number === '+48111222333')).toBe(true);
      t.expect(updatedPhones.some((p) => p.number === '123456789')).toBe(false);
    });

    t.it('should clear phones if patch is called with null', async () => {
      const contactDetails = {
        givenName: 'Phone',
        familyName: 'User',
        phones: [{ label: 'work', number: '123456789' }],
      };
      const newContact = await Contact.create(contactDetails);
      contacts.push(newContact);
      await newContact.getPhones();
      await newContact.patch({
        phones: null,
      });
      const updatedPhones = await newContact.getPhones();
      t.expect(updatedPhones.length).toBe(0);
    });

    t.it('should update an existing date and add a new one', async () => {
      const contactDetails = {
        givenName: 'Date',
        familyName: 'User',
        dates: [
          {
            label: 'birthday',
            date: {
              year: '1990',
              month: '01',
              day: '01',
            },
          },
        ],
      };

      const newContact = await Contact.create(contactDetails);
      contacts.push(newContact);

      const dates = await newContact.getDates();
      await newContact.patch({
        dates: [
          {
            ...dates[0],
            date: {
              year: '1991',
              month: '01',
              day: '01',
            },
          },
          {
            label: 'anniversary',
            date: {
              year: '2020',
              month: '01',
              day: '01',
            },
          },
        ],
      });

      const updatedDates = await newContact.getDates();
      t.expect(updatedDates.length).toBe(2);
      t.expect(updatedDates.some((d) => d.date.year === '1991')).toBe(true);
      t.expect(updatedDates.some((d) => d.date.year === '2020')).toBe(true);
      t.expect(updatedDates.some((d) => d.date.year === '1990')).toBe(false);
    });

    t.it('should clear dates if patch is called with null', async () => {
      const contactDetails = {
        givenName: 'Date',
        familyName: 'User',
        dates: [
          {
            label: 'birthday',
            date: {
              year: '1990',
              month: '01',
              day: '01',
            },
          },
        ],
      };
      const newContact = await Contact.create(contactDetails);
      contacts.push(newContact);
      await newContact.getDates();
      await newContact.patch({
        dates: null,
      });
      const updatedDates = await newContact.getDates();
      t.expect(updatedDates.length).toBe(0);
    });

    if (Platform.OS === 'android') {
      t.it('should update an existing extraName and add a new one', async () => {
        const contactDetails = {
          givenName: 'Extra',
          familyName: 'User',
          extraNames: [{ label: 'nickname', name: 'Tester' }],
        };
        const newContact = await Contact.create(contactDetails);
        contacts.push(newContact);

        const extraNames = await newContact.getExtraNames();
        await newContact.patch({
          extraNames: [
            { ...extraNames[0], name: 'TesterUpdated' },
            { label: 'alias', name: 'ExtraAlias' },
          ],
        });

        const updatedExtraNames = await newContact.getExtraNames();
        t.expect(updatedExtraNames.length).toBe(2);
        t.expect(updatedExtraNames.some((n) => n.name === 'TesterUpdated')).toBe(true);
        t.expect(updatedExtraNames.some((n) => n.name === 'ExtraAlias')).toBe(true);
        t.expect(updatedExtraNames.some((n) => n.name === 'Tester')).toBe(false);
      });

      t.it('should clear extraNames if patch is called with null', async () => {
        const contactDetails = {
          givenName: 'Extra',
          familyName: 'User',
          extraNames: [{ label: 'nickname', name: 'Tester' }],
        };
        const newContact = await Contact.create(contactDetails);
        contacts.push(newContact);
        await newContact.getExtraNames();
        await newContact.patch({
          extraNames: null,
        });
        const updatedExtraNames = await newContact.getExtraNames();
        t.expect(updatedExtraNames.length).toBe(0);
      });
    }

    t.it('should update an existing address and add a new one', async () => {
      const contactDetails = {
        givenName: 'Postal',
        familyName: 'User',
        addresses: [
          {
            label: 'home',
            street: '123 Main St',
            city: 'Warsaw',
            region: 'Mazowieckie',
            postcode: '00-001',
            country: 'Poland',
          },
        ],
      };
      const newContact = await Contact.create(contactDetails);
      contacts.push(newContact);

      const addresses = await newContact.getAddresses();
      await newContact.patch({
        addresses: [
          { ...addresses[0], street: '456 Updated St' },
          {
            label: 'work',
            street: 'Office St 1',
            city: 'Krakow',
            region: 'Malopolskie',
            postcode: '30-001',
            country: 'Poland',
          },
        ],
      });

      const updatedAddresses = await newContact.getAddresses();
      t.expect(updatedAddresses.length).toBe(2);
      t.expect(updatedAddresses.some((a) => a.street === '456 Updated St')).toBe(true);
      t.expect(updatedAddresses.some((a) => a.street === 'Office St 1')).toBe(true);
      t.expect(updatedAddresses.some((a) => a.street === '123 Main St')).toBe(false);
    });

    t.it('should clear addresses if patch is called with null', async () => {
      const contactDetails = {
        givenName: 'Postal',
        familyName: 'User',
        addresses: [
          {
            label: 'home',
            street: '123 Main St',
            city: 'Warsaw',
            region: 'Mazowieckie',
            postcode: '00-001',
            country: 'Poland',
          },
        ],
      };
      const newContact = await Contact.create(contactDetails);
      contacts.push(newContact);
      await newContact.getAddresses();
      await newContact.patch({
        addresses: null,
      });
      const updatedAddresses = await newContact.getAddresses();
      t.expect(updatedAddresses.length).toBe(0);
    });

    t.it('should update an existing relationship and add a new one', async () => {
      const contactDetails = {
        givenName: 'Relation',
        familyName: 'User',
        relations: [{ label: 'spouse', name: 'Alice' }],
      };
      const newContact = await Contact.create(contactDetails);
      contacts.push(newContact);

      const relations = await newContact.getRelations();
      await newContact.patch({
        relations: [
          { ...relations[0], name: 'AliceUpdated' },
          { label: 'child', name: 'Bob' },
        ],
      });

      const updatedRelations = await newContact.getRelations();
      t.expect(updatedRelations.length).toBe(2);
      t.expect(updatedRelations.some((r) => r.name === 'AliceUpdated')).toBe(true);
      t.expect(updatedRelations.some((r) => r.name === 'Bob')).toBe(true);
      t.expect(updatedRelations.some((r) => r.name === 'Alice')).toBe(false);
    });

    t.it('should clear relationships if patch is called with null', async () => {
      const contactDetails = {
        givenName: 'Relation',
        familyName: 'User',
        relationships: [{ label: 'spouse', name: 'Alice' }],
      };
      const newContact = await Contact.create(contactDetails);
      contacts.push(newContact);
      await newContact.getRelations();
      await newContact.patch({
        relations: null,
      });
      const updatedRelations = await newContact.getRelations();
      t.expect(updatedRelations.length).toBe(0);
    });

    t.it('should update an existing website and add a new one', async () => {
      const contactDetails = {
        givenName: 'Web',
        familyName: 'User',
        urlAddresses: [{ label: 'personal', url: 'https://example.com' }],
      };
      const newContact = await Contact.create(contactDetails);
      contacts.push(newContact);

      const urls = await newContact.getUrlAddresses();
      await newContact.patch({
        urlAddresses: [
          { ...urls[0], url: 'https://updated.example.com' },
          { label: 'work', url: 'https://work.example.com' },
        ],
      });

      const updatedUrls = await newContact.getUrlAddresses();
      t.expect(updatedUrls.length).toBe(2);
      t.expect(updatedUrls.some((u) => u.url === 'https://updated.example.com')).toBe(true);
      t.expect(updatedUrls.some((u) => u.url === 'https://work.example.com')).toBe(true);
      t.expect(updatedUrls.some((u) => u.url === 'https://example.com')).toBe(false);
    });

    t.it('should clear websites if patch is called with null', async () => {
      const contactDetails = {
        givenName: 'Web',
        familyName: 'User',
        urlAddresses: [{ label: 'personal', url: 'https://example.com' }],
      };
      const newContact = await Contact.create(contactDetails);
      contacts.push(newContact);
      await newContact.getUrlAddresses();
      await newContact.patch({
        urlAddresses: null,
      });
      const updatedUrls = await newContact.getUrlAddresses();
      t.expect(updatedUrls.length).toBe(0);
    });
    t.it(
      'should handle a comprehensive patch updating all field types simultaneously',
      async () => {
        const initialContactDetails = {
          givenName: 'InitialGiven',
          familyName: 'InitialFamily',
          company: 'InitialCompany',
          jobTitle: 'InitialJob',
          emails: [{ label: 'work', address: 'work@example.com' }],
          phones: [{ label: 'work', number: '111222333' }],
          dates: [{ label: 'birthday', date: { year: '1990', month: '01', day: '01' } }],
          extraNames: [{ label: 'nickname', name: 'InitialNickname' }],
          addresses: [
            {
              label: 'home',
              street: '123 Initial St',
              city: 'Warsaw',
              country: 'Poland',
            },
          ],
          relations: [{ label: 'spouse', name: 'InitialSpouse' }],
          urlAddresses: [{ label: 'homepage', url: 'https://initial.example.com' }],
        };

        const newContact = await Contact.create(initialContactDetails);
        contacts.push(newContact);

        const initialEmails = await newContact.getEmails();
        const initialPhones = await newContact.getPhones();
        const initialDates = await newContact.getDates();
        let initialExtraNames = [];
        if (Platform.OS === 'android') {
          initialExtraNames = await newContact.getExtraNames();
        }
        const initialAddresses = await newContact.getAddresses();
        const initialUrls = await newContact.getUrlAddresses();

        await newContact.patch({
          givenName: 'UpdatedGiven',
          middleName: 'NewMiddleName',
          familyName: null,

          company: 'UpdatedCompany',
          jobTitle: null,

          emails: [
            { ...initialEmails[0], address: 'work_updated@example.com' },
            { label: 'personal', address: 'personal_new@example.com' },
          ],

          phones: [
            { ...initialPhones[0], number: '+48999888777' },
            { label: 'mobile', number: '+48555444333' },
          ],

          dates: [
            { ...initialDates[0], date: { year: '1991', month: '02', day: '02' } },
            { label: 'anniversary', date: { year: '2021', month: '10', day: '10' } },
          ],

          extraNames: [
            { ...initialExtraNames[0], name: 'UpdatedNickname' },
            { label: 'alias', name: 'NewAlias' },
          ],

          addresses: [
            { ...initialAddresses[0], street: '456 Updated St' },
            { label: 'work', street: '987 Work Ave', city: 'Krakow', country: 'Poland' },
          ],

          relations: null,

          urlAddresses: [
            { ...initialUrls[0], url: 'https://updated.example.com' },
            { label: 'work', url: 'https://work.example.com' },
          ],
        });

        const updatedContact = await newContact.getDetails();

        t.expect(updatedContact.givenName).toBe('UpdatedGiven');
        t.expect(updatedContact.middleName).toBe('NewMiddleName');
        t.expect(updatedContact.familyName).toBe(null);

        t.expect(updatedContact.company).toBe('UpdatedCompany');
        t.expect(updatedContact.jobTitle).toBe(null);

        const updatedEmails = await newContact.getEmails();
        t.expect(updatedEmails.length).toBe(2);
        t.expect(updatedEmails.some((e) => e.address === 'work_updated@example.com')).toBe(true);
        t.expect(updatedEmails.some((e) => e.address === 'personal_new@example.com')).toBe(true);

        const updatedPhones = await newContact.getPhones();
        t.expect(updatedPhones.length).toBe(2);
        t.expect(updatedPhones.some((p) => p.number === '+48999888777')).toBe(true);
        t.expect(updatedPhones.some((p) => p.number === '+48555444333')).toBe(true);

        const updatedDates = await newContact.getDates();
        t.expect(updatedDates.length).toBe(2);
        t.expect(updatedDates.some((d) => d.date.year === '1991')).toBe(true);
        t.expect(updatedDates.some((d) => d.date.year === '2021')).toBe(true);

        if (Platform.OS === 'android') {
          const updatedExtraNames = await newContact.getExtraNames();
          t.expect(updatedExtraNames.length).toBe(2);
          t.expect(updatedExtraNames.some((n) => n.name === 'UpdatedNickname')).toBe(true);
          t.expect(updatedExtraNames.some((n) => n.name === 'NewAlias')).toBe(true);
        }

        const updatedAddresses = await newContact.getAddresses();
        t.expect(updatedAddresses.length).toBe(2);
        t.expect(updatedAddresses.some((a) => a.street === '456 Updated St')).toBe(true);
        t.expect(updatedAddresses.some((a) => a.street === '987 Work Ave')).toBe(true);

        const updatedRelations = await newContact.getRelations();
        t.expect(updatedRelations.length).toBe(0);

        const updatedUrls = await newContact.getUrlAddresses();
        t.expect(updatedUrls.length).toBe(2);
        t.expect(updatedUrls.some((u) => u.url === 'https://updated.example.com')).toBe(true);
        t.expect(updatedUrls.some((u) => u.url === 'https://work.example.com')).toBe(true);
      }
    );
  });

  if (Platform.OS === 'ios') {
    t.describe('Group management', () => {
      let testGroup: Group;
      let testContact: Contact;

      t.beforeAll(async () => {
        testContact = await Contact.create({
          givenName: 'Group',
          familyName: 'Member',
        });
        testGroup = await Group.create('Initial Group');
        contacts.push(testContact);
      });

      t.it('should create a group and retrieve its name, then delete the group', async () => {
        const name = 'Test Expo Group';
        const group = await Group.create(name);

        t.expect(group).toBeDefined();
        t.expect(group.id).toBeDefined();

        const retrievedName = await group.getName();
        t.expect(retrievedName).toBe(name);
        await group.delete();
      });

      t.it('should retrieve all groups', async () => {
        const allGroups = await Group.getAll();
        t.expect(Array.isArray(allGroups)).toBe(true);
        t.expect(allGroups.some((g) => g.id === testGroup.id)).toBe(true);
      });

      t.it('should rename a group', async () => {
        const newName = 'Updated Expo Group';
        await testGroup.setName(newName);

        const retrievedName = await testGroup.getName();
        t.expect(retrievedName).toBe(newName);
      });

      t.it('should add and remove a contact from a group', async () => {
        await testGroup.addContact(testContact);
        let members = await testGroup.getContacts();
        await testGroup.removeContact(testContact);
        members = await testGroup.getContacts();
        t.expect(members.some((c) => c.id === testContact.id)).toBe(false);
      });

      t.it('should delete a group', async () => {
        const groupToDelete = await Group.create('Delete Me');
        const idToDelete = groupToDelete.id;

        await groupToDelete.delete();

        const fetchedGroup = await Group.getAll();
        t.expect(fetchedGroup.some((g) => g.id === idToDelete)).toBe(false);
      });
    });
    t.describe('Container management', () => {
      let createdContact: Contact;
      let createdGroup: Group;

      t.afterAll(async () => {
        if (createdContact) await createdContact.delete();
        if (createdGroup) await createdGroup.delete();
      });

      t.it('should retrieve the default container', async () => {
        const defaultContainer = await Container.getDefault();
        t.expect(defaultContainer).toBeDefined();
        t.expect(defaultContainer?.id).toBeDefined();
      });

      t.it('should retrieve all containers', async () => {
        const containers = await Container.getAll();
        t.expect(Array.isArray(containers)).toBe(true);
        t.expect(containers.length).toBeGreaterThan(0);
      });

      t.it('should get container properties (name, type)', async () => {
        const defaultContainer = await Container.getDefault();
        if (defaultContainer) {
          const name = await defaultContainer.getName();
          const type = await defaultContainer.getType();
          t.expect(type).toBeDefined();
        }
      });

      t.it('should retrieve contacts belonging to the default container', async () => {
        const defaultContainer = await Container.getDefault();

        if (defaultContainer) {
          createdContact = await Contact.create({
            givenName: 'Container',
            familyName: 'TestContact',
          });

          const contactsInContainer = await defaultContainer.getContacts();

          t.expect(Array.isArray(contactsInContainer)).toBe(true);
          t.expect(contactsInContainer.some((c) => c.id === createdContact.id)).toBe(true);
        }
      });

      t.it('should retrieve groups belonging to the default container', async () => {
        const defaultContainer = await Container.getDefault();

        if (defaultContainer) {
          createdGroup = await Group.create('Container Test Group', defaultContainer.id);

          const groupsInContainer = await defaultContainer.getGroups();

          t.expect(Array.isArray(groupsInContainer)).toBe(true);
          t.expect(groupsInContainer.some((g) => g.id === createdGroup.id)).toBe(true);
        }
      });
    });
  }
  t.describe('Group', () => {
    let testGroup: Group;
    let testContact: Contact;
    let groups: Group[] = [];

    t.beforeAll(async () => {
      testContact = await Contact.create({
        givenName: 'Group',
        familyName: 'Member',
      });
      testGroup = await Group.create('Initial Group');
      contacts.push(testContact);
    });

    t.afterAll(async () => {
      for (const group of groups) {
        await group.delete();
      }
    });
    t.it('.getContacts() should return contacts in the group', async () => {
      const group = await Group.create('Test Group for GetContacts');
      groups.push(group);
      const contact1 = await Contact.create({ givenName: 'Alice', familyName: 'Smith' });
      const contact2 = await Contact.create({ givenName: 'Bob', familyName: 'Johnson' });
      contacts.push(contact1, contact2);

      await group.addContact(contact1);
      await group.addContact(contact2);

      const contactsInGroup = await group.getContacts();
      t.expect(contactsInGroup.length).toBe(2);
      t.expect(contactsInGroup.some((c) => c.id === contact1.id)).toBe(true);
      t.expect(contactsInGroup.some((c) => c.id === contact2.id)).toBe(true);
    });
    t.it('.getContacts({name: string} should correctly filter contacts by name)', async () => {
      const groupName = 'Friends';
      const group = await Group.create(groupName);
      groups.push(group);
      const contactWithSearchedName = await Contact.create({
        givenName: 'Group',
        familyName: 'Contact',
      });
      const contactWithoutSearchedName = await Contact.create({
        givenName: 'Other',
        familyName: 'Person',
      });
      contacts.push(contactWithoutSearchedName);
      contacts.push(contactWithSearchedName);
      await group.addContact(testContact);

      const contactsInGroup = await group.getContacts({ name: 'Group' });
      t.expect(contactsInGroup.length).toBeGreaterThan(0);
      t.expect(contactsInGroup.some((c) => c.id === testContact.id)).toBe(true);
      t.expect(contactsInGroup.some((c) => c.id === contactWithSearchedName.id)).toBe(false);
    });

    t.it(
      '.getContacts({limit: number}) should correctly limit the number of returned contacts',
      async () => {
        const group = await Group.create('Limited Contacts Group');
        groups.push(group);
        const contactA = await Contact.create({ givenName: 'ContactA', familyName: 'LastA' });
        const contactB = await Contact.create({ givenName: 'ContactB', familyName: 'LastB' });
        const contactC = await Contact.create({ givenName: 'ContactC', familyName: 'LastC' });
        contacts.push(contactA, contactB, contactC);

        await group.addContact(contactA);
        await group.addContact(contactB);
        await group.addContact(contactC);

        const limitedContacts = await group.getContacts({ limit: 2 });
        t.expect(limitedContacts.length).toBe(2);
      }
    );

    t.it(
      '.getContacts({offset: number}) should correctly offset the returned contacts',
      async () => {
        const group = await Group.create('Offset Contacts Group');
        groups.push(group);
        const contact1 = await Contact.create({ givenName: 'Contact1', familyName: 'Last1' });
        const contact2 = await Contact.create({ givenName: 'Contact2', familyName: 'Last2' });
        const contact3 = await Contact.create({ givenName: 'Contact3', familyName: 'Last3' });
        contacts.push(contact1, contact2, contact3);

        await group.addContact(contact1);
        await group.addContact(contact2);
        await group.addContact(contact3);

        const allContacts = await group.getContacts();
        const offsetContacts = await group.getContacts({ offset: 1 });
        t.expect(offsetContacts.length).toBe(allContacts.length - 1);
        t.expect(offsetContacts.some((c) => c.id === contact1.id)).toBe(false);
      }
    );

    t.it('.getContacts({limit, offset}) should correctly limit and offset contacts', async () => {
      const group = await Group.create('Limit and Offset Contacts Group');
      groups.push(group);
      const contactX = await Contact.create({ givenName: 'ContactX', familyName: 'LastX' });
      const contactY = await Contact.create({ givenName: 'ContactY', familyName: 'LastY' });
      const contactZ = await Contact.create({ givenName: 'ContactZ', familyName: 'LastZ' });
      contacts.push(contactX, contactY, contactZ);

      await group.addContact(contactX);

      await group.addContact(contactY);

      await group.addContact(contactZ);
      const limitedOffsetContacts = await group.getContacts({ limit: 1, offset: 1 });
      t.expect(limitedOffsetContacts.length).toBe(1);
      t.expect(limitedOffsetContacts[0].id).toBe(contactY.id);
    });

    t.it(
      '.getContacts({sortOrder: ContactsSortOrder.GivenName}) should correctly sort contacts',
      async () => {
        const group = await Group.create('Sorted Contacts Group');
        groups.push(group);
        const contactA = await Contact.create({ givenName: 'Anna', familyName: 'Zephyr' });
        const contactB = await Contact.create({ givenName: 'Brian', familyName: 'Young' });
        const contactC = await Contact.create({ givenName: 'Charlie', familyName: 'Xander' });
        contacts.push(contactA, contactB, contactC);

        await group.addContact(contactA);
        await group.addContact(contactB);
        await group.addContact(contactC);

        const sortedContactsAsc = await group.getContacts({
          sortOrder: ContactsSortOrder.GivenName,
        });
        t.expect(sortedContactsAsc[0].id).toBe(contactA.id);
        t.expect(sortedContactsAsc[1].id).toBe(contactB.id);
        t.expect(sortedContactsAsc[2].id).toBe(contactC.id);
      }
    );

    t.it(
      '.getContacts({sortOrder: ContactsSortOrder.FamilyName}) should correctly sort contacts',
      async () => {
        const group = await Group.create('Sorted Contacts by Family Name Group');
        groups.push(group);
        const contactD = await Contact.create({ givenName: 'David', familyName: 'Anderson' });
        const contactE = await Contact.create({ givenName: 'Eve', familyName: 'Brown' });
        const contactF = await Contact.create({ givenName: 'Frank', familyName: 'Clark' });
        contacts.push(contactD, contactE, contactF);

        await group.addContact(contactD);
        await group.addContact(contactE);
        await group.addContact(contactF);

        const sortedContactsAsc = await group.getContacts({
          sortOrder: ContactsSortOrder.FamilyName,
        });

        t.expect(sortedContactsAsc[0].id).toBe(contactD.id);
        t.expect(sortedContactsAsc[1].id).toBe(contactE.id);
        t.expect(sortedContactsAsc[2].id).toBe(contactF.id);
      }
    );
    t.it(
      '.getContacts(ContactsQueryOptions) with all the options should work correctly',
      async () => {
        const group = await Group.create('Comprehensive Options Group');
        groups.push(group);
        const contact1 = await Contact.create({ givenName: 'Aaron', familyName: 'Smith' });
        const contact2 = await Contact.create({ givenName: 'Betty', familyName: 'Johnson' });
        const contact3 = await Contact.create({ givenName: 'Catherine', familyName: 'Williams' });
        contacts.push(contact1, contact2, contact3);

        await group.addContact(contact1);
        await group.addContact(contact2);
        await group.addContact(contact3);

        const queriedContacts = await group.getContacts({
          name: 'a',
          limit: 1,
          offset: 1,
          sortOrder: ContactsSortOrder.GivenName,
        });

        t.expect(queriedContacts.length).toBe(1);
        t.expect(queriedContacts[0].id).toBe(contact3.id);
      }
    );

    t.it('.create() should returns an object with id', async () => {
      const name = 'Test Expo Group';
      const group = await Group.create(name);

      t.expect(group).toBeDefined();
      t.expect(group.id).toBeDefined();
    });

    t.it('.getName() should retrieve the group name', async () => {
      const name = await testGroup.getName();
      t.expect(name).toBe('Initial Group');
    });

    t.it('.getAll() should retrieve all groups', async () => {
      const allGroups = await Group.getAll();
      t.expect(Array.isArray(allGroups)).toBe(true);
      t.expect(allGroups.some((g) => g.id === testGroup.id)).toBe(true);
    });

    t.it('.setName() should update the group name', async () => {
      const newName = 'Updated Expo Group';
      await testGroup.setName(newName);

      const retrievedName = await testGroup.getName();
      t.expect(retrievedName).toBe(newName);
    });

    t.it(
      '.addContact() and .removeContact() should add and remove a contact from a group',
      async () => {
        await testGroup.addContact(testContact);
        let contactsInGroup = await testGroup.getContacts();
        t.expect(contactsInGroup.some((c) => c.id === testContact.id)).toBe(true);

        await testGroup.removeContact(testContact);
        contactsInGroup = await testGroup.getContacts();
        t.expect(contactsInGroup.some((c) => c.id === testContact.id)).toBe(false);
      }
    );

    t.it('.delete() should delete a group', async () => {
      const groupToDelete = await Group.create('Delete Me');
      const idToDelete = groupToDelete.id;

      await groupToDelete.delete();
      const allGroups = await Group.getAll();
      t.expect(allGroups.some((g) => g.id === idToDelete)).toBe(false);
      t.expect(allGroups.length).toBeGreaterThan(0);
    });
  });
}
