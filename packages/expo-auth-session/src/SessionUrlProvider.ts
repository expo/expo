import { Platform } from '@unimodules/core';
import Constants, { ExecutionEnvironment } from 'expo-constants';

import { BareSessionUrlProvider } from './BareSessionUrlProvider';
import { ManagedSessionUrlProvider } from './ManagedSessionUrlProvider';

export interface SessionUrlProvider {
  getDefaultReturnUrl: () => string;
  getStartUrl: (authUrl: string, returnUrl: string) => string;
  getRedirectUrl: (urlPath?: string) => string;
}

export function getSessionUrlProvider(): SessionUrlProvider {
  if (
    (Constants.executionEnvironment === ExecutionEnvironment.Standalone ||
      Constants.executionEnvironment === ExecutionEnvironment.StoreClient) &&
    Platform.OS !== 'web'
  ) {
    return new ManagedSessionUrlProvider();
  }
  return new BareSessionUrlProvider();
}
