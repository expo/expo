import { requireNativeModule } from 'expo';

import type { BackgroundNotificationTasksModule } from './BackgroundNotificationTasksModule.types';

export default requireNativeModule<BackgroundNotificationTasksModule>(
  'ExpoBackgroundNotificationTasksModule'
);
