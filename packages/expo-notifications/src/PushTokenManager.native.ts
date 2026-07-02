import { requireNativeModule } from 'expo';

import type { PushTokenManagerModule } from './PushTokenManager.types';

export default requireNativeModule<PushTokenManagerModule>('ExpoPushTokenManager');
