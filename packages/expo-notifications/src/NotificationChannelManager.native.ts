import { NativeModulesProxy } from '@unimodules/core';

import { NotificationChannelManager } from './NotificationChannelManager.types';

export default (NativeModulesProxy.ExpoNotificationChannelManager as any) as NotificationChannelManager;
