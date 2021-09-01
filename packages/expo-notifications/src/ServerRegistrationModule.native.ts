import { NativeModulesProxy } from 'expo-modules-core';

import { ServerRegistrationModule } from './ServerRegistrationModule.types';

export default NativeModulesProxy.NotificationsServerRegistrationModule as any as ServerRegistrationModule;
