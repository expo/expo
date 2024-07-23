import { requireNativeModule } from 'expo';

import { PushTokenManagerModule } from './PushTokenManager.types';

export default requireNativeModule<PushTokenManagerModule>('ExpoPushTokenManager');
