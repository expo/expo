import { requireNativeModule } from 'expo-modules-core';

import { BackgroundNotificationTasksModule } from './BackgroundNotificationTasksModule.types';

export default requireNativeModule<BackgroundNotificationTasksModule>(
  'ExpoBackgroundNotificationTasksModule'
);
