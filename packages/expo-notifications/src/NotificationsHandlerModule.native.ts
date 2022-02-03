import { NativeModulesProxy } from 'expo-modules-core';

import { NotificationsHandlerModule } from './NotificationsHandlerModule.types';

export default NativeModulesProxy.ExpoNotificationsHandlerModule as any as NotificationsHandlerModule;
