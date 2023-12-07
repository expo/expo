import { requireNativeModule } from 'expo-modules-core';

import { NotificationsEmitterModule } from './NotificationsEmitterModule.types';

export default requireNativeModule<NotificationsEmitterModule>('ExpoNotificationsEmitter');
