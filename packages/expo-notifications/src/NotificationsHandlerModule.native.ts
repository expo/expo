import { requireNativeModule } from 'expo';

import { NotificationsHandlerModule } from './NotificationsHandlerModule.types';

export default requireNativeModule<NotificationsHandlerModule>('ExpoNotificationsHandlerModule');
