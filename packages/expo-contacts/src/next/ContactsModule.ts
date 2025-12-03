import { NativeModule, Platform, requireNativeModule } from 'expo-modules-core';
import { Contact as ContactType } from './types/Contact';
import { Group as GroupType, FallbackGroup } from './types/Group';
import { Container as ContainerType, FallbackContainer } from './types/Container';

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
export class Group extends (expoContactsModule.Group || FallbackGroup) {}
export class Container extends (expoContactsModule.Container || FallbackContainer) {}
