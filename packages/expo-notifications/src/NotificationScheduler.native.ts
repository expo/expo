import { requireNativeModule } from 'expo';

import type { NotificationSchedulerModule } from './NotificationScheduler.types';

export default requireNativeModule<NotificationSchedulerModule>('ExpoNotificationScheduler');
