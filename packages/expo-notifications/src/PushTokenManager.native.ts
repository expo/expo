import { requireNativeModule } from 'expo-modules-core';

import type { PushTokenManagerModule } from './PushTokenManager.types';

export default requireNativeModule<PushTokenManagerModule>('ExpoPushTokenManager');
