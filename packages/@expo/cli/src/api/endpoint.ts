import { env } from '../utils/env';

/** Get the URL for the expo.dev API. */
export function getExpoApiBaseUrl(): string {
  if (env.EXPO_STAGING) {
    return `https://staging-api.expo.dev`;
  } else if (env.EXPO_LOCAL) {
    return `http://127.0.0.1:3000`;
  } else {
    return `https://api.expo.dev`;
  }
}

/** Get the URL for the expo.dev website. */
export function getExpoWebsiteBaseUrl(): string {
  if (env.EXPO_STAGING) {
    return `https://staging.expo.dev`;
  } else if (env.EXPO_LOCAL) {
    return `http://127.0.0.1:3001`;
  } else {
    return `https://expo.dev`;
  }
}
