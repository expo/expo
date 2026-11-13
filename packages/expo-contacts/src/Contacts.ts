import { UnavailabilityError } from 'expo';
import type { EventSubscription } from 'expo';

import expoContactsModule from './ExpoContactsNext';
import type { ContactsPermissionResponse } from './types/Permissions';

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
 * const subscription = Contacts.addContactsChangeListener(() => {
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
 * Removes all contact change listeners registered with `Contacts.addContactsChangeListener`.
 */
export function removeAllContactsChangeListeners(): void {
  expoContactsModule.removeAllListeners('contactsDidChange');
}

/**
 * Checks user's permissions for accessing contacts data.
 * @returns A promise that resolves to a [`ContactsPermissionResponse`](#contactspermissionresponse) object.
 */
export async function getPermissions(): Promise<ContactsPermissionResponse> {
  return expoContactsModule.getPermissionsAsync();
}

/**
 * Asks the user to grant permissions for accessing contacts data.
 * @returns A promise that resolves to a [`ContactsPermissionResponse`](#contactspermissionresponse) object.
 */
export async function requestPermissions(): Promise<ContactsPermissionResponse> {
  return expoContactsModule.requestPermissionsAsync();
}
