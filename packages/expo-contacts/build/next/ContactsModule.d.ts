import { NativeModule } from 'expo-modules-core';
import { Contact as ContactType } from './types/Contact.type';
declare class ExpoContactsModule extends NativeModule {
    Contact: typeof ContactType;
}
declare const expoContactsModule: ExpoContactsModule;
export declare class Contact extends expoContactsModule.Contact {
}
declare const Group_base: any;
export declare class Group extends Group_base {
}
declare const Container_base: any;
export declare class Container extends Container_base {
}
export {};
//# sourceMappingURL=ContactsModule.d.ts.map