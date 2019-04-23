import { UnavailabilityError } from '@unimodules/core';

import ExponentFacebook from './ExponentFacebook';

type FacebookLoginResult = {
  type: string;
  token?: string;
  expires?: number;
};

type FacebookOptions = {
  permissions?: string[];
  behavior?: 'web' | 'native' | 'browser' | 'system';
};

export async function logInWithReadPermissionsAsync(
  appId: string,
  options?: FacebookOptions
): Promise<FacebookLoginResult> {
  if (!ExponentFacebook.logInWithReadPermissionsAsync) {
    throw new UnavailabilityError('Facebook', 'logInWithReadPermissionsAsync');
  }
  if (typeof appId !== 'string') {
    console.warn(
      `logInWithReadPermissionsAsync: parameter 'appId' must be a string, was '${typeof appId}''.`
    );
    appId = String(appId);
  }

  if (!options || typeof options !== 'object') {
    options = {};
  }
  return ExponentFacebook.logInWithReadPermissionsAsync(appId, options);
}
