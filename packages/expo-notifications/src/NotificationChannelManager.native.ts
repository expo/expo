import { requireNativeModule } from 'expo-modules-core';

import type { NotificationChannelManager } from './NotificationChannelManager.types';

export default requireNativeModule<NotificationChannelManager>('ExpoNotificationChannelManager');
