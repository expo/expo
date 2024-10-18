'use strict';

import { Asset } from 'expo-asset';
import * as Contacts from 'expo-contacts';
import { Platform } from 'react-native';

import * as TestUtils from '../TestUtils';

export const name = 'Contacts';

async function sortContacts(contacts, sortField, expect) {
  for (let i = 1; i < contacts.length; i++) {
    const { [sortField]: propA } = contacts[i - 1];
    const { [sortField]: propB } = contacts[i];
    if (propA && propB) {
      const order = propA.toLowerCase().localeCompare(propB.toLowerCase());
      expect(Math.max(order, 0)).toBe(0);
    }
  }
}

export async function test({ describe, it, xdescribe, jasmine, expect, afterAll }) {
  const shouldSkipTestsRequiringPermissions =
    await TestUtils.shouldSkipTestsRequiringPermissionsAsync();
  const describeWithPermissions = shouldSkipTestsRequiringPermissions ? xdescribe : describe;

  function compareArrays(array, expected) {
    return expected.reduce(
      (result, expectedItem) =>
        result && array.filter((item) => compareObjects(item, expectedItem)).length,
      true
    );
  }

  function compareObjects(object, expected) {
    for (const prop in expected) {
      if (prop === Contacts.Fields.Image || prop === 'lookupKey' || prop === 'id') {
        continue;
      }
      if (Array.isArray(object[prop])) {
        if (!compareArrays(object[prop], expected[prop])) {
          return false;
        }
      } else if (typeof object[prop] === 'object') {
        if (!compareObjects(object[prop], expected[prop])) {
          return false;
        }
      } else if (object[prop] !== expected[prop]) {
        expect(object[prop]).toEqual(expected[prop]);
        return false;
      }
    }

    return true;
  }

  describeWithPermissions('Contacts', () => {
    const isAndroid = Platform.OS !== 'ios';

    it('Contacts.requestPermissionsAsync', async () => {
      const results = await Contacts.requestPermissionsAsync();

      expect(results.granted).toBe(true);
      expect(results.status).toBe('granted');
    });

    it('Contacts.getPermissionsAsync', async () => {
      const results = await Contacts.getPermissionsAsync();
      expect(results.granted).toBe(true);
      expect(results.status).toBe('granted');
    });

    const createdContacts = [];
    const createContact = async (contact) => {
      const id = await Contacts.addContactAsync(contact);
      createdContacts.push({ id, contact });
      return id;
    };

    afterAll(async () => {
      await Promise.all(createdContacts.map(async ({ id }) => Contacts.removeContactAsync(id)));
    });

    it('Contacts.createContactsAsync()', async () => {
      const contacts = [
        {
          [Contacts.Fields.FirstName]: 'Eric',
          [Contacts.Fields.LastName]: 'Cartman',
          [Contacts.Fields.JobTitle]: 'Actor',
          [Contacts.Fields.PhoneNumbers]: [
            {
              number: '123456789',
              label: 'work',
            },
          ],
          [Contacts.Fields.Emails]: [
            {
              email: 'carmant@southpark.com',
              label: 'unknown',
            },
          ],
        },
        {
          [Contacts.Fields.FirstName]: 'Kyle',
          [Contacts.Fields.LastName]: 'Broflovski',
          [Contacts.Fields.JobTitle]: 'Actor',
          [Contacts.Fields.PhoneNumbers]: [
            {
              number: '987654321',
              label: 'unknown',
            },
          ],
        },
      ];

      await Promise.all(
        contacts.map(async (contact) => {
          const id = await createContact(contact);
          expect(typeof id).toBe('string');
        })
      );
    });

    async function createSimpleContact(firstName, lastName) {
      const fields = {
        [Contacts.Fields.FirstName]: firstName,
        [Contacts.Fields.LastName]: lastName,
      };

      return createContact(fields);
    }

    async function createContactWithImage() {
      const image = Asset.fromModule(require('../assets/icons/app.png'));
      await image.downloadAsync();

      const fields = {
        [Contacts.Fields.Image]: { uri: image.localUri },
        [Contacts.Fields.FirstName]: 'Kenny',
        [Contacts.Fields.LastName]: 'McCormick',
      };

      return createContact(fields);
    }

    it('Contacts.createContactAsync() with image', async () => {
      const contactId = await createContactWithImage();
      expect(typeof contactId).toBe('string');
    });

    it('Contacts.createContactAsync() with birthday', async () => {
      const originalBirthday = {
        day: 30,
        month: 0,
      };

      const contactId = await createContact({
        [Contacts.Fields.Birthday]: originalBirthday,
        [Contacts.Fields.FirstName]: 'Kenny',
        [Contacts.Fields.LastName]: 'Bday guy',
      });
      expect(typeof contactId).toBe('string');

      const contact = await Contacts.getContactByIdAsync(contactId, [Contacts.Fields.Birthday]);

      expect(contact.birthday).toEqual({
        ...originalBirthday,
        format: 'gregorian',
      });
      const newBirthday = {
        day: 1,
        month: 8,
        year: 2024,
      };
      const modifiedId = await Contacts.updateContactAsync({
        id: contactId,
        [Contacts.Fields.Birthday]: newBirthday,
      });
      const modifiedContact = await Contacts.getContactByIdAsync(modifiedId, [
        Contacts.Fields.Birthday,
      ]);
      expect(modifiedContact.birthday).toEqual({
        ...newBirthday,
        format: 'gregorian',
      });

      // this is needed to make sure the entry in `createdContacts` corresponds to the actual contact
      await Contacts.updateContactAsync({
        id: contactId,
        [Contacts.Fields.Birthday]: originalBirthday,
      });
    });

    it('Contacts.updateContactAsync() with image', async () => {
      const contactId = await createContactWithImage({
        [Contacts.Fields.FirstName]: 'Kenny',
        [Contacts.Fields.LastName]: 'Bday guy',
      });
      expect(typeof contactId).toBe('string');
      const contact = await Contacts.getContactByIdAsync(contactId);
      const modifiedId = await Contacts.updateContactAsync(contact);
      expect(typeof modifiedId).toBe('string');
    });

    it('Contacts.writeContactToFileAsync() returns uri', async () => {
      createdContacts.map(async ({ id }) => {
        const localUri = await Contacts.writeContactToFileAsync({ id });
        expect(typeof localUri).toBe('string');
      });
    });

    it("Contacts.getContactByIdAsync() returns undefined when contact doesn't exist", async () => {
      const contact = await Contacts.getContactByIdAsync('-1');
      expect(contact).toBeUndefined();
    });

    it('Contacts.getContactByIdAsync() checks shape of all results', async () => {
      const contacts = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
        pageSize: 1,
      });

      expect(contacts.data.length > 0).toBe(true);
      contacts.data.forEach(({ id, name, phoneNumbers, emails }) => {
        expect(typeof id === 'string' || typeof id === 'number').toBe(true);
        expect(typeof name === 'string' || typeof name === 'undefined').toBe(true);
        expect(Array.isArray(phoneNumbers) || typeof phoneNumbers === 'undefined').toBe(true);
        expect(Array.isArray(emails) || typeof emails === 'undefined').toBe(true);
      });
    });

    it('Contacts.getContactByIdAsync() retrieves image', async () => {
      const contactId = await createContactWithImage();
      const contact = await Contacts.getContactByIdAsync(contactId, [
        Contacts.Fields.Image,
        'imageBase64',
      ]);

      expect(contact.imageAvailable).toBe(true);
      expect(contact.thumbnail).toBeUndefined();

      if (isAndroid) {
        expect(contact.image).toEqual(
          jasmine.objectContaining({
            uri: jasmine.any(String),
          })
        );
      } else {
        expect(contact.image).toEqual(
          jasmine.objectContaining({
            uri: jasmine.any(String),
            height: jasmine.any(Number),
            width: jasmine.any(Number),
            base64: jasmine.any(String),
          })
        );
      }
    });

    it('Contacts.getContactByIdAsync() returns correct shape', async () => {
      const contact = {
        [Contacts.Fields.FirstName]: 'Eric',
        [Contacts.Fields.LastName]: 'Cartman',
        [Contacts.Fields.JobTitle]: 'Actor',
        [Contacts.Fields.PhoneNumbers]: [
          {
            number: '123456789',
            label: 'work',
          },
        ],
      };

      const newContactId = await createContact(contact);

      const { data, hasNextPage, hasPreviousPage } = await Contacts.getContactsAsync({
        id: newContactId,
      });

      // Test some constant values

      expect(data).toBeDefined();

      expect(typeof hasNextPage).toBe('boolean');
      expect(typeof hasPreviousPage).toBe('boolean');

      expect(data.length).toBe(1);
      expect(hasPreviousPage).toBe(false);
      expect(hasNextPage).toBe(false);

      // Test a contact
      expect(data[0]).toEqual(
        jasmine.objectContaining({
          contactType: jasmine.any(String),
          id: jasmine.any(String),
        })
      );
      expect(data[0].imageAvailable).toBeDefined();
    });

    it('Contacts.getContactByIdAsync() skips phone number if not asked', async () => {
      const fakeContactWithPhoneNumber = {
        [Contacts.Fields.FirstName]: 'Eric',
        [Contacts.Fields.LastName]: 'Cartman',
        [Contacts.Fields.JobTitle]: 'Actor',
        [Contacts.Fields.PhoneNumbers]: [
          {
            number: '123456789',
            label: 'work',
          },
        ],
      };

      const newContactId = await createContact(fakeContactWithPhoneNumber);

      const getWithPhone = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers],
        id: newContactId,
      });

      const contactWithPhone = getWithPhone.data[0];

      expect(contactWithPhone.phoneNumbers).toBeDefined();
      expect(contactWithPhone.phoneNumbers.length).toBeGreaterThan(0);
      expect(contactWithPhone.phoneNumbers[0]).toEqual(
        jasmine.objectContaining({
          id: jasmine.any(String),
          label: jasmine.any(String),
          number: jasmine.any(String),
        })
      );

      const getWithoutPhone = await Contacts.getContactsAsync({
        fields: [],
        id: newContactId,
      });

      const contactWithoutPhone = getWithoutPhone.data[0];
      expect(contactWithoutPhone.phoneNumbers).toBeUndefined();
    });

    it('Contacts.getContactByIdAsync() respects the page size', async () => {
      const contacts = await Contacts.getContactsAsync({
        fields: [],
        pageOffset: 0,
        pageSize: 2,
      });
      expect(contacts.data.length).toBeLessThan(3);
    });

    if (Platform.OS === 'android') {
      it('Contacts.getContactsAsync() sorts contacts by first name', async () => {
        const { data: contacts } = await Contacts.getContactsAsync({
          fields: [Contacts.SortTypes.FirstName],
          sort: Contacts.SortTypes.FirstName,
          pageOffset: 0,
          pageSize: 5,
        });

        await sortContacts(contacts, Contacts.SortTypes.FirstName, expect);
      });
      it('Contacts.getContactsAsync()sorts contacts by last name', async () => {
        const { data: contacts } = await Contacts.getContactsAsync({
          fields: [Contacts.SortTypes.LastName],
          sort: Contacts.SortTypes.LastName,
          pageOffset: 0,
          pageSize: 5,
        });

        await sortContacts(contacts, Contacts.SortTypes.LastName, expect);
      });
    }

    it('Contacts.getContactsAsync() respects the page offset', async () => {
      const firstPage = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers],
        pageOffset: 0,
        pageSize: 2,
      });
      const secondPage = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers],
        pageOffset: 1,
        pageSize: 2,
      });

      if (firstPage.data.length >= 3) {
        expect(firstPage.data.length).toBe(2);
        expect(secondPage.data.length).toBe(2);
        expect(firstPage.data[0].id).not.toBe(secondPage.data[0].id);
        expect(firstPage.data[1].id).not.toBe(secondPage.data[1].id);
        expect(firstPage.data[1].id).toBe(secondPage.data[0].id);
      }
    });

    it('Contacts.getContactByIdAsync() gets a result of right shape', async () => {
      const fields = {
        [Contacts.Fields.FirstName]: 'Tommy',
        [Contacts.Fields.LastName]: 'Wiseau',
        [Contacts.Fields.JobTitle]: 'Director',
        [Contacts.Fields.PhoneNumbers]: [
          {
            number: '123456789',
            label: 'work',
          },
        ],
        [Contacts.Fields.Emails]: [
          {
            email: 'tommy@ohhimark.com',
            label: 'unknown',
          },
        ],
      };

      const fakeContactId = await createContact(fields);

      const contact = await Contacts.getContactByIdAsync(fakeContactId, [
        Contacts.Fields.PhoneNumbers,
        Contacts.Fields.Emails,
      ]);

      const { phoneNumbers, emails } = contact;

      expect(contact.note).toBeUndefined();
      expect(contact.relationships).toBeUndefined();
      expect(contact.addresses).toBeUndefined();

      expect(phoneNumbers[0]).toEqual(
        jasmine.objectContaining({
          id: jasmine.any(String),
          label: jasmine.any(String),
          number: jasmine.any(String),
        })
      );

      expect(contact).toEqual(
        jasmine.objectContaining({
          contactType: jasmine.any(String),
          firstName: jasmine.any(String),
          id: jasmine.any(String),
        })
      );
      expect(contact.imageAvailable).toBeDefined();
      expect(Array.isArray(emails)).toBe(true);
    });

    it('Contacts.getContactByIdAsync() checks shape of the inserted contacts', async () => {
      expect(createdContacts.length).toBeGreaterThan(0);

      await Promise.all(
        createdContacts.map(async ({ id, contact: expectedContact }) => {
          const contact = await Contacts.getContactByIdAsync(id);
          if (contact) {
            expect(contact).toBeDefined();
            expect(compareObjects(contact, expectedContact)).toBe(true);
          }
        })
      );
    });

    it('Contacts.updateContactAsync() updates contact', async () => {
      const contactId = await createSimpleContact('Andrew', 'Smith');

      const updates = {
        [Contacts.Fields.ID]: contactId,
        [Contacts.Fields.FirstName]: 'Andy',
      };

      const id = await Contacts.updateContactAsync(updates);

      expect(id).toBeDefined();
      expect(id).toEqual(contactId);

      const result = await Contacts.getContactByIdAsync(contactId, [Contacts.Fields.FirstName]);
      expect(result[Contacts.Fields.FirstName]).toEqual('Andy');
    });

    it('Contacts.removeContactAsync() finishes successfully', async () => {
      const contactId = await createSimpleContact('Hi', 'Joe');

      let errorMessage;
      try {
        await Contacts.removeContactAsync(contactId);
      } catch ({ message }) {
        errorMessage = message;
      }
      expect(errorMessage).toBeUndefined();
    });

    it('Contacts.removeContactAsync() cannot get deleted contact', async () => {
      const contactId = await createSimpleContact('Hi', 'Joe');
      await Contacts.removeContactAsync(contactId);
      const contact = await Contacts.getContactByIdAsync(contactId);
      expect(contact).toBeUndefined();
    });

    const testGroupName = 'Test Expo Contacts';
    let firstGroup;
    let testGroups = [];

    it(`Contacts.createGroupAsync() creates a group named ${testGroupName}`, async () => {
      let errorMessage;
      let groupId;
      try {
        groupId = await Contacts.createGroupAsync(testGroupName);
      } catch ({ message }) {
        errorMessage = message;
      } finally {
        if (isAndroid) {
          expect(errorMessage).toBe(
            `The method or property Contacts.createGroupAsync is not available on android, are you sure you've linked all the native dependencies properly?`
          );
        } else {
          expect(typeof groupId).toBe('string');
        }
      }
    });

    it('Contacts.getGroupsAsync() gets all groups', async () => {
      let errorMessage;
      let groups;
      try {
        groups = await Contacts.getGroupsAsync({});
        firstGroup = groups[0];
      } catch ({ message }) {
        errorMessage = message;
      } finally {
        if (isAndroid) {
          expect(errorMessage).toBe(
            `The method or property Contacts.getGroupsAsync is not available on android, are you sure you've linked all the native dependencies properly?`
          );
        } else {
          expect(Array.isArray(groups)).toBe(true);
          expect(groups.length).toBeGreaterThan(0);
        }
      }
    });

    it(`Contacts.getGroupsAsync() gets groups named "${testGroupName}"`, async () => {
      let errorMessage;
      const groupName = testGroupName;
      let groups;
      try {
        groups = await Contacts.getGroupsAsync({
          groupName,
        });
        testGroups = groups;
      } catch ({ message }) {
        errorMessage = message;
      } finally {
        if (isAndroid) {
          expect(errorMessage).toBe(
            `The method or property Contacts.getGroupsAsync is not available on android, are you sure you've linked all the native dependencies properly?`
          );
        } else {
          expect(Array.isArray(groups)).toBe(true);
          expect(groups.length).toBeGreaterThan(0);

          for (const group of groups) {
            expect(group.name).toBe(groupName);
          }
        }
      }
    });

    it('Contacts.getDefaultContainerIdAsync() gets groups in default container', async () => {
      let errorMessage;
      let groups;
      try {
        const containerId = await Contacts.getDefaultContainerIdAsync();
        groups = await Contacts.getGroupsAsync({
          containerId,
        });
      } catch ({ message }) {
        errorMessage = message;
      } finally {
        if (isAndroid) {
          expect(errorMessage).toBe(
            `The method or property Contacts.getDefaultContainerIdentifierAsync is not available on android, are you sure you've linked all the native dependencies properly?`
          );
        } else {
          expect(Array.isArray(groups)).toBe(true);
          expect(groups.length).toBeGreaterThan(0);
        }
      }
    });

    if (!isAndroid) {
      it('Contacts.getGroupsAsync() gets group with ID', async () => {
        const groups = await Contacts.getGroupsAsync({
          groupId: firstGroup.id,
        });
        expect(Array.isArray(groups)).toBe(true);
        expect(groups.length).toBe(1);
        expect(groups[0].id).toBe(firstGroup.id);
      });
    }

    it(`Contacts.removeGroupAsync() remove all groups named ${testGroupName}`, async () => {
      if (isAndroid) {
        let errorMessage;
        try {
          await Contacts.removeGroupAsync('some-value');
        } catch (e) {
          errorMessage = e.message;
        } finally {
          expect(errorMessage).toBe(
            `The method or property Contacts.removeGroupAsync is not available on android, are you sure you've linked all the native dependencies properly?`
          );
        }
      } else {
        for (const group of testGroups) {
          let errorMessage;
          try {
            await Contacts.removeGroupAsync(group.id);
          } catch (e) {
            errorMessage = e.message;
          }
          expect(errorMessage).toBeUndefined();
        }
      }
    });

    it('Contacts.getDefaultContainerIdAsync() default container exists', async () => {
      let errorMessage;
      let defaultContainerId;
      try {
        defaultContainerId = await Contacts.getDefaultContainerIdAsync();
      } catch ({ message }) {
        errorMessage = message;
      } finally {
        if (isAndroid) {
          expect(errorMessage).toBe(
            `The method or property Contacts.getDefaultContainerIdentifierAsync is not available on android, are you sure you've linked all the native dependencies properly?`
          );
        } else {
          expect(typeof defaultContainerId).toBe('string');
        }
      }
    });
  });
}
