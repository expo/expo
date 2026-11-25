import { requireNativeModule } from 'expo';

import type { NotificationChannelManager } from './NotificationChannelManager.types';

export default requireNativeModule<NotificationChannelManager>('ExpoNotificationChannelManager');
