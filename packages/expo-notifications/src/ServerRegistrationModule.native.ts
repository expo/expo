import { requireNativeModule } from 'expo';

import type { ServerRegistrationModule } from './ServerRegistrationModule.types';

export default requireNativeModule<ServerRegistrationModule>(
  'NotificationsServerRegistrationModule'
);
