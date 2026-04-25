import { requireNativeModule } from 'expo-modules-core';

import type { NotificationsEmitterModule } from './NotificationsEmitterModule.types';

export default requireNativeModule<NotificationsEmitterModule>('ExpoNotificationsEmitter');
