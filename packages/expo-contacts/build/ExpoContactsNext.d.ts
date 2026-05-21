import { NativeModule } from 'expo-modules-core';
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
declare const expoContactsModule: ExpoContactsModule;
export default expoContactsModule;
//# sourceMappingURL=ExpoContactsNext.d.ts.map