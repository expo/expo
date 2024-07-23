import { requireNativeModule } from 'expo';

import { NotificationChannelManager } from './NotificationChannelManager.types';

export default requireNativeModule<NotificationChannelManager>('ExpoNotificationChannelManager');
