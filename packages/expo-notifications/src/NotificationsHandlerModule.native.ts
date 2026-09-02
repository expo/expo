import { requireNativeModule } from 'expo';

import type { NotificationsHandlerModule } from './NotificationsHandlerModule.types';

export default requireNativeModule<NotificationsHandlerModule>('ExpoNotificationsHandlerModule');
