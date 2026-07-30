import { NativeModule, Platform, requireNativeModule } from 'expo';

import type { Contact } from './types/Contact';
import type { Container } from './types/Container';
import type { Group } from './types/Group';
import type { ContactsPermissionResponse } from './types/Permissions';

type ExpoContactsEvents = {
  contactsDidChange: () => void;
};

export declare class ExpoContactsModule extends NativeModule<ExpoContactsEvents> {
  ContactNext?: typeof Contact;
  Contact: typeof Contact;
  Group?: typeof Group;
  Container?: typeof Container;
  getPermissionsAsync(): Promise<ContactsPermissionResponse>;
  requestPermissionsAsync(): Promise<ContactsPermissionResponse>;
}

const expoContactsModule = requireNativeModule<ExpoContactsModule>('ExpoContactsNext');

if (Platform.OS === 'ios' && expoContactsModule.ContactNext) {
  expoContactsModule.Contact = expoContactsModule.ContactNext;
}

export default expoContactsModule;
