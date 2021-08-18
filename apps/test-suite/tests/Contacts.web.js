import * as Contacts from 'expo-contacts';
import { Platform, UnavailabilityError } from 'expo-modules-core';

export const name = 'Contacts';

const unavailableMessage = `is unavailable on ${Platform.OS}`;

/* AFAIK there is no native API for using Contacts on the web platform. */

export async function test({ describe, it, expect }) {
  async function executeFailingMethod(method) {
    try {
      await method();
      expect(true).toBe(false);
    } catch (error) {
      expect(error instanceof UnavailabilityError).toBeTruthy();
    }
  }

  describe('addContactAsync()', () => {
    it(unavailableMessage, () => executeFailingMethod(Contacts.addContactAsync));
  });
  describe('writeContactToFileAsync()', () => {
    it(unavailableMessage, () => executeFailingMethod(Contacts.writeContactToFileAsync));
  });
  describe('removeContactAsync()', () => {
    it(unavailableMessage, () => executeFailingMethod(Contacts.removeContactAsync));
  });
  describe('getContactsAsync()', () => {
    it(unavailableMessage, () => executeFailingMethod(Contacts.getContactsAsync));
  });
  describe('getContactByIdAsync()', () => {
    it(unavailableMessage, () => executeFailingMethod(Contacts.getContactByIdAsync));
  });
  describe('createGroupAsync()', () => {
    it(unavailableMessage, () => executeFailingMethod(Contacts.createGroupAsync));
  });
  describe('getGroupsAsync()', () => {
    it(unavailableMessage, () => executeFailingMethod(Contacts.getGroupsAsync));
  });
  describe('removeGroupAsync()', () => {
    it(unavailableMessage, () => executeFailingMethod(Contacts.removeGroupAsync));
  });
  describe('getDefaultContainerIdAsync()', () => {
    it(unavailableMessage, () => executeFailingMethod(Contacts.getDefaultContainerIdAsync));
  });
}
