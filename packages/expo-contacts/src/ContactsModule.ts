import type { EventSubscription } from 'expo';

import * as Contacts from './Contacts';
import expoContactsModule from './ExpoContactsNext';
import { FallbackContainer } from './types/Container';
import { FallbackGroup } from './types/Group';

/**
 * Represents a contact in the device's address book.
 *
 * - Data Retrieval:
 * Contact details can be accessed using the `getDetails` method
 * or via specific getters such as `getEmails` and `getPhones`.
 *
 * - Modification:
 * To update the contact, use bulk operations via `patch` or `update`,
 * or specific modifiers like `addEmail` and `deletePhone`.
 * @example
 * ```ts
 * const contact = await Contact.create({
 *    givenName: 'John',
 *    familyName: 'Doe',
 *    phones: [{ label: 'mobile', number: '+12123456789' }]
 * });
 * ```
 */
export class Contact extends expoContactsModule.Contact {}

/**
 * Represents a group of contacts (for example, "Family", "Coworkers").
 * Groups belong to a specific Container and can contain multiple Contacts.
 * @platform ios
 */
export class Group extends (expoContactsModule.Group || FallbackGroup) {}

/**
 * Represents a container for contacts.
 * A container (often called an "Account" in UI terms) is a source of contacts, such as a local device storage, iCloud, Google, or Exchange account.
 * @platform ios
 */
export class Container extends (expoContactsModule.Container || FallbackContainer) {}

/**
 * @deprecated Use `Contacts.addContactsChangeListener()` instead.
 */
export function addContactsChangeListener(listener: () => void): EventSubscription {
  return Contacts.addContactsChangeListener(listener);
}

/**
 * @deprecated Use `Contacts.removeAllContactsChangeListeners()` instead.
 */
export function removeAllContactsChangeListeners(): void {
  Contacts.removeAllContactsChangeListeners();
}

/**
 * @deprecated Use `Contacts.getPermissions()` instead.
 */
export async function getPermissionsAsync() {
  return Contacts.getPermissions();
}

/**
 * @deprecated Use `Contacts.requestPermissions()` instead.
 */
export async function requestPermissionsAsync() {
  return Contacts.requestPermissions();
}
