import { fetch } from 'expo/fetch';
import {
  Contact,
  NonGregorianCalendar,
  ContactField,
  Group,
  Container,
  ContactsSortOrder,
} from 'expo-contacts/next';
import { Paths, File } from 'expo-file-system';
import { Platform } from 'react-native';

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
      const contactDetails = {
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
        dates: [{ label: 'birthday', date: { year: 1990, month: 1, day: 1 } }],
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
    t.it('.getDetails(ContactField.IS_FAVOURITE) should return isFavorite correctly', async () => {
      const newContact = await Contact.create({ givenName: 'FavTest', isFavourite: true });
      contacts.push(newContact);
      const fetchedDetails = await newContact.getDetails([ContactField.IS_FAVOURITE]);
      if (Platform.OS === 'android') {
        t.expect(fetchedDetails.isFavourite).toBe(true);
      } else {
        t.expect(fetchedDetails.isFavourite).toBeUndefined();
      }
    });

    t.it('.getDetails(ContactField.FULL_NAME) should return full name correctly', async () => {
      const valueGiven = 'TestFull';
      const newContact = await Contact.create({
        givenName: valueGiven,
        familyName: 'TestFullFamilyName',
      });
      contacts.push(newContact);
      const fetchedDetails = await newContact.getDetails([ContactField.FULL_NAME]);
      t.expect(fetchedDetails.fullName).toContain(valueGiven);
    });

    t.it(
      '.getDetails(ContactField.FULL_NAME, ContactField.PHONES) should return full name correctly if phones are not present',
      async () => {
        const valueGiven = 'TestFull';
        const newContact = await Contact.create({
          givenName: valueGiven,
          familyName: 'TestFullFamilyName',
        });
        contacts.push(newContact);
        const fetchedDetails = await newContact.getDetails([
          ContactField.FULL_NAME,
          ContactField.PHONES,
        ]);
        t.expect(fetchedDetails.fullName).toContain(valueGiven);
      }
    );

    t.it('.getDetails(ContactField.GIVEN_NAME) should return given name correctly', async () => {
      const value = 'TestGivenName';
      const newContact = await Contact.create({ givenName: value });
      contacts.push(newContact);

      const fetchedDetails = await newContact.getDetails([ContactField.GIVEN_NAME]);
      t.expect(fetchedDetails.givenName).toBe(value);
    });

    t.it('.getDetails(ContactField.MIDDLE_NAME) should return middle name correctly', async () => {
      const value = 'TestMiddleName';
      const newContact = await Contact.create({ middleName: value });
      contacts.push(newContact);

      const fetchedDetails = await newContact.getDetails([ContactField.MIDDLE_NAME]);
      t.expect(fetchedDetails.middleName).toBe(value);
    });

    t.it('.getDetails(ContactField.FAMILY_NAME) should return family name correctly', async () => {
      const value = 'TestFamilyName';
      const newContact = await Contact.create({ familyName: value });
      contacts.push(newContact);

      const fetchedDetails = await newContact.getDetails([ContactField.FAMILY_NAME]);
      t.expect(fetchedDetails.familyName).toBe(value);
    });

    t.it('.getDetails(ContactField.MAIDEN_NAME) should return maiden name correctly', async () => {
      const value = 'TestMaidenName';
      const newContact = await Contact.create({ maidenName: value });
      contacts.push(newContact);

      const fetchedDetails = await newContact.getDetails([ContactField.MAIDEN_NAME]);
      if (Platform.OS === 'ios') {
        t.expect(fetchedDetails.maidenName).toBe(value);
      } else {
        t.expect(fetchedDetails.maidenName).toBeUndefined();
      }
    });

    if (Platform.OS === 'ios') {
      t.it('.getDetails(ContactField.NICKNAME) should return nickname correctly', async () => {
        const value = 'TestNickname';
        const newContact = await Contact.create({ nickname: value });
        contacts.push(newContact);

        const fetchedDetails = await newContact.getDetails([ContactField.NICKNAME]);
        t.expect(fetchedDetails.nickname).toBe(value);
      });
    }

    t.it('.getDetails(ContactField.PREFIX) should return prefix correctly', async () => {
      const value = 'Dr.';
      const newContact = await Contact.create({ prefix: value });
      contacts.push(newContact);

      const fetchedDetails = await newContact.getDetails([ContactField.PREFIX]);
      t.expect(fetchedDetails.prefix).toBe(value);
    });

    t.it('.getDetails(ContactField.SUFFIX) should return suffix correctly', async () => {
      const value = 'Jr.';
      const newContact = await Contact.create({ suffix: value });
      contacts.push(newContact);

      const fetchedDetails = await newContact.getDetails([ContactField.SUFFIX]);
      t.expect(fetchedDetails.suffix).toBe(value);
    });

    t.it(
      '.getDetails(ContactField.PHONETIC_GIVEN_NAME) should return phonetic given name correctly',
      async () => {
        const value = 'PhoneticGiven';
        const newContact = await Contact.create({ phoneticGivenName: value });
        contacts.push(newContact);

        const fetchedDetails = await newContact.getDetails([ContactField.PHONETIC_GIVEN_NAME]);
        t.expect(fetchedDetails.phoneticGivenName).toBe(value);
      }
    );

    t.it(
      '.getDetails(ContactField.PHONETIC_MIDDLE_NAME) should return phonetic middle name correctly',
      async () => {
        const value = 'PhoneticMiddle';
        const newContact = await Contact.create({ phoneticMiddleName: value });
        contacts.push(newContact);

        const fetchedDetails = await newContact.getDetails([ContactField.PHONETIC_MIDDLE_NAME]);
        t.expect(fetchedDetails.phoneticMiddleName).toBe(value);
      }
    );

    t.it(
      '.getDetails(ContactField.PHONETIC_FAMILY_NAME) should return phonetic family name correctly',
      async () => {
        const value = 'PhoneticFamily';
        const newContact = await Contact.create({ phoneticFamilyName: value });
        contacts.push(newContact);

        const fetchedDetails = await newContact.getDetails([ContactField.PHONETIC_FAMILY_NAME]);
        t.expect(fetchedDetails.phoneticFamilyName).toBe(value);
      }
    );

    t.it('.getDetails(ContactField.COMPANY) should return company correctly', async () => {
      const value = 'Test Company';
      const newContact = await Contact.create({ company: value });
      contacts.push(newContact);

      const fetchedDetails = await newContact.getDetails([ContactField.COMPANY]);
      t.expect(fetchedDetails.company).toBe(value);
    });

    t.it('.getDetails(ContactField.DEPARTMENT) should return department correctly', async () => {
      const value = 'Engineering';
      const newContact = await Contact.create({ department: value });
      contacts.push(newContact);

      const fetchedDetails = await newContact.getDetails([ContactField.DEPARTMENT]);
      t.expect(fetchedDetails.department).toBe(value);
    });

    t.it('.getDetails(ContactField.JOB_TITLE) should return job title correctly', async () => {
      const value = 'Developer';
      const newContact = await Contact.create({ jobTitle: value });
      contacts.push(newContact);

      const fetchedDetails = await newContact.getDetails([ContactField.JOB_TITLE]);
      t.expect(fetchedDetails.jobTitle).toBe(value);
    });

    t.it('.getDetails(ContactField.EMAILS) should return emails correctly', async () => {
      const value = [{ label: 'work', address: 'test@example.com' }];
      const newContact = await Contact.create({ emails: value });
      contacts.push(newContact);

      const fetchedDetails = await newContact.getDetails([ContactField.EMAILS]);
      const fetchedItem = fetchedDetails.emails[0];

      t.expect(fetchedDetails.emails.length).toBe(1);
      t.expect(fetchedItem.label).toBe(value[0].label);
      t.expect(fetchedItem.address).toBe(value[0].address);
    });

    t.it('.getDetails(ContactField.PHONES) should return phones correctly', async () => {
      const value = [{ label: 'mobile', number: '123456789' }];
      const newContact = await Contact.create({ phones: value });
      contacts.push(newContact);

      const fetchedDetails = await newContact.getDetails([ContactField.PHONES]);
      const fetchedItem = fetchedDetails.phones[0];

      t.expect(fetchedDetails.phones.length).toBe(1);
      t.expect(fetchedItem.label).toBe(value[0].label);
      t.expect(fetchedItem.number).toBe(value[0].number);
    });

    t.it('.getDetails(ContactField.ADDRESSES) should return addresses correctly', async () => {
      const value = [
        {
          label: 'home',
          street: 'Main St',
          city: 'City',
          country: 'Country',
          region: 'Region',
          postcode: '12345',
        },
      ];
      const newContact = await Contact.create({ addresses: value });
      contacts.push(newContact);

      const fetchedDetails = await newContact.getDetails([ContactField.ADDRESSES]);
      const fetchedItem = fetchedDetails.addresses[0];

      t.expect(fetchedDetails.addresses.length).toBe(1);
      t.expect(fetchedItem.label).toBe(value[0].label);
      t.expect(fetchedItem.street).toBe(value[0].street);
      t.expect(fetchedItem.city).toBe(value[0].city);
      t.expect(fetchedItem.country).toBe(value[0].country);
      t.expect(fetchedItem.region).toBe(value[0].region);
      t.expect(fetchedItem.postcode).toBe(value[0].postcode);
    });

    t.it('.getDetails(ContactField.DATES) should return dates correctly', async () => {
      const value = [{ label: 'birthday', date: { day: 1, month: 1, year: 2000 } }];
      const newContact = await Contact.create({ dates: value });
      contacts.push(newContact);

      const fetchedDetails = await newContact.getDetails([ContactField.DATES]);
      const fetchedItem = fetchedDetails.dates[0];

      t.expect(fetchedDetails.dates.length).toBe(1);
      t.expect(fetchedItem.label).toBe(value[0].label);
      t.expect(fetchedItem.date).toBeDefined();
      t.expect(fetchedItem.date.year).toBe(value[0].date.year);
      t.expect(fetchedItem.date.month).toBe(value[0].date.month);
      t.expect(fetchedItem.date.day).toBe(value[0].date.day);
    });

    t.it(
      '.getDetails(ContactField.URL_ADDRESSES) should return url addresses correctly',
      async () => {
        const value = [{ label: 'blog', url: 'https://example.com' }];
        const newContact = await Contact.create({ urlAddresses: value });
        contacts.push(newContact);

        const fetchedDetails = await newContact.getDetails([ContactField.URL_ADDRESSES]);
        const fetchedItem = fetchedDetails.urlAddresses[0];

        t.expect(fetchedDetails.urlAddresses.length).toBe(1);
        t.expect(fetchedItem.label).toBe(value[0].label);
        t.expect(fetchedItem.url).toBe(value[0].url);
      }
    );

    if (Platform.OS === 'ios') {
      t.it(
        '.getDetails(ContactField.IM_ADDRESSES) should return im addresses correctly',
        async () => {
          const value = [{ label: 'skype', service: 'Skype', username: 'user123' }];
          const newContact = await Contact.create({ imAddresses: value });
          contacts.push(newContact);

          const fetchedDetails = await newContact.getDetails([ContactField.IM_ADDRESSES]);
          const fetchedItem = fetchedDetails.imAddresses[0];

          t.expect(fetchedDetails.imAddresses.length).toBe(1);
          t.expect(fetchedItem.label).toBe(value[0].label);
          t.expect(fetchedItem.service).toBe(value[0].service);
          t.expect(fetchedItem.username).toBe(value[0].username);
        }
      );
    }

    if (Platform.OS === 'ios') {
      t.it(
        '.getDetails(ContactField.SOCIAL_PROFILES) should return social profiles correctly',
        async () => {
          const value = [
            {
              label: 'twitter',
              service: 'Twitter',
              username: '@user',
              url: 'https://twitter.com/user',
              userId: '123',
            },
          ];
          const newContact = await Contact.create({ socialProfiles: value });
          contacts.push(newContact);

          const fetchedDetails = await newContact.getDetails([ContactField.SOCIAL_PROFILES]);
          const fetchedItem = fetchedDetails.socialProfiles[0];

          t.expect(fetchedDetails.socialProfiles.length).toBe(1);
          t.expect(fetchedItem.label).toBe(value[0].label);
          t.expect(fetchedItem.service).toBe(value[0].service);
          t.expect(fetchedItem.username).toBe(value[0].username);
          t.expect(fetchedItem.url).toBe(value[0].url);
          t.expect(fetchedItem.userId).toBe(value[0].userId);
        }
      );
    }

    t.it('.getDetails(ContactField.RELATIONS) should return relations correctly', async () => {
      const value = [{ label: 'mother', name: 'Jane Doe' }];
      const newContact = await Contact.create({ relations: value });
      contacts.push(newContact);

      const fetchedDetails = await newContact.getDetails([ContactField.RELATIONS]);
      const fetchedItem = fetchedDetails.relations[0];

      t.expect(fetchedDetails.relations.length).toBe(1);
      t.expect(fetchedItem.label).toBe(value[0].label);
      t.expect(fetchedItem.name).toBe(value[0].name);
    });
  });

  t.describe('.getAll()', () => {
    t.it('.getAll() should fetch all contacts', async () => {
      const allContacts = await Contact.getAll();
      t.expect(allContacts).toBeDefined();
      t.expect(Array.isArray(allContacts)).toBe(true);
    });

    t.it('.getAll({name}) should fetch all contacts with name filter', async () => {
      const andrewContacts = await Contact.create({ givenName: 'Andrew', familyName: 'Tester' });
      const otherContacts = await Contact.create({ givenName: 'Bob', familyName: 'Tester' });
      contacts.push(andrewContacts);
      contacts.push(otherContacts);
      const allContacts = await Contact.getAll({ name: 'andrew' });
      t.expect(allContacts).toBeDefined();
      t.expect(Array.isArray(allContacts)).toBe(true);
      const fetchedContact = allContacts.find((c) => c.id === andrewContacts.id);
      const notFetchedContact = allContacts.find((c) => c.id === otherContacts.id);
      t.expect(fetchedContact).toBeDefined();
      t.expect(notFetchedContact).toBeUndefined();
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

    t.it('.getAll({sortOrder: FamilyName}) should return contacts in correct order', async () => {
      const contactA = await Contact.create({ givenName: 'Alice', familyName: 'Zephyr' });
      const contactB = await Contact.create({ givenName: 'Bob', familyName: 'Yellow' });
      const contactC = await Contact.create({ givenName: 'Charlie', familyName: 'Xavier' });
      contacts.push(contactA);
      contacts.push(contactB);
      contacts.push(contactC);
      const sortedContacts = await Contact.getAll({ sortOrder: ContactsSortOrder.FamilyName });
      t.expect(sortedContacts).toBeDefined();
      t.expect(Array.isArray(sortedContacts)).toBe(true);
      const indices = [
        sortedContacts.findIndex((c) => c.id === contactC.id),
        sortedContacts.findIndex((c) => c.id === contactB.id),
        sortedContacts.findIndex((c) => c.id === contactA.id),
      ];
      t.expect(indices[0]).toBeLessThan(indices[1]);
      t.expect(indices[1]).toBeLessThan(indices[2]);
    });

    t.it('.getAll({sortOrder: GivenName}) should return contacts in correct order', async () => {
      const contactA = await Contact.create({ givenName: 'Alice', familyName: 'Zephyr' });
      const contactB = await Contact.create({ givenName: 'Bob', familyName: 'Yellow' });
      const contactC = await Contact.create({ givenName: 'Charlie', familyName: 'Xavier' });
      contacts.push(contactA);
      contacts.push(contactB);
      contacts.push(contactC);
      const sortedContacts = await Contact.getAll({ sortOrder: ContactsSortOrder.GivenName });
      t.expect(sortedContacts).toBeDefined();
      t.expect(Array.isArray(sortedContacts)).toBe(true);
      const indices = [
        sortedContacts.findIndex((c) => c.id === contactC.id),
        sortedContacts.findIndex((c) => c.id === contactB.id),
        sortedContacts.findIndex((c) => c.id === contactA.id),
      ];
      t.expect(indices[2]).toBeLessThan(indices[1]);
      t.expect(indices[1]).toBeLessThan(indices[0]);
    });

    t.it(
      '.getAll(All options) should fetch contacts with correct limit, offset and sort',
      async () => {
        const uniqueTag = `Test_${Date.now()}`;

        const contactA = await Contact.create({
          givenName: 'Alice',
          familyName: `AA_${uniqueTag}`,
        });
        const contactB = await Contact.create({
          givenName: 'Bob',
          familyName: `BB_${uniqueTag}`,
        });
        const contactC = await Contact.create({
          givenName: 'Charlie',
          familyName: `CC_${uniqueTag}`,
        });

        contacts.push(contactA, contactB, contactC);

        const allContacts = await Contact.getAll({
          name: uniqueTag,
          limit: 2,
          offset: 1,
          sortOrder: ContactsSortOrder.FamilyName,
        });

        t.expect(allContacts).toBeDefined();
        t.expect(Array.isArray(allContacts)).toBe(true);
        t.expect(allContacts.length).toBe(2);

        t.expect(allContacts.find((c) => c.id === contactA.id)).toBeUndefined();

        const foundB = allContacts.find((c) => c.id === contactB.id);
        const foundC = allContacts.find((c) => c.id === contactC.id);

        t.expect(foundB).toBeDefined();
        t.expect(foundC).toBeDefined();

        const indexB = allContacts.findIndex((c) => c.id === contactB.id);
        const indexC = allContacts.findIndex((c) => c.id === contactC.id);

        t.expect(indexB).toBeLessThan(indexC);
      }
    );
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

  t.describe('.getAllDetails()', () => {
    t.it('.getAllDetails() should fetch specific fields', async () => {
      const result = await Contact.getAllDetails([
        ContactField.GIVEN_NAME,
        ContactField.FAMILY_NAME,
      ]);
      t.expect(Array.isArray(result)).toBe(true);
    });

    t.it('.getAllDetails({name}) should filter contacts', async () => {
      const tag = `Filter_${Date.now()}`;
      contacts.push(await Contact.create({ givenName: tag, familyName: 'Test' }));

      const result = await Contact.getAllDetails([ContactField.GIVEN_NAME], { name: tag });

      t.expect(result.length).toBeGreaterThan(0);
      result.forEach((c) => t.expect(c.givenName).toContain(tag));
    });

    t.it('.getAllDetails({limit}) should respect limit', async () => {
      contacts.push(await Contact.create({ givenName: 'L1', familyName: 'T' }));
      contacts.push(await Contact.create({ givenName: 'L2', familyName: 'T' }));

      const limit = 1;
      const result = await Contact.getAllDetails([ContactField.FAMILY_NAME], { limit });

      t.expect(result.length).toBeLessThanOrEqual(limit);
    });

    t.it('.getAllDetails({offset}) should skip contacts', async () => {
      for (let i = 0; i < 4; i++) {
        contacts.push(await Contact.create({ givenName: `Off_${i}`, familyName: 'T' }));
      }

      const base = await Contact.getAllDetails([ContactField.FAMILY_NAME], {
        limit: 5,
        sortOrder: ContactsSortOrder.GivenName,
      });

      if (base.length >= 3) {
        const offsetResult = await Contact.getAllDetails([ContactField.FAMILY_NAME], {
          offset: 2,
          sortOrder: ContactsSortOrder.GivenName,
        });
        t.expect(offsetResult[0].familyName).toBe(base[2].familyName);
      }
    });

    t.it('.getAllDetails({sortOrder: FamilyName}) should sort ascending', async () => {
      contacts.push(await Contact.create({ givenName: 'A', familyName: 'A_Fam' }));
      contacts.push(await Contact.create({ givenName: 'B', familyName: 'Z_Fam' }));

      const result = await Contact.getAllDetails([ContactField.FAMILY_NAME], {
        limit: 2,
        sortOrder: ContactsSortOrder.FamilyName,
      });

      for (let i = 0; i < result.length - 1; i++) {
        const current = result[i].familyName;
        const next = result[i + 1].familyName;
        t.expect(current.toLowerCase().localeCompare(next.toLowerCase())).toBeLessThanOrEqual(0);
      }
    });

    t.it('.getAllDetails({sortOrder: GivenName}) should sort ascending', async () => {
      contacts.push(await Contact.create({ givenName: 'A_Giv', familyName: 'T' }));
      contacts.push(await Contact.create({ givenName: 'Z_Giv', familyName: 'T' }));

      const result = await Contact.getAllDetails([ContactField.GIVEN_NAME], {
        limit: 2,
        sortOrder: ContactsSortOrder.GivenName,
      });

      for (let i = 0; i < result.length - 1; i++) {
        const current = result[i].givenName;
        const next = result[i + 1].givenName;
        if (!current || !next) {
          continue;
        }
        t.expect(current.toLowerCase().localeCompare(next.toLowerCase())).toBeLessThanOrEqual(0);
      }
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

    if (Platform.OS === 'android') {
      t.it('.get/set IsFavourite()', async () => {
        await contact.setIsFavourite(true);
        const isFavourite = await contact.getIsFavourite();
        t.expect(isFavourite).toBe(true);
        await contact.setIsFavourite(false);
        const isNotFavourite = await contact.getIsFavourite();
        t.expect(isNotFavourite).toBe(false);
      });
    }

    t.it('.getFullName(), ', async () => {
      const newGivenName = 'John';
      await contact.setGivenName(newGivenName);
      const fullName = await contact.getFullName();
      t.expect(fullName).toContain(newGivenName);

      const newFamilyName = 'Doe';
      await contact.setFamilyName(newFamilyName);
      const updatedFullName = await contact.getFullName();
      t.expect(updatedFullName).toBe(`${newGivenName} ${newFamilyName}`);
    });

    t.it('.get/set GivenName()', async () => {
      const newGivenName = 'John';
      await contact.setGivenName(newGivenName);
      const retrievedGivenName = await contact.getGivenName();
      t.expect(retrievedGivenName).toBe(newGivenName);
      await contact.setGivenName(null);
      const nullGivenName = await contact.getGivenName();
      t.expect(nullGivenName).toBeNull();
    });

    t.it('.get/set FamilyName()', async () => {
      const newFamilyName = 'Doe';
      await contact.setFamilyName(newFamilyName);
      const retrievedFamilyName = await contact.getFamilyName();
      t.expect(retrievedFamilyName).toBe(newFamilyName);
      await contact.setFamilyName(null);
      const nullFamilyName = await contact.getFamilyName();
      t.expect(nullFamilyName).toBeNull();
    });

    t.it('.get/set MiddleName()', async () => {
      const newMiddleName = 'Robert';
      await contact.setMiddleName(newMiddleName);
      const retrievedMiddleName = await contact.getMiddleName();
      t.expect(retrievedMiddleName).toBe(newMiddleName);
      await contact.setMiddleName(null);
      const nullMiddleName = await contact.getMiddleName();
      t.expect(nullMiddleName).toBeNull();
    });

    if (Platform.OS === 'ios') {
      t.it('.get/set MaidenName()', async () => {
        const newMaidenName = 'Smith';
        await contact.setMaidenName(newMaidenName);
        const retrievedMaidenName = await contact.getMaidenName();
        t.expect(retrievedMaidenName).toBe(newMaidenName);
        await contact.setMaidenName(null);
        const nullMaidenName = await contact.getMaidenName();
        t.expect(nullMaidenName).toBeNull();
      });

      t.it('.get/set Nickname()', async () => {
        const newNickname = 'Johnny';
        await contact.setNickname(newNickname);
        const retrievedNickname = await contact.getNickname();
        t.expect(retrievedNickname).toBe(newNickname);
        await contact.setNickname(null);
        const nullNickname = await contact.getNickname();
        t.expect(nullNickname).toBeNull();
      });

      t.it('.get/set Birthday()', async () => {
        const newBirthday = { day: 15, month: 6, year: 1990 };
        await contact.setBirthday(newBirthday);
        const retrievedBirthday = await contact.getBirthday();
        t.expect(retrievedBirthday).toEqual(newBirthday);
        await contact.setBirthday(null);
        const nullBirthday = await contact.getBirthday();
        t.expect(nullBirthday).toBeNull();
      });
    }

    t.it('.get/set Prefix()', async () => {
      const newPrefix = 'Dr.';
      await contact.setPrefix(newPrefix);
      const retrievedPrefix = await contact.getPrefix();
      t.expect(retrievedPrefix).toBe(newPrefix);
      await contact.setPrefix(null);
      const nullPrefix = await contact.getPrefix();
      t.expect(nullPrefix).toBeNull();
    });

    t.it('.get/set Suffix()', async () => {
      const newSuffix = 'Jr.';
      await contact.setSuffix(newSuffix);
      const retrievedSuffix = await contact.getSuffix();
      t.expect(retrievedSuffix).toBe(newSuffix);
      await contact.setSuffix(null);
      const nullSuffix = await contact.getSuffix();
      t.expect(nullSuffix).toBeNull();
    });

    t.it('.get/set PhoneticGivenName()', async () => {
      const newPhoneticGivenName = 'Jon';
      await contact.setPhoneticGivenName(newPhoneticGivenName);
      const retrievedPhoneticGivenName = await contact.getPhoneticGivenName();
      t.expect(retrievedPhoneticGivenName).toBe(newPhoneticGivenName);
      await contact.setPhoneticGivenName(null);
      const nullPhoneticGivenName = await contact.getPhoneticGivenName();
      t.expect(nullPhoneticGivenName).toBeNull();
    });

    t.it('.get/set PhoneticMiddleName()', async () => {
      const newPhoneticMiddleName = 'Rob-ert';
      await contact.setPhoneticMiddleName(newPhoneticMiddleName);
      const retrievedPhoneticMiddleName = await contact.getPhoneticMiddleName();
      t.expect(retrievedPhoneticMiddleName).toBe(newPhoneticMiddleName);
      await contact.setPhoneticMiddleName(null);
      const nullPhoneticMiddleName = await contact.getPhoneticMiddleName();
      t.expect(nullPhoneticMiddleName).toBeNull();
    });

    t.it('.get/set PhoneticFamilyName()', async () => {
      const newPhoneticFamilyName = 'Doh';
      await contact.setPhoneticFamilyName(newPhoneticFamilyName);
      const retrievedPhoneticFamilyName = await contact.getPhoneticFamilyName();
      t.expect(retrievedPhoneticFamilyName).toBe(newPhoneticFamilyName);
      await contact.setPhoneticFamilyName(null);
      const nullPhoneticFamilyName = await contact.getPhoneticFamilyName();
      t.expect(nullPhoneticFamilyName).toBeNull();
    });
    t.it('.get/set Company()', async () => {
      const newCompany = 'Expo';
      await contact.setCompany(newCompany);
      const retrievedCompany = await contact.getCompany();
      t.expect(retrievedCompany).toBe(newCompany);
      await contact.setCompany(null);
      const nullCompany = await contact.getCompany();
      t.expect(nullCompany).toBeNull();
    });

    t.it('.get/set Department()', async () => {
      const newDepartment = 'Engineering';
      await contact.setDepartment(newDepartment);
      const retrievedDepartment = await contact.getDepartment();
      t.expect(retrievedDepartment).toBe(newDepartment);
      await contact.setDepartment(null);
      const nullDepartment = await contact.getDepartment();
      t.expect(nullDepartment).toBeNull();
    });

    t.it('.get/set JobTitle()', async () => {
      const newJobTitle = 'Software Developer';
      await contact.setJobTitle(newJobTitle);
      const retrievedJobTitle = await contact.getJobTitle();
      t.expect(retrievedJobTitle).toBe(newJobTitle);
      await contact.setJobTitle(null);
      const nullJobTitle = await contact.getJobTitle();
      t.expect(nullJobTitle).toBeNull();
    });

    t.it('.get/set PhoneticCompanyName()', async () => {
      const newPhoneticName = 'Eks-po';
      await contact.setPhoneticCompanyName(newPhoneticName);
      const retrievedPhoneticName = await contact.getPhoneticCompanyName();
      t.expect(retrievedPhoneticName).toBe(newPhoneticName);
      await contact.setPhoneticCompanyName(null);
      const nullPhoneticName = await contact.getPhoneticCompanyName();
      t.expect(nullPhoneticName).toBeNull();
    });

    t.it('.get/set Image()', async () => {
      const url = 'https://picsum.photos/200';
      const response = await fetch(url);
      const src = new File(Paths.cache, 'file.pdf');
      src.write(await response.bytes());
      await contact.setImage(src.uri);
      const retrievedImage = await contact.getImage();
      const retrievedThumbnail = await contact.getThumbnail();
      t.expect(retrievedThumbnail != null).toBe(true);
      t.expect(retrievedImage != null).toBe(true);
      await contact.setImage(null);
      const nullImage = await contact.getImage();
      t.expect(nullImage).toBeNull();
      const nullThumbnail = await contact.getThumbnail();
      t.expect(nullThumbnail).toBeNull();
    });

    // A Note property requires an additional permission on iOS which is not avaiable in bare-expo
    if (Platform.OS !== 'ios') {
      t.it('.get/set Note()', async () => {
        const newNotes = 'These are some notes.';
        await contact.setNote(newNotes);
        const retrievedNotes = await contact.getNote();
        t.expect(retrievedNotes).toBe(newNotes);
        await contact.setNote(null);
        const nullNotes = await contact.getNote();
        t.expect(nullNotes).toBeNull();
      });
    }

    if (Platform.OS === 'ios') {
      const calendarsToTest = [
        { type: NonGregorianCalendar.buddhist, name: 'buddhist', year: 2567 },
        { type: NonGregorianCalendar.chinese, name: 'chinese', year: 1 },
        { type: NonGregorianCalendar.coptic, name: 'coptic', year: 1740 },
        {
          type: NonGregorianCalendar.ethiopicAmeteMihret,
          name: 'ethiopicAmeteMihret',
          year: 2016,
        },
        { type: NonGregorianCalendar.ethiopicAmeteAlem, name: 'ethiopicAmeteAlem', year: 7516 },
        { type: NonGregorianCalendar.hebrew, name: 'hebrew', year: 5784 },
        { type: NonGregorianCalendar.indian, name: 'indian', year: 1945 },
        { type: NonGregorianCalendar.islamic, name: 'islamic', year: 1445 },
        { type: NonGregorianCalendar.islamicCivil, name: 'islamicCivil', year: 1445 },
        { type: NonGregorianCalendar.japanese, name: 'japanese', year: 6 },
        { type: NonGregorianCalendar.persian, name: 'persian', year: 1403 },
        { type: NonGregorianCalendar.republicOfChina, name: 'republicOfChina', year: 113 },
      ];

      calendarsToTest.forEach((calendarCase) => {
        t.it(`should set and get ${calendarCase.name} nonGregorianBirthday`, async () => {
          const birthday = { year: calendarCase.year, month: 3, day: 15 };

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
          year: 1991,
          month: 2,
          day: 2,
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
          year: 1991,
          month: 2,
          day: 2,
        },
      });
      dates = await contact.getDates();
      t.expect(dates[0].label).toBe('birthday-updated');
      t.expect(dates[0].date.year).toBe(1991);
      t.expect(dates[0].date.month).toBe(2);
      t.expect(dates[0].date.day).toBe(2);
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

  t.describe('.update()', () => {
    if (Platform.OS === 'android') {
      t.it('.update({ isFavourite })', async () => {
        const contact = await Contact.create({
          givenName: 'Fav',
          familyName: 'User',
        });
        contacts.push(contact);

        await contact.update({ isFavourite: true });
        const details = await contact.getDetails([
          ContactField.IS_FAVOURITE,
          ContactField.GIVEN_NAME,
          ContactField.FAMILY_NAME,
        ]);
        t.expect(details.givenName).toBe(null);
        t.expect(details.familyName).toBe(null);
        t.expect(details.isFavourite).toBe(true);

        await contact.update({ isFavourite: false });
        const isFavourite = await contact.getIsFavourite();
        t.expect(isFavourite).toBe(false);
      });
    }

    t.it('.update({ givenName, familyName })', async () => {
      const contact = await Contact.create({
        givenName: 'InitialGiven',
        middleName: 'InitialMiddle',
        familyName: 'InitialFamily',
      });
      contacts.push(contact);

      await contact.update({
        givenName: 'UpdatedGiven',
      });
      const givenName = await contact.getGivenName();
      const middleName = await contact.getMiddleName();
      const familyName = await contact.getFamilyName();

      t.expect(givenName).toBe('UpdatedGiven');
      t.expect(middleName).toBe(null);
      t.expect(familyName).toBe(null);
    });

    t.it('.update({ company, jobTitle })', async () => {
      const contact = await Contact.create({
        company: 'InitialCompany',
        department: 'InitialDepartment',
        jobTitle: 'InitialJobTitle',
      });
      contacts.push(contact);

      await contact.update({
        company: 'UpdatedCompany',
      });
      const { company, department, jobTitle } = await contact.getDetails([
        ContactField.COMPANY,
        ContactField.DEPARTMENT,
        ContactField.JOB_TITLE,
      ]);

      t.expect(company).toBe('UpdatedCompany');
      t.expect(department).toBe(null);
      t.expect(jobTitle).toBe(null);
    });

    t.it('.update(emails)', async () => {
      const contact = await Contact.create({
        givenName: 'Email',
        familyName: 'User',
        emails: [{ label: 'work', address: 'work@example.com' }],
      });
      contacts.push(contact);
      await contact.update({
        emails: [{ label: 'personal', address: 'personal@example.com' }],
      });
      const updatedEmails = await contact.getEmails();
      t.expect(updatedEmails.length).toBe(1);
      t.expect(updatedEmails[0].label).toBe('personal');
      t.expect(updatedEmails[0].address).toBe('personal@example.com');
    });

    t.it('.update(phones)', async () => {
      const contact = await Contact.create({
        givenName: 'Phone',
        familyName: 'User',
        phones: [{ label: 'work', number: '123456789' }],
      });
      contacts.push(contact);
      await contact.update({
        phones: [{ label: 'personal', number: '+48111222333' }],
      });
      const updatedPhones = await contact.getPhones();
      t.expect(updatedPhones.length).toBe(1);
      t.expect(updatedPhones[0].label).toBe('personal');
      t.expect(updatedPhones[0].number).toBe('+48111222333');
    });

    t.it('.update(dates)', async () => {
      const contact = await Contact.create({
        givenName: 'Date',
        familyName: 'User',
        dates: [
          {
            label: 'birthday',
            date: { year: 1990, month: 1, day: 1 },
          },
        ],
      });
      contacts.push(contact);
      await contact.update({
        dates: [
          {
            label: 'anniversary',
            date: { year: 2015, month: 6, day: 15 },
          },
        ],
      });
      const { givenName, familyName, dates } = await contact.getDetails([
        ContactField.GIVEN_NAME,
        ContactField.FAMILY_NAME,
        ContactField.DATES,
      ]);
      t.expect(givenName).toBe(null);
      t.expect(familyName).toBe(null);
      t.expect(dates.length).toBe(1);
      t.expect(dates[0].label).toBe('anniversary');
      t.expect(dates[0].date.year).toBe(2015);
      t.expect(dates[0].date.month).toBe(6);
      t.expect(dates[0].date.day).toBe(15);
    });

    t.it('.update(allFields)', async () => {
      const contact = await Contact.create({
        givenName: 'All',
        familyName: 'Fields',
        middleName: 'Test',
        maidenName: 'Maiden',
        nickname: 'Nickname',
        prefix: 'Mr.',
        suffix: 'Sr.',
        phoneticGivenName: 'PhoneticGiven',
        phoneticMiddleName: 'PhoneticMiddle',
        phoneticFamilyName: 'PhoneticFamily',
        company: 'InitialCompany',
        department: 'InitialDepartment',
        jobTitle: 'InitialJobTitle',
        phones: [{ label: 'work', number: '123456789' }],
        emails: [{ label: 'work', address: 'work@example.com' }],
      });
      contacts.push(contact);

      await contact.update({
        givenName: 'UpdatedGiven',
        familyName: 'UpdatedFamily',
        company: 'UpdatedCompany',
        phones: [{ label: 'personal', number: '+48111222333' }],
        emails: [{ label: 'personal', address: 'personal@example.com' }],
      });

      const details = await contact.getDetails([
        ContactField.GIVEN_NAME,
        ContactField.FAMILY_NAME,
        ContactField.MIDDLE_NAME,
        ContactField.MAIDEN_NAME,
        ContactField.NICKNAME,
        ContactField.PREFIX,
        ContactField.SUFFIX,
        ContactField.PHONETIC_GIVEN_NAME,
        ContactField.PHONETIC_MIDDLE_NAME,
        ContactField.PHONETIC_FAMILY_NAME,
        ContactField.COMPANY,
        ContactField.DEPARTMENT,
        ContactField.JOB_TITLE,
        ContactField.PHONES,
        ContactField.EMAILS,
      ]);

      t.expect(details.givenName).toBe('UpdatedGiven');
      t.expect(details.familyName).toBe('UpdatedFamily');
      t.expect(details.middleName).toBe(null);
      if (Platform.OS === 'ios') {
        t.expect(details.maidenName).toBe(null);
        t.expect(details.nickname).toBe(null);
      } else {
        t.expect(details.maidenName).toBeUndefined();
        t.expect(details.nickname).toBeUndefined();
      }
      t.expect(details.prefix).toBe(null);
      t.expect(details.suffix).toBe(null);
      t.expect(details.phoneticGivenName).toBe(null);
      t.expect(details.phoneticMiddleName).toBe(null);
      t.expect(details.phoneticFamilyName).toBe(null);
      t.expect(details.company).toBe('UpdatedCompany');
      t.expect(details.department).toBe(null);
      t.expect(details.jobTitle).toBe(null);
      t.expect(details.phones.length).toBe(1);
      t.expect(details.phones[0].label).toBe('personal');
      t.expect(details.phones[0].number).toBe('+48111222333');
      t.expect(details.emails.length).toBe(1);
      t.expect(details.emails[0].label).toBe('personal');
      t.expect(details.emails[0].address).toBe('personal@example.com');
    });
  });

  t.describe('.patch()', () => {
    t.it('.patch({ isFavourite })', async () => {
      const contact = await Contact.create({
        givenName: 'Fav',
        familyName: 'User',
      });
      contacts.push(contact);

      await contact.patch({ isFavourite: true });
      if (Platform.OS === 'android') {
        let isFavourite = await contact.getIsFavourite();
        t.expect(isFavourite).toBe(true);
        await contact.patch({ isFavourite: false });
        isFavourite = await contact.getIsFavourite();
        t.expect(isFavourite).toBe(false);
      }
    });

    t.it('.patch({ givenName, familyName })', async () => {
      const contact = await Contact.create({
        givenName: 'InitialGiven',
        middleName: 'InitialMiddle',
        familyName: 'InitialFamily',
      });
      contacts.push(contact);

      await contact.patch({
        givenName: 'UpdatedGiven',
        familyName: null,
      });

      const givenName = await contact.getGivenName();
      const middleName = await contact.getMiddleName();
      const familyName = await contact.getFamilyName();

      t.expect(givenName).toBe('UpdatedGiven');
      t.expect(middleName).toBe('InitialMiddle');
      t.expect(familyName).toBe(null);
    });

    t.it('.patch({ company, jobTitle })', async () => {
      const contact = await Contact.create({
        company: 'InitialCompany',
        department: 'InitialDepartment',
        jobTitle: 'InitialJobTitle',
      });
      contacts.push(contact);

      await contact.patch({
        company: 'UpdatedCompany',
        jobTitle: null,
      });

      const company = await contact.getCompany();
      const department = await contact.getDepartment();
      const jobTitle = await contact.getJobTitle();

      t.expect(company).toBe('UpdatedCompany');
      t.expect(department).toBe('InitialDepartment');
      t.expect(jobTitle).toBe(null);
    });

    t.it('.patch({ emails })', async () => {
      const contact = await Contact.create({
        givenName: 'Email',
        familyName: 'User',
        emails: [{ label: 'work', address: 'work@example.com' }],
      });
      contacts.push(contact);

      const emails = await contact.getEmails();
      const emailId = emails[0].id;

      await contact.patch({
        emails: [
          { id: emailId, address: 'work_updated@example.com' },
          { label: 'personal', address: 'personal_updated@example.com' },
        ],
      });

      const updatedEmails = await contact.getEmails();
      t.expect(updatedEmails.length).toBe(2);
      t.expect(updatedEmails.some((e) => e.id === emailId)).toBe(true);
      t.expect(updatedEmails.some((e) => e.label === 'work')).toBe(true);
      t.expect(updatedEmails.some((e) => e.address === 'work_updated@example.com')).toBe(true);
      t.expect(updatedEmails.some((e) => e.address === 'personal_updated@example.com')).toBe(true);
      t.expect(updatedEmails.some((e) => e.address === 'work@example.com')).toBe(false);
    });

    t.it('.patch({ emails: [] })', async () => {
      const contact = await Contact.create({
        givenName: 'Email',
        familyName: 'User',
        emails: [{ label: 'work', address: 'work@example.com' }],
      });
      contacts.push(contact);

      await contact.patch({ emails: [] });

      const updatedEmails = await contact.getEmails();
      t.expect(updatedEmails.length).toBe(0);
    });

    t.it('.patch({ phones })', async () => {
      const contact = await Contact.create({
        givenName: 'Phone',
        familyName: 'User',
        phones: [{ label: 'work', number: '123456789' }],
      });
      contacts.push(contact);

      const phones = await contact.getPhones();
      const phoneId = phones[0].id;

      await contact.patch({
        phones: [
          { id: phoneId, number: '+48987654321' },
          { label: 'personal', number: '+48111222333' },
        ],
      });

      const updatedPhones = await contact.getPhones();
      t.expect(updatedPhones.length).toBe(2);
      t.expect(updatedPhones.some((p) => p.number === '+48987654321')).toBe(true);
      t.expect(updatedPhones.some((p) => p.number === '+48111222333')).toBe(true);
      t.expect(updatedPhones.some((p) => p.number === '123456789')).toBe(false);
      t.expect(updatedPhones.some((p) => p.label === 'work')).toBe(true);
      t.expect(updatedPhones.some((p) => p.label === 'personal')).toBe(true);
    });

    t.it('.patch({ phones: [] })', async () => {
      const contact = await Contact.create({
        givenName: 'Phone',
        familyName: 'User',
        phones: [{ label: 'work', number: '123456789' }],
      });
      contacts.push(contact);

      await contact.patch({
        phones: [],
      });

      const updatedPhones = await contact.getPhones();
      t.expect(updatedPhones.length).toBe(0);
    });

    t.it('.patch({ dates })', async () => {
      const contact = await Contact.create({
        givenName: 'Date',
        familyName: 'User',
        dates: [
          {
            label: 'birthday',
            date: { year: 1990, month: 1, day: 1 },
          },
        ],
      });
      contacts.push(contact);

      const dates = await contact.getDates();

      await contact.patch({
        dates: [
          {
            ...dates[0],
            date: { year: 1991, month: 1, day: 1 },
          },
          {
            label: 'anniversary',
            date: { year: 2020, month: 1, day: 1 },
          },
        ],
      });

      const updatedDates = await contact.getDates();
      t.expect(updatedDates.length).toBe(2);
      t.expect(updatedDates.some((d) => d.date.year === 1991)).toBe(true);
      t.expect(updatedDates.some((d) => d.date.year === 2020)).toBe(true);
      t.expect(updatedDates.some((d) => d.date.year === 1990)).toBe(false);
    });

    t.it('.patch({ dates: [] })', async () => {
      const contact = await Contact.create({
        givenName: 'Date',
        familyName: 'User',
        dates: [
          {
            label: 'birthday',
            date: { year: 1990, month: 1, day: 1 },
          },
        ],
      });
      contacts.push(contact);

      await contact.patch({
        dates: [],
      });

      const updatedDates = await contact.getDates();
      t.expect(updatedDates.length).toBe(0);
    });

    if (Platform.OS === 'android') {
      t.it('.patch({ extraNames })', async () => {
        const contact = await Contact.create({
          givenName: 'Extra',
          familyName: 'User',
          extraNames: [{ label: 'nickname', name: 'Tester' }],
        });
        contacts.push(contact);

        const extraNames = await contact.getExtraNames();

        await contact.patch({
          extraNames: [
            { ...extraNames[0], name: 'TesterUpdated' },
            { label: 'alias', name: 'ExtraAlias' },
          ],
        });

        const updatedExtraNames = await contact.getExtraNames();
        t.expect(updatedExtraNames.length).toBe(2);
        t.expect(updatedExtraNames.some((n) => n.name === 'TesterUpdated')).toBe(true);
        t.expect(updatedExtraNames.some((n) => n.name === 'ExtraAlias')).toBe(true);
        t.expect(updatedExtraNames.some((n) => n.name === 'Tester')).toBe(false);
      });

      t.it('.patch({ extraNames: [] })', async () => {
        const contact = await Contact.create({
          givenName: 'Extra',
          familyName: 'User',
          extraNames: [{ label: 'nickname', name: 'Tester' }],
        });
        contacts.push(contact);

        await contact.patch({
          extraNames: [],
        });

        const updatedExtraNames = await contact.getExtraNames();
        t.expect(updatedExtraNames.length).toBe(0);
      });
    }

    t.it('.patch({ addresses })', async () => {
      const contact = await Contact.create({
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
      });
      contacts.push(contact);

      const addresses = await contact.getAddresses();

      await contact.patch({
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

      const updatedAddresses = await contact.getAddresses();
      t.expect(updatedAddresses.length).toBe(2);
      t.expect(updatedAddresses.some((a) => a.street === '456 Updated St')).toBe(true);
      t.expect(updatedAddresses.some((a) => a.street === 'Office St 1')).toBe(true);
      t.expect(updatedAddresses.some((a) => a.street === '123 Main St')).toBe(false);
    });

    t.it('.patch({ addresses: [] })', async () => {
      const contact = await Contact.create({
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
      });
      contacts.push(contact);

      await contact.patch({
        addresses: [],
      });

      const updatedAddresses = await contact.getAddresses();
      t.expect(updatedAddresses.length).toBe(0);
    });

    t.it('.patch({ relations })', async () => {
      const contact = await Contact.create({
        givenName: 'Relation',
        familyName: 'User',
        relations: [{ label: 'spouse', name: 'Alice' }],
      });
      contacts.push(contact);

      const relations = await contact.getRelations();

      await contact.patch({
        relations: [
          { ...relations[0], name: 'AliceUpdated' },
          { label: 'child', name: 'Bob' },
        ],
      });

      const updatedRelations = await contact.getRelations();
      t.expect(updatedRelations.length).toBe(2);
      t.expect(updatedRelations.some((r) => r.name === 'AliceUpdated')).toBe(true);
      t.expect(updatedRelations.some((r) => r.name === 'Bob')).toBe(true);
      t.expect(updatedRelations.some((r) => r.name === 'Alice')).toBe(false);
    });

    t.it('.patch({ relations: [] })', async () => {
      const contact = await Contact.create({
        givenName: 'Relation',
        familyName: 'User',
        relations: [{ label: 'spouse', name: 'Alice' }],
      });
      contacts.push(contact);

      await contact.patch({
        relations: [],
      });

      const updatedRelations = await contact.getRelations();
      t.expect(updatedRelations.length).toBe(0);
    });

    t.it('.patch({ urlAddresses: [] })', async () => {
      const contact = await Contact.create({
        givenName: 'Web',
        familyName: 'User',
        urlAddresses: [{ label: 'personal', url: 'https://example.com' }],
      });
      contacts.push(contact);

      const urls = await contact.getUrlAddresses();

      await contact.patch({
        urlAddresses: [
          { ...urls[0], url: 'https://updated.example.com' },
          { label: 'work', url: 'https://work.example.com' },
        ],
      });

      const updatedUrls = await contact.getUrlAddresses();
      t.expect(updatedUrls.length).toBe(2);
      t.expect(updatedUrls.some((u) => u.url === 'https://updated.example.com')).toBe(true);
      t.expect(updatedUrls.some((u) => u.url === 'https://work.example.com')).toBe(true);
      t.expect(updatedUrls.some((u) => u.url === 'https://example.com')).toBe(false);
    });

    t.it('.patch({ urlAddresses: [] })', async () => {
      const contact = await Contact.create({
        givenName: 'Web',
        familyName: 'User',
        urlAddresses: [{ label: 'personal', url: 'https://example.com' }],
      });
      contacts.push(contact);

      await contact.patch({
        urlAddresses: [],
      });

      const updatedUrls = await contact.getUrlAddresses();
      t.expect(updatedUrls.length).toBe(0);
    });

    t.it('.patch({ ...all fields })', async () => {
      const initialContactDetails = {
        givenName: 'InitialGiven',
        familyName: 'InitialFamily',
        middleName: 'InitialMiddle',
        prefix: 'Mr.',
        suffix: 'Sr.',
        company: 'InitialCompany',
        jobTitle: 'InitialJob',
        phoneticCompanyName: 'InitialPhoneticCompany',
        emails: [{ label: 'work', address: 'work@example.com' }],
        phones: [{ label: 'work', number: '111222333' }],
        dates: [{ label: 'birthday', date: { year: 1990, month: 1, day: 1 } }],
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
        socialProfiles: [{ label: 'twitter', username: 'initialuser', service: 'Twitter' }],
        imAddresses: [{ label: 'skype', username: 'initialuser', service: 'Skype' }],
      };

      const contact = await Contact.create(initialContactDetails);
      contacts.push(contact);

      const initialEmails = await contact.getEmails();
      const initialPhones = await contact.getPhones();
      const initialDates = await contact.getDates();
      let initialExtraNames;
      if (Platform.OS === 'android') {
        initialExtraNames = await contact.getExtraNames();
      } else {
        initialExtraNames = [];
      }
      const initialAddresses = await contact.getAddresses();
      const initialUrls = await contact.getUrlAddresses();

      await contact.patch({
        givenName: 'UpdatedGiven',
        middleName: 'NewMiddleName',
        familyName: null,

        company: 'UpdatedCompany',
        jobTitle: null,
        phoneticCompanyName: null,
        prefix: null,
        suffix: null,

        emails: [
          { ...initialEmails[0], address: 'work_updated@example.com' },
          { label: 'personal', address: 'personal_new@example.com' },
        ],

        phones: [
          { ...initialPhones[0], number: '+48999888777' },
          { label: 'mobile', number: '+48555444333' },
        ],

        dates: [
          { ...initialDates[0], date: { year: 1991, month: 2, day: 2 } },
          { label: 'anniversary', date: { year: 2021, month: 10, day: 10 } },
        ],

        extraNames: [
          { ...initialExtraNames[0], name: 'UpdatedNickname' },
          { label: 'alias', name: 'NewAlias' },
        ],

        addresses: [
          { ...initialAddresses[0], street: '456 Updated St' },
          { label: 'work', street: '987 Work Ave', city: 'Krakow', country: 'Poland' },
        ],

        relations: [],

        urlAddresses: [
          { ...initialUrls[0], url: 'https://updated.example.com' },
          { label: 'work', url: 'https://work.example.com' },
        ],

        socialProfiles: initialContactDetails.socialProfiles,
        imAddresses: initialContactDetails.imAddresses,
      });

      const updatedContact = await contact.getDetails();

      t.expect(updatedContact.givenName).toBe('UpdatedGiven');
      t.expect(updatedContact.middleName).toBe('NewMiddleName');
      t.expect(updatedContact.familyName).toBe(null);

      t.expect(updatedContact.company).toBe('UpdatedCompany');
      t.expect(updatedContact.jobTitle).toBe(null);

      const updatedEmails = await contact.getEmails();
      t.expect(updatedEmails.length).toBe(2);
      t.expect(updatedEmails.some((e) => e.address === 'work_updated@example.com')).toBe(true);
      t.expect(updatedEmails.some((e) => e.address === 'personal_new@example.com')).toBe(true);

      const updatedPhones = await contact.getPhones();
      t.expect(updatedPhones.length).toBe(2);
      t.expect(updatedPhones.some((p) => p.number === '+48999888777')).toBe(true);
      t.expect(updatedPhones.some((p) => p.number === '+48555444333')).toBe(true);

      const updatedDates = await contact.getDates();
      t.expect(updatedDates.length).toBe(2);
      t.expect(updatedDates.some((d) => d.date.year === 1991)).toBe(true);
      t.expect(updatedDates.some((d) => d.date.year === 2021)).toBe(true);

      if (Platform.OS === 'android') {
        const updatedExtraNames = await contact.getExtraNames();
        t.expect(updatedExtraNames.length).toBe(2);
        t.expect(updatedExtraNames.some((n) => n.name === 'UpdatedNickname')).toBe(true);
        t.expect(updatedExtraNames.some((n) => n.name === 'NewAlias')).toBe(true);
      }

      const updatedAddresses = await contact.getAddresses();
      t.expect(updatedAddresses.length).toBe(2);
      t.expect(updatedAddresses.some((a) => a.street === '456 Updated St')).toBe(true);
      t.expect(updatedAddresses.some((a) => a.street === '987 Work Ave')).toBe(true);

      const updatedRelations = await contact.getRelations();
      t.expect(updatedRelations.length).toBe(0);

      const updatedUrls = await contact.getUrlAddresses();
      t.expect(updatedUrls.length).toBe(2);
      t.expect(updatedUrls.some((u) => u.url === 'https://updated.example.com')).toBe(true);
      t.expect(updatedUrls.some((u) => u.url === 'https://work.example.com')).toBe(true);

      if (Platform.OS === 'ios') {
        const socialProfiles = await contact.getSocialProfiles();
        t.expect(socialProfiles.length).toBe(1);
        t.expect(socialProfiles[0].username).toBe('initialuser');

        const imAddresses = await contact.getImAddresses();
        t.expect(imAddresses.length).toBe(1);
        t.expect(imAddresses[0].username).toBe('initialuser');
      }
    });
  });

  if (Platform.OS === 'ios') {
    t.describe('Group', () => {
      let testGroup: Group;
      let testContact: Contact;
      const groups: Group[] = [];

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
          t.expect(name).toBeDefined();
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
}
