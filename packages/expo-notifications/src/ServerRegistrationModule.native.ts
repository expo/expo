import { requireNativeModule } from 'expo-modules-core';

import type { ServerRegistrationModule } from './ServerRegistrationModule.types';

export default requireNativeModule<ServerRegistrationModule>(
  'NotificationsServerRegistrationModule'
);
