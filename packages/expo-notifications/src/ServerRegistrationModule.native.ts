import { requireNativeModule } from 'expo';

import { ServerRegistrationModule } from './ServerRegistrationModule.types';

export default requireNativeModule<ServerRegistrationModule>(
  'NotificationsServerRegistrationModule'
);
