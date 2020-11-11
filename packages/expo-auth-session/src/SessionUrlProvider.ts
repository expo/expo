import { Platform } from '@unimodules/core';
import Constants from 'expo-constants';

import { BareSessionUrlProvider } from './BareSessionUrlProvider';
import { ManagedSessionUrlProvider } from './ManagedSessionUrlProvider';

export interface SessionUrlProvider {
  getDefaultReturnUrl: () => string;
  getStartUrl: (authUrl: string, returnUrl: string) => string;
  getRedirectUrl: (urlPath?: string) => string;
}

export function getSessionUrlProvider(): SessionUrlProvider {
  if (
    (Constants.executionEnvironment === 'standalone' ||
      Constants.executionEnvironment === 'storeClient') &&
    Platform.OS !== 'web'
  ) {
    return new ManagedSessionUrlProvider();
  }
  return new BareSessionUrlProvider();
}
