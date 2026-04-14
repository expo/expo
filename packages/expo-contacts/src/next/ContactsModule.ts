import {
  NativeModule,
  Platform,
  UnavailabilityError,
  requireNativeModule,
} from 'expo-modules-core';
import type { EventSubscription } from 'expo-modules-core';

import type { Contact as ContactType } from './types/Contact';
import type { Container as ContainerType } from './types/Container';
import { FallbackContainer } from './types/Container';
import type { Group as GroupType } from './types/Group';
import { FallbackGroup } from './types/Group';

type ExpoContactsEvents = {
  contactsDidChange: () => void;
};

declare class ExpoContactsModule extends NativeModule<ExpoContactsEvents> {
  ContactNext?: typeof ContactType;
  Contact: typeof ContactType;
  Group: typeof GroupType;
  Container: typeof ContainerType;
}

const expoContactsModule = requireNativeModule<ExpoContactsModule>('ExpoContactsNext');

if (Platform.OS === 'ios' && expoContactsModule.ContactNext) {
  expoContactsModule.Contact = expoContactsModule.ContactNext;
}

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
 * Adds a listener that is called when contacts are added, updated, or deleted.
 *
 * **Platform differences:**
 * - **Android**: Uses `ContentObserver`, which may delay notifications by 5-7 seconds. Because it observes both `RawContacts` and `Contacts`, some changes may emit two events.
 * - **iOS**: Uses `CNContactStoreDidChangeNotification` and emits updates immediately.
 *
 * On Android, the delay comes from the system contact provider batching notifications for performance and battery life.
 * If your app needs fresher data after returning from the native Contacts app, consider refreshing contacts when the app comes back to the foreground.
 *
 * @param listener A callback invoked when contacts change. The callback receives no arguments.
 * @returns A subscription object with a `remove` method that stops listening for changes.
 * @example
 * ```jsx
 * const subscription = Contacts.addContactChangeListener(() => {
 *   console.log('Contacts changed - refreshing contact list');
 *   loadContacts();
 * });
 *
 * subscription.remove();
 * ```
 */
export function addContactsChangeListener(listener: () => void): EventSubscription {
  if (!expoContactsModule.addListener) {
    throw new UnavailabilityError('Contacts', 'addContactsChangeListener');
  }
  return expoContactsModule.addListener('contactsDidChange', listener);
}

/**
 * Removes all contact change listeners registered with `addContactsChangeListener`.
 */
export function removeAllContactsChangeListeners(): void {
  expoContactsModule.removeAllListeners('contactsDidChange');
}
