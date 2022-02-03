import { NativeModulesProxy } from 'expo-modules-core';

import { NotificationPermissionsModule } from './NotificationPermissionsModule.types';

export default NativeModulesProxy.ExpoNotificationPermissionsModule as any as NotificationPermissionsModule;
