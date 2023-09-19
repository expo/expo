import { requireNativeModule } from 'expo-modules-core';

import { PushTokenManagerModule } from './PushTokenManager.types';

export default requireNativeModule<PushTokenManagerModule>('ExpoPushTokenManager');
