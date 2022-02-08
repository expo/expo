import { EXPO_LOCAL, EXPO_STAGING } from '../utils/env';

/** Get the URL for the expo.dev API. */
export function getExpoApiBaseUrl(): string {
  if (EXPO_STAGING) {
    return `https://staging-api.expo.dev`;
  } else if (EXPO_LOCAL) {
    return `http://127.0.0.1:3000`;
  } else {
    return `https://api.expo.dev`;
  }
}
