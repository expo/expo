import { requireNativeModule } from 'expo-modules-core';

import { ServerRegistrationModule } from './ServerRegistrationModule.types';

export default requireNativeModule<ServerRegistrationModule>(
  'NotificationsServerRegistrationModule'
);
