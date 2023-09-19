import { requireNativeModule } from 'expo-modules-core';

import { NotificationSchedulerModule } from './NotificationScheduler.types';

export default requireNativeModule<NotificationSchedulerModule>('ExpoNotificationScheduler');
