import { requireNativeModule } from 'expo';

import type { NotificationsEmitterModule } from './NotificationsEmitterModule.types';

export default requireNativeModule<NotificationsEmitterModule>('ExpoNotificationsEmitter');
