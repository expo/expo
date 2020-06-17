import { NativeModulesProxy } from '@unimodules/core';

import { NotificationPresenterModule } from './NotificationPresenterModule.types';

export default (NativeModulesProxy.ExpoNotificationPresenter as any) as NotificationPresenterModule;
