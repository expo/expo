import { NativeModulesProxy } from '@unimodules/core';

import { ServerRegistrationModule } from './ServerRegistrationModule.types';

export default (NativeModulesProxy.NotificationsServerRegistrationModule as any) as ServerRegistrationModule;
