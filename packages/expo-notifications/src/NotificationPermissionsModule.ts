import { NativeModulesProxy } from '@unimodules/core';

import { NotificationPermissionsModule } from './NotificationPermissionsModule.types';

export default (NativeModulesProxy.ExpoNotificationPermissionsModule as any) as NotificationPermissionsModule;
