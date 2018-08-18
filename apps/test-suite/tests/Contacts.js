'use strict';

import { Contacts, Permissions } from 'expo';
import { Platform } from 'react-native';
import * as TestUtils from '../TestUtils';

export const name = 'Contacts';

async function sortContacts(t, sortField) {
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
      console.log('sort', { propA, propB, sortField, order });
      t.expect(Math.max(order, 0)).toBe(0);
    }
  }
}

export async function test(t) {
  const shouldSkipTestsRequiringPermissions = await TestUtils.shouldSkipTestsRequiringPermissionsAsync();
  const describeWithPermissions = shouldSkipTestsRequiringPermissions ? t.xdescribe : t.describe;

  describeWithPermissions('Contacts', () => {
    let firstContact;

    if (Platform.OS === 'ios') {
      let customContactId;
      t.describe('Contacts.addContactAsync()', () => {
        t.it('creates contact', async () => {
          customContactId = await Contacts.addContactAsync({
            [Contacts.Fields.FirstName]: 'Eric',
            [Contacts.Fields.LastName]: 'Cartman',
            [Contacts.Fields.JobTitle]: 'Actor',
          });
          console.log({ customContactId });
          t.expect(typeof customContactId).toBe('string');
        });
      });

      t.describe('Contacts.writeContactToFileAsync()', () => {
        t.it('returns uri', async () => {
          const localUri = await Contacts.writeContactToFileAsync({ id: customContactId });
          console.log(localUri);
          t.expect(typeof localUri).toBe('string');
        });
      });

      t.describe('Contacts.removeContactAsync()', () => {
        t.it('removes contact', async () => {
          const success = await Contacts.removeContactAsync(customContactId);
          t.expect(!!success).toBe(true);
        });
      });
    }

    t.describe('Contacts.getContactsAsync()', () => {
      t.it('gets permission and at least one result, all results of right shape', async () => {
        await TestUtils.acceptPermissionsAndRunCommandAsync(() => {
          return Permissions.askAsync(Permissions.CONTACTS);
        });
        let contacts = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
          pageSize: 20,
        });
        t.expect(contacts.data.length > 0).toBe(true);
        contacts.data.forEach(({ id, name, phoneNumbers, emails }) => {
          t.expect(typeof id === 'string' || typeof id === 'number').toBe(true);
          t.expect(typeof name === 'string' || typeof name === 'undefined').toBe(true);
          t.expect(Array.isArray(phoneNumbers) || typeof phoneNumbers === 'undefined').toBe(true);
          t.expect(Array.isArray(emails) || typeof emails === 'undefined').toBe(true);
        });
        firstContact = contacts.data[0];
      });

      t.it('skips phone number if not asked', async () => {
        const contacts = await Contacts.getContactsAsync({
          fields: [Contacts.EMAILS],
        });
        t.expect(contacts.data.length > 0).toBe(true);
        contacts.data.forEach(({ id, name, phoneNumbers, emails }) => {
          t.expect(typeof phoneNumbers === 'undefined').toBe(true);
        });
      });

      t.it('skips email if not asked', async () => {
        const contacts = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.PhoneNumbers],
        });
        t.expect(contacts.data.length > 0).toBe(true);
        contacts.data.forEach(({ id, name, phoneNumbers, emails }) => {
          t.expect(typeof emails === 'undefined').toBe(true);
        });
      });

      t.it('respects the page size', async () => {
        const contacts = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.PhoneNumbers],
          pageOffset: 0,
          pageSize: 2,
        });
        if (contacts.data.length >= 2) {
          t.expect(contacts.data.length).toBe(2);
        }
      });

      if (Platform.OS === 'android') {
        t.it('sorts contacts by first name', async () => {
          await sortContacts(t, Contacts.SortTypes.FirstName);
        });
        t.it('sorts contacts by last name', async () => {
          await sortContacts(t, Contacts.SortTypes.LastName);
        });
      }

      t.it('respects the page offset', async () => {
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
          t.expect(firstPage.data.length).toBe(2);
          t.expect(secondPage.data.length).toBe(2);
          t.expect(firstPage.data[0].id).not.toBe(secondPage.data[0].id);
          t.expect(firstPage.data[1].id).not.toBe(secondPage.data[1].id);
          t.expect(firstPage.data[1].id).toBe(secondPage.data[0].id);
        }
      });
    });

    t.describe('Contacts.getContactByIdAsync()', () => {
      t.it('gets a result of right shape', async () => {
        if (firstContact) {
          const contact = await Contacts.getContactByIdAsync(firstContact.id, [
            Contacts.Fields.PhoneNumbers,
            Contacts.Fields.Emails,
          ]);
          const { id, name, phoneNumbers, emails } = contact;
          t.expect(typeof id === 'string' || typeof id === 'number').toBe(true);
          t.expect(typeof name === 'string' || typeof name === 'undefined').toBe(true);
          t.expect(Array.isArray(phoneNumbers) || typeof phoneNumbers === 'undefined').toBe(true);
          t.expect(Array.isArray(emails) || typeof emails === 'undefined').toBe(true);
        }
      });
    });

    if (Platform.OS === 'ios') {
      const testGroupName = 'Test Expo Contacts';
      let firstGroup;
      let testGroups = [];

      t.describe('Contacts.createGroupAsync()', () => {
        t.it(`creates a group named ${testGroupName}`, async () => {
          const groupId = await Contacts.createGroupAsync(testGroupName);
          t.expect(typeof groupId).toBe('string');
        });
      });

      t.describe('Contacts.getGroupsAsync()', () => {
        t.it('gets all groups', async () => {
          const groups = await Contacts.getGroupsAsync({});
          firstGroup = groups[0];
          t.expect(Array.isArray(groups)).toBe(true);
          t.expect(groups.length).toBeGreaterThan(0);
        });
        t.it(`gets groups named "${testGroupName}"`, async () => {
          const groupName = testGroupName;
          const groups = await Contacts.getGroupsAsync({
            groupName,
          });
          testGroups = groups;
          console.log('all thingas', { groups });

          t.expect(Array.isArray(groups)).toBe(true);
          t.expect(groups.length).toBeGreaterThan(0);

          for (const group of groups) {
            t.expect(group.name).toBe(groupName);
          }
        });
        t.it('gets groups in default container', async () => {
          const groups = await Contacts.getGroupsAsync({
            containerId: await Contacts.getDefaultContainerIdAsync(),
          });
          t.expect(Array.isArray(groups)).toBe(true);
          t.expect(groups.length).toBeGreaterThan(0);
        });

        t.it('gets group with ID', async () => {
          const groups = await Contacts.getGroupsAsync({
            groupId: firstGroup.id,
          });
          t.expect(Array.isArray(groups)).toBe(true);
          t.expect(groups.length).toBe(1);
          t.expect(groups[0].id).toBe(firstGroup.id);
        });
      });

      t.describe('Contacts.removeGroupAsync()', () => {
        t.it(`remove all groups named ${testGroupName}`, async () => {
          for (let group of testGroups) {
            console.log('removeGroupAsync', group);
            const success = await Contacts.removeGroupAsync(group.id);
            t.expect(!!success).toBe(true);
          }
        });
      });

      t.describe('Contacts.getDefaultContainerIdAsync()', () => {
        t.it('default container exists', async () => {
          const defaultContainerId = await Contacts.getDefaultContainerIdAsync();
          t.expect(typeof defaultContainerId).toBe('string');
        });
      });
    }
  });
}
