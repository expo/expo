import { requireNativeModule } from 'expo-modules-core';

import { NotificationsHandlerModule } from './NotificationsHandlerModule.types';

export default requireNativeModule<NotificationsHandlerModule>('ExpoNotificationsHandlerModule');
