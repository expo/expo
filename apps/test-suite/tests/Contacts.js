'use strict';

import { Asset } from 'expo-asset';
import * as Contacts from 'expo-contacts';
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
      const order = propA.toLowerCase().localeCompare(propB.toLowerCase());
      expect(Math.max(order, 0)).toBe(0);
    }
  }
}

async function getContactAtIndex(index, fields) {
  // Make sure the contact has a phone number to skip!
  const { data } = await Contacts.getContactsAsync({
    fields,
    pageSize: 1,
    pageOffset: index,
  });
  return data[0];
}

export async function test({ describe, it, xdescribe, jasmine, expect, afterAll, beforeAll }) {
  const shouldSkipTestsRequiringPermissions = await TestUtils.shouldSkipTestsRequiringPermissionsAsync();
  const describeWithPermissions = shouldSkipTestsRequiringPermissions ? xdescribe : describe;

  function compareArrays(array, expected) {
    return expected.reduce(
      (result, expectedItem) =>
        result && array.filter(item => compareObjects(item, expectedItem)).length,
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

    describe('contacts management', () => {
      const createdContactIds = [];
      const createContact = async contact => {
        const id = await Contacts.addContactAsync(contact);
        createdContactIds.push({ id, contact });
        return id;
      };

      afterAll(async () => {
        await Promise.all(createdContactIds.map(async ({ id }) => Contacts.removeContactAsync(id)));
      });

      describe('Contacts.addContactAsync()', () => {
        it('creates contacts', async () => {
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
            contacts.map(async contact => {
              const id = await createContact(contact);
              expect(typeof id).toBe('string');
            })
          );
        });

        describe('creates contact with image', () => {
          let contactId;
          it('creates contact', async () => {
            const image = Asset.fromModule(require('../assets/icons/app.png'));
            await image.downloadAsync();
            contactId = await createContact({
              [Contacts.Fields.Image]: image.localUri,
              [Contacts.Fields.FirstName]: 'Kenny',
              [Contacts.Fields.LastName]: 'McCormick',
            });
            expect(typeof contactId).toBe('string');
          });

          it('gets a local image', async () => {
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
        });
      });

      describe('Contacts.writeContactToFileAsync()', () => {
        it('returns uri', async () => {
          createdContactIds.map(async ({ id }) => {
            const localUri = await Contacts.writeContactToFileAsync({ id });
            expect(typeof localUri).toBe('string');
          });
        });
      });

      describe('Contacts.getContactsAsync()', () => {
        it("returns undefined when contact doesn't exist", async () => {
          const contact = await Contacts.getContactByIdAsync('-1');

          expect(contact).toBeUndefined();
        });

        it('checks shape of all results', async () => {
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

        it('skips phone number if not asked', async () => {
          const initialContact = await getContactAtIndex(0, [Contacts.Fields.PhoneNumbers]);
          expect(initialContact.phoneNumbers).toBeDefined();
          expect(initialContact.phoneNumbers.length).toBeGreaterThan(0);
          expect(initialContact.phoneNumbers[0]).toEqual(
            jasmine.objectContaining({
              id: jasmine.any(String),
              label: jasmine.any(String),
              number: jasmine.any(String),
            })
          );

          const initialContactWithoutNumbers = await getContactAtIndex(0, []);
          expect(initialContactWithoutNumbers.phoneNumbers).toBeUndefined();
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
          if (!createdContactIds.length) {
            return;
          }

          const contact = await Contacts.getContactByIdAsync(createdContactIds[0].id, [
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
              name: jasmine.any(String),
              id: jasmine.any(String),
            })
          );
          expect(contact.imageAvailable).toBeDefined();
          expect(Array.isArray(emails) || typeof emails === 'undefined').toBe(true);
        });

        it('checks shape of the inserted contacts', async () => {
          await Promise.all(
            createdContactIds.map(async ({ id, contact: expectedContact }) => {
              const contact = await Contacts.getContactByIdAsync(id);
              expect(contact).toBeDefined();
              expect(compareObjects(contact, expectedContact)).toBe(true);
            })
          );
        });
      });

      describe('Contacts.updateContactAsync()', () => {
        let contactToUpdate;
        beforeAll(async () => {
          if (createdContactIds.length) {
            contactToUpdate = await Contacts.getContactByIdAsync(createdContactIds[0].id);
          }
        });

        it('updates contact', async () => {
          if (!contactToUpdate) {
            return;
          }

          contactToUpdate.firstName = 'UpdatedName';
          const id = await Contacts.updateContactAsync(contactToUpdate);

          expect(id).toBeDefined();
          expect(id).toEqual(contactToUpdate.id);
        });

        it('checks shape of updated contact', async () => {
          if (!contactToUpdate) {
            return;
          }

          const contact = await Contacts.getContactByIdAsync(contactToUpdate.id);
          expect(contact).toBeDefined();
          compareObjects(contact.firstName, 'UpdatedName');
        });
      });

      describe('Contacts.removeContactAsync', () => {
        let idToRemove;
        beforeAll(() => {
          const contact = createdContactIds.pop();
          if (contact) {
            idToRemove = contact.id;
          }
        });

        it('finishes successfully', async () => {
          if (!idToRemove) {
            return;
          }

          let errorMessage;
          try {
            await Contacts.removeContactAsync(idToRemove);
          } catch ({ message }) {
            errorMessage = message;
          }
          expect(errorMessage).toBeUndefined();
        });

        it('cannot get deleted contact', async () => {
          if (!idToRemove) {
            return;
          }

          const contact = await Contacts.getContactByIdAsync(idToRemove);

          expect(contact).toBeUndefined();
        });
      });
    });

    describe('groups management', () => {
      const testGroupName = 'Test Expo Contacts';
      let firstGroup;
      let testGroups = [];
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
              expect(errorMessage).toBe(
                `The method or property Contacts.createGroupAsync is not available on android, are you sure you've linked all the native dependencies properly?`
              );
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
              expect(errorMessage).toBe(
                `The method or property Contacts.getGroupsAsync is not available on android, are you sure you've linked all the native dependencies properly?`
              );
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
              await Contacts.removeGroupAsync('some-value');
            } catch ({ message }) {
              errorMessage = message;
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
              expect(errorMessage).toBe(
                `The method or property Contacts.getDefaultContainerIdentifierAsync is not available on android, are you sure you've linked all the native dependencies properly?`
              );
            } else {
              expect(typeof defaultContainerId).toBe('string');
            }
          }
        });
      });
    });
  });
}
