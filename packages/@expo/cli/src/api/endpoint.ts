import { env } from '../utils/env';
import { getFreePortAsync } from '../utils/port';

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
    return `http://expo.test`;
  } else {
    return `https://expo.dev`;
  }
}

export async function getSsoLocalServerPortAsync(): Promise<number> {
  const startPort = env.EXPO_SSO_LOCAL_SERVER_PORT;
  return await getFreePortAsync(startPort);
}
