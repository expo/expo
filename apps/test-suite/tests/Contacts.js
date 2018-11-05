'use strict';

import { Contacts, Permissions } from 'expo';
import { Platform } from 'react-native';
import * as TestUtils from '../TestUtils';

export const name = 'Contacts';

async function sortContacts(expect, sortField) {
  const { data: contacts } = await Contacts.getContactsAsync({
    fields: [sortField],
    sort: sortField,
    pageOffset: 0,
    pageSize: 5,
  });

  for (let i = 1; i < contacts.length; i++) {
    const { [sortField]: propA } = contacts[i - 1];
    const { [sortField]: propB } = contacts[i];
    if (propA && propB) {
      const order = propA.localeCompare(propB);
      expect(Math.max(order, 0)).toBe(0);
    }
  }
}

export async function test({ describe, it, xdescribe, jasmine, expect }) {
  const shouldSkipTestsRequiringPermissions = await TestUtils.shouldSkipTestsRequiringPermissionsAsync();
  const describeWithPermissions = shouldSkipTestsRequiringPermissions ? xdescribe : describe;

  describeWithPermissions('Contacts', () => {
    let firstContact;
    const isAndroid = Platform.OS !== 'ios';
    const testGroupName = 'Test Expo Contacts';
    let firstGroup;
    let testGroups = [];

    if (Platform.OS === 'ios') {
      let customContactId;
      describe('Contacts.addContactAsync()', () => {
        it('creates contact', async () => {
          customContactId = await Contacts.addContactAsync({
            [Contacts.Fields.FirstName]: 'Eric',
            [Contacts.Fields.LastName]: 'Cartman',
            [Contacts.Fields.JobTitle]: 'Actor',
          });
          expect(typeof customContactId).toBe('string');
        });
      });

      describe('Contacts.writeContactToFileAsync()', () => {
        it('returns uri', async () => {
          const localUri = await Contacts.writeContactToFileAsync({ id: customContactId });

          expect(typeof localUri).toBe('string');
        });
      });

      describe('Contacts.removeContactAsync()', () => {
        it('removes contact', async () => {
          let errorMessage;
          try {
            await Contacts.removeContactAsync(customContactId);
          } catch ({ message }) {
            errorMessage = message;
          }
          expect(errorMessage).toBeUndefined();
        });
      });
    }

    describe('Contacts.getContactsAsync()', () => {
      it('gets permission and at least one result, all results of right shape', async () => {
        await TestUtils.acceptPermissionsAndRunCommandAsync(() => {
          return Permissions.askAsync(Permissions.CONTACTS);
        });
        let contacts = await Contacts.getContactsAsync({
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
        firstContact = contacts.data[0];
      });

      it('returns correct shape', async () => {
        const {
          data,
          hasNextPage,
          hasPreviousPage,
          total,
          ...props
        } = await Contacts.getContactsAsync({
          pageSize: 1,
        });

        // Test some constant values

        expect(data).toBeDefined();

        expect(typeof hasNextPage).toBe('boolean');
        expect(typeof hasPreviousPage).toBe('boolean');
        expect(typeof total).toBe('number');

        expect(data.length).toBe(1);
        expect(hasPreviousPage).toBe(false);
        //This could fail, if the device only has 1 contact
        expect(hasNextPage).toBe(true);
        //This could fail, if the device only has 1 contact
        expect(total).toBeGreaterThan(1);

        // Nothing else.
        expect(Object.keys(props).length).toBe(0);

        // Test a contact
        expect(data[0]).toEqual(
          jasmine.objectContaining({
            contactType: jasmine.any(String),
            name: jasmine.any(String),
            id: jasmine.any(String),
          })
        );
        expect(data[0].imageAvailable).toBeDefined();
      });

      async function getContactAtIndex(index, fields) {
        // Make sure the contact has a phone number to skip!
        const { data } = await Contacts.getContactsAsync({
          fields,
          pageSize: 1,
          pageOffset: index,
        });
        return data[0];
      }

      it('skips phone number if not asked', async () => {
        // This may need to be tweaked because you cannot add test contacts on android
        const testIndex = 1;
        const initialContact = await getContactAtIndex(testIndex, [Contacts.Fields.PhoneNumbers]);
        expect(initialContact.phoneNumbers).toBeDefined();
        expect(initialContact.phoneNumbers.length).toBeGreaterThan(0);
        expect(initialContact.phoneNumbers[0]).toEqual(
          jasmine.objectContaining({
            id: jasmine.any(String),
            label: jasmine.any(String),
            number: jasmine.any(String),
          })
        );

        const initialContactWithoutNumbers = await getContactAtIndex(testIndex, []);
        expect(initialContactWithoutNumbers.phoneNumbers).toBeUndefined();
      });

      it('gets a local image', async () => {
        // This may need to be tweaked because you cannot add test contacts on android
        const contact = await getContactAtIndex(0, [Contacts.Fields.Image, 'imageBase64']);
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

      it('respects the page size', async () => {
        const contacts = await Contacts.getContactsAsync({
          fields: [],
          pageOffset: 0,
          pageSize: 2,
        });
        expect(contacts.data.length).toBeLessThan(3);
      });

      if (Platform.OS === 'android') {
        it('sorts contacts by first name', async () => {
          await sortContacts(expect, Contacts.SortTypes.FirstName);
        });
        it('sorts contacts by last name', async () => {
          await sortContacts(expect, Contacts.SortTypes.LastName);
        });
      }

      it('respects the page offset', async () => {
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
    });

    describe('Contacts.getContactByIdAsync()', () => {
      it('gets a result of right shape', async () => {
        if (firstContact) {
          const contact = await Contacts.getContactByIdAsync(firstContact.id, [
            Contacts.Fields.PhoneNumbers,
            Contacts.Fields.Emails,
          ]);
          const { id, name, phoneNumbers, emails } = contact;

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
              name: jasmine.any(String),
              id: jasmine.any(String),
            })
          );
          expect(contact.imageAvailable).toBeDefined();
          expect(Array.isArray(emails) || typeof emails === 'undefined').toBe(true);
        }
      });
    });

    describe('Contacts.createGroupAsync()', () => {
      it(`creates a group named ${testGroupName}`, async () => {
        let errorMessage;
        let groupId;
        try {
          groupId = await Contacts.createGroupAsync(testGroupName);
        } catch ({ message }) {
          errorMessage = message;
        } finally {
          if (isAndroid) {
            expect(errorMessage).toBe('Error: Contacts.createGroupAsync: iOS Only');
          } else {
            expect(typeof groupId).toBe('string');
          }
        }
      });
    });

    describe('Contacts.getGroupsAsync()', () => {
      it('gets all groups', async () => {
        let errorMessage;
        let groups;
        try {
          groups = await Contacts.getGroupsAsync({});
          firstGroup = groups[0];
        } catch ({ message }) {
          errorMessage = message;
        } finally {
          if (isAndroid) {
            expect(errorMessage).toBe('Error: Contacts.getGroupsAsync: iOS Only');
          } else {
            expect(Array.isArray(groups)).toBe(true);
            expect(groups.length).toBeGreaterThan(0);
          }
        }
      });
      it(`gets groups named "${testGroupName}"`, async () => {
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
            expect(errorMessage).toBe('Error: Contacts.getGroupsAsync: iOS Only');
          } else {
            expect(Array.isArray(groups)).toBe(true);
            expect(groups.length).toBeGreaterThan(0);

            for (const group of groups) {
              expect(group.name).toBe(groupName);
            }
          }
        }
      });
      it('gets groups in default container', async () => {
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
            expect(errorMessage).toBe('Error: Contacts.getDefaultContainerIdAsync: iOS Only');
          } else {
            expect(Array.isArray(groups)).toBe(true);
            expect(groups.length).toBeGreaterThan(0);
          }
        }
      });

      if (!isAndroid) {
        it('gets group with ID', async () => {
          const groups = await Contacts.getGroupsAsync({
            groupId: firstGroup.id,
          });
          expect(Array.isArray(groups)).toBe(true);
          expect(groups.length).toBe(1);
          expect(groups[0].id).toBe(firstGroup.id);
        });
      }
    });

    describe('Contacts.removeGroupAsync()', () => {
      it(`remove all groups named ${testGroupName}`, async () => {
        if (isAndroid) {
          let errorMessage;
          try {
            const success = await Contacts.removeGroupAsync('some-value');
          } catch ({ message }) {
            errorMessage = message;
          } finally {
            expect(errorMessage).toBe('Error: Contacts.removeGroupAsync: iOS Only');
          }
        } else {
          for (let group of testGroups) {
            let errorMessage;
            try {
              await Contacts.removeGroupAsync(group.id);
            } catch ({ message }) {
              errorMessage = message;
            }
            expect(errorMessage).toBeUndefined();
          }
        }
      });
    });

    describe('Contacts.getDefaultContainerIdAsync()', () => {
      it('default container exists', async () => {
        let errorMessage;
        let defaultContainerId;
        try {
          defaultContainerId = await Contacts.getDefaultContainerIdAsync();
        } catch ({ message }) {
          errorMessage = message;
        } finally {
          if (isAndroid) {
            expect(errorMessage).toBe('Error: Contacts.getDefaultContainerIdAsync: iOS Only');
          } else {
            expect(typeof defaultContainerId).toBe('string');
          }
        }
      });
    });
  });
}
