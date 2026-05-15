import { requireNativeModule } from 'expo-modules-core';

import type { NotificationPresenterModule } from './NotificationPresenterModule.types';

export default requireNativeModule<NotificationPresenterModule>('ExpoNotificationPresenter');
