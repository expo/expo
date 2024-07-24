import { requireNativeModule } from 'expo';

import { NotificationSchedulerModule } from './NotificationScheduler.types';

export default requireNativeModule<NotificationSchedulerModule>('ExpoNotificationScheduler');
