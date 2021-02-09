import { NativeModulesProxy } from '@unimodules/core';

import { PushTokenManagerModule } from './PushTokenManager.types';

export default (NativeModulesProxy.ExpoPushTokenManager as any) as PushTokenManagerModule;
