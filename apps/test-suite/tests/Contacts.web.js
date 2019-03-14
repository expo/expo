import { Contacts } from 'expo';
import { Platform, UnavailabilityError } from '@unimodules/core';

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

  describe('Contacts.addContactAsync()', () => {
    it(unavailableMessage, () => executeFailingMethod(Contacts.addContactAsync));
  });
  describe('Contacts.writeContactToFileAsync()', () => {
    it(unavailableMessage, () => executeFailingMethod(Contacts.writeContactToFileAsync));
  });
  describe('Contacts.removeContactAsync()', () => {
    it(unavailableMessage, () => executeFailingMethod(Contacts.removeContactAsync));
  });
  describe('Contacts.getContactsAsync()', () => {
    it(unavailableMessage, () => executeFailingMethod(Contacts.getContactsAsync));
  });
  describe('Contacts.getContactByIdAsync()', () => {
    it(unavailableMessage, () => executeFailingMethod(Contacts.getContactByIdAsync));
  });
  describe('Contacts.createGroupAsync()', () => {
    it(unavailableMessage, () => executeFailingMethod(Contacts.createGroupAsync));
  });
  describe('Contacts.getGroupsAsync()', () => {
    it(unavailableMessage, () => executeFailingMethod(Contacts.getGroupsAsync));
  });
  describe('Contacts.removeGroupAsync()', () => {
    it(unavailableMessage, () => executeFailingMethod(Contacts.removeGroupAsync));
  });
  describe('Contacts.getDefaultContainerIdAsync()', () => {
    it(unavailableMessage, () => executeFailingMethod(Contacts.getDefaultContainerIdAsync));
  });
}
