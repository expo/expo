import { NativeModule, Platform, requireNativeModule } from 'expo-modules-core';
import { Contact as ContactType } from './types/Contact.type';
import { Group as GroupType } from './types/Group.type';
import { Container as ContainerType } from './types/Container.type';

declare class ExpoContactsModule extends NativeModule {
  Contact: typeof ContactType;
  Group: typeof GroupType;
  Container: typeof ContainerType;
}

const expoContactsModule = requireNativeModule<ExpoContactsModule>('ExpoContactsNext');

if (Platform.OS === 'ios') {
  expoContactsModule.Contact = expoContactsModule.ContactNext;
}

export class Contact extends expoContactsModule.Contact {}
export class Group extends expoContactsModule.Group {}
export class Container extends expoContactsModule.Container {}
