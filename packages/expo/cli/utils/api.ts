import { JSONValue } from '@expo/json-file';
import got, { HTTPError, NormalizedOptions, RequestError } from 'got';

import { EXPO_LOCAL, EXPO_STAGING } from './env';
import { getAccessToken, getSessionSecret } from './user/sessionStorage';

export class ApiV2Error extends RequestError {
  readonly name = 'ApiV2Error';
  readonly expoApiV2ErrorCode: string;
  readonly expoApiV2ErrorDetails?: JSONValue;
  readonly expoApiV2ErrorServerStack?: string;
  readonly expoApiV2ErrorMetadata?: object;

  constructor(
    originalError: HTTPError,
    response: {
      message: string;
      code: string;
      stack?: string;
      details?: JSONValue;
      metadata?: object;
    }
  ) {
    super(response.message, originalError, originalError.request);
    this.expoApiV2ErrorCode = response.code;
    this.expoApiV2ErrorDetails = response.details;
    this.expoApiV2ErrorServerStack = response.stack;
    this.expoApiV2ErrorMetadata = response.metadata;
  }
}

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
