import { requireNativeModule } from 'expo';

import { NotificationsEmitterModule } from './NotificationsEmitterModule.types';

export default requireNativeModule<NotificationsEmitterModule>('ExpoNotificationsEmitter');
