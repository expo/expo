import { NativeModulesProxy } from 'expo-modules-core';

import { PushTokenManagerModule } from './PushTokenManager.types';

export default NativeModulesProxy.ExpoPushTokenManager as any as PushTokenManagerModule;
