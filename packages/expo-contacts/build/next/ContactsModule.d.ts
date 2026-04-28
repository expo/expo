import { NativeModule } from 'expo-modules-core';
import type { EventSubscription } from 'expo-modules-core';
import type { Contact as ContactType } from './types/Contact';
import type { Container as ContainerType } from './types/Container';
import type { Group as GroupType } from './types/Group';
type ExpoContactsEvents = {
    contactsDidChange: () => void;
};
declare class ExpoContactsModule extends NativeModule<ExpoContactsEvents> {
    ContactNext?: typeof ContactType;
    Contact: typeof ContactType;
    Group: typeof GroupType;
    Container: typeof ContainerType;
}
declare const expoContactsModule: ExpoContactsModule;
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
export declare class Contact extends expoContactsModule.Contact {
}
declare const Group_base: typeof GroupType;
/**
 * Represents a group of contacts (for example, "Family", "Coworkers").
 * Groups belong to a specific Container and can contain multiple Contacts.
 * @platform ios
 */
export declare class Group extends Group_base {
}
declare const Container_base: typeof ContainerType;
/**
 * Represents a container for contacts.
 * A container (often called an "Account" in UI terms) is a source of contacts, such as a local device storage, iCloud, Google, or Exchange account.
 * @platform ios
 */
export declare class Container extends Container_base {
}
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
export declare function addContactsChangeListener(listener: () => void): EventSubscription;
/**
 * Removes all contact change listeners registered with `addContactsChangeListener`.
 */
export declare function removeAllContactsChangeListeners(): void;
export {};
//# sourceMappingURL=ContactsModule.d.ts.map