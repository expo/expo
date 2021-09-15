import { NativeModulesProxy } from 'expo-modules-core';

import { NotificationPresenterModule } from './NotificationPresenterModule.types';

export default NativeModulesProxy.ExpoNotificationPresenter as any as NotificationPresenterModule;
