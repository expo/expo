import got, { HTTPError, NormalizedOptions, RequestError } from 'got';

import { EXPO_LOCAL, EXPO_STAGING } from './env';
import { ApiV2Error } from './errors';
import { getAccessToken, getSessionSecret } from './user/sessionStorage';

export const apiClient = got.extend({
  prefixUrl: getExpoApiBaseUrl() + '/v2/',
  hooks: {
    beforeRequest: [
      (options: NormalizedOptions) => {
        const token = getAccessToken();
        if (token) {
          options.headers.authorization = `Bearer ${token}`;
          return;
        }
        const sessionSecret = getSessionSecret();
        if (sessionSecret) {
          options.headers['expo-session'] = sessionSecret;
        }
      },
    ],
    beforeError: [
      (error: RequestError): RequestError => {
        if (error instanceof HTTPError) {
          let result: { [key: string]: any };
          try {
            result = JSON.parse(error.response.body as string);
          } catch (e2) {
            return error;
          }
          if (result.errors?.length) {
            return new ApiV2Error(error, result.errors[0]);
          }
        }
        return error;
      },
    ],
  },
});

export function getExpoApiBaseUrl(): string {
  if (EXPO_STAGING) {
    return `https://staging-api.expo.dev`;
  } else if (EXPO_LOCAL) {
    return `http://127.0.0.1:3000`;
  } else {
    return `https://api.expo.dev`;
  }
}

export function getExpoWebsiteBaseUrl(): string {
  if (EXPO_STAGING) {
    return `https://staging.expo.dev`;
  } else if (EXPO_LOCAL) {
    return `http://expo.test`;
  } else {
    return `https://expo.dev`;
  }
}

export function getEASUpdateURL(projectId: string): string {
  if (EXPO_STAGING) {
    return new URL(projectId, `https://staging-u.expo.dev`).href;
  } else if (EXPO_LOCAL) {
    return new URL(`expo-updates/${projectId}`, `http://127.0.0.1:3000`).href;
  } else {
    return new URL(projectId, `https://u.expo.dev`).href;
  }
}
