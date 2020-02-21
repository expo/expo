import Constants from 'expo-constants';

import { BareSessionUrlProvider } from './BareSessionUrlProvider';
import { ManagedSessionUrlProvider } from './ManagedSessionUrlProvider';

export interface SessionUrlProvider {
  getDefaultReturnUrl: () => string;
  getStartUrl: (authUrl: string, returnUrl: string) => string;
  getRedirectUrl: () => string;
}

export function getSessionUrlProvider(): SessionUrlProvider {
  if (Constants.manifest) {
    return new ManagedSessionUrlProvider();
  }
  return new BareSessionUrlProvider();
}
