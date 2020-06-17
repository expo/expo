import { NativeModulesProxy } from '@unimodules/core';

import { NotificationSchedulerModule } from './NotificationScheduler.types';

export default (NativeModulesProxy.ExpoNotificationScheduler as any) as NotificationSchedulerModule;
