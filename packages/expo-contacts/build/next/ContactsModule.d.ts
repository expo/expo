import { NativeModule } from 'expo-modules-core';
import { Contact as ContactType } from './types/Contact.type';
import { ContactField, CreateContactRecord, PartialContactDetails } from './types/ContactProps.type';
declare class ExpoContactsModule extends NativeModule {
    Contact: typeof ContactType;
}
declare const expoContactsModule: ExpoContactsModule;
export declare class Contact extends expoContactsModule.Contact {
    static requestPermissionsAsync(): Promise<{
        granted: boolean;
    }>;
    static create(contact: CreateContactRecord): Promise<ContactType>;
    static getAll(): Promise<Contact[]>;
    static addWithForm(contact: CreateContactRecord): Promise<Boolean>;
    static pick(): Promise<Contact>;
    static getAllWithDetails<T extends readonly ContactField[]>(fields: T): Promise<PartialContactDetails<T>[]>;
}
export {};
//# sourceMappingURL=ContactsModule.d.ts.map