import { requireNativeModule } from 'expo-modules-core';

import type { BackgroundNotificationTasksModule } from './BackgroundNotificationTasksModule.types';

export default requireNativeModule<BackgroundNotificationTasksModule>(
  'ExpoBackgroundNotificationTasksModule'
);
