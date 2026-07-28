import { requireNativeModule } from 'expo';

import type { NotificationPresenterModule } from './NotificationPresenterModule.types';

export default requireNativeModule<NotificationPresenterModule>('ExpoNotificationPresenter');
