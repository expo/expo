import { requireNativeModule } from 'expo';

import { NotificationPresenterModule } from './NotificationPresenterModule.types';

export default requireNativeModule<NotificationPresenterModule>('ExpoNotificationPresenter');
