import { NativeModule, Platform, requireNativeModule } from 'expo-modules-core';
import { Contact as ContactType } from './types/Contact.type';
import {
  ContactField,
  CreateContactRecord,
  PartialContactDetails,
} from './types/ContactProps.type';

declare class ExpoContactsModule extends NativeModule {
  Contact: typeof ContactType;
}

const expoContactsModule = requireNativeModule<ExpoContactsModule>('ExpoContactsNext');

if (Platform.OS === 'ios') {
  expoContactsModule.Contact = expoContactsModule.ContactNext;
}

export class Contact extends expoContactsModule.Contact {
  static async requestPermissionsAsync(): Promise<{ granted: boolean }> {
    return await expoContactsModule.requestPermissionsAsync();
  }

  static async create(contact: CreateContactRecord): Promise<ContactType> {
    return await expoContactsModule.createContact(contact);
  }
  static async getAll(): Promise<Contact[]> {
    return await expoContactsModule.getAllContact();
  }

  static async addWithForm(contact: CreateContactRecord): Promise<Boolean> {
    return await expoContactsModule.addWithFormContact(contact);
  }

  static async pick(): Promise<Contact> {
    return await expoContactsModule.pickContact();
  }
  static async getAllWithDetails<T extends readonly ContactField[]>(
    fields: T
  ): Promise<PartialContactDetails<T>[]> {
    return await expoContactsModule.getAllWithDetailsContact(fields);
  }
}
