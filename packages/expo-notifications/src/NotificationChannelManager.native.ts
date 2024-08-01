import { requireNativeModule } from 'expo-modules-core';

import { NotificationChannelManager } from './NotificationChannelManager.types';

export default requireNativeModule<NotificationChannelManager>('ExpoNotificationChannelManager');
