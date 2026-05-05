import { requireNativeModule } from 'expo-modules-core';

import type { NotificationsHandlerModule } from './NotificationsHandlerModule.types';

export default requireNativeModule<NotificationsHandlerModule>('ExpoNotificationsHandlerModule');
