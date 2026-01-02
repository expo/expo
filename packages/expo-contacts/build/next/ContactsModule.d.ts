import { NativeModule } from 'expo-modules-core';
import { Contact as ContactType } from './types/Contact';
import { Container as ContainerType } from './types/Container';
import { Group as GroupType } from './types/Group';
declare class ExpoContactsModule extends NativeModule {
    ContactNext?: typeof ContactType;
    Contact: typeof ContactType;
    Group: typeof GroupType;
    Container: typeof ContainerType;
}
declare const expoContactsModule: ExpoContactsModule;
export declare class Contact extends expoContactsModule.Contact {
}
declare const Group_base: typeof GroupType;
export declare class Group extends Group_base {
}
declare const Container_base: typeof ContainerType;
export declare class Container extends Container_base {
}
export {};
//# sourceMappingURL=ContactsModule.d.ts.map