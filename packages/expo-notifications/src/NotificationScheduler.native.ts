import { requireNativeModule } from 'expo-modules-core';

import type { NotificationSchedulerModule } from './NotificationScheduler.types';

export default requireNativeModule<NotificationSchedulerModule>('ExpoNotificationScheduler');
