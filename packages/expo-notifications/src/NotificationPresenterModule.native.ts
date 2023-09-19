import { requireNativeModule } from 'expo-modules-core';

import { NotificationPresenterModule } from './NotificationPresenterModule.types';

export default requireNativeModule<NotificationPresenterModule>('ExpoNotificationPresenter');
