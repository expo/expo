import { NativeModulesProxy } from '@unimodules/core';

import { NotificationsHandlerModule } from './NotificationsHandlerModule.types';

export default (NativeModulesProxy.ExpoNotificationsHandlerModule as any) as NotificationsHandlerModule;
