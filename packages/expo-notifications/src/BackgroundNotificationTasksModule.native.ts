import { requireNativeModule } from 'expo';

import { BackgroundNotificationTasksModule } from './BackgroundNotificationTasksModule.types';

export default requireNativeModule<BackgroundNotificationTasksModule>(
  'ExpoBackgroundNotificationTasksModule'
);
