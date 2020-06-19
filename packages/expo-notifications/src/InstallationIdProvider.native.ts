import { NativeModulesProxy } from '@unimodules/core';

import { InstallationIdProvider } from './InstallationIdProvider.types';

export default (NativeModulesProxy.NotificationsInstallationIdProvider as any) as InstallationIdProvider;
