import { NativeModulesProxy } from '@unimodules/core';

import { NotificationsEmitterModule } from './NotificationsEmitterModule.types';

export default (NativeModulesProxy.ExpoNotificationsEmitter as any) as NotificationsEmitterModule;
