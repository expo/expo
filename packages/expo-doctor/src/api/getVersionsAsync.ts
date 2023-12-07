import fetch from 'node-fetch';

/** Represents version info for a particular SDK. */
export type SDKVersion = {
  /** @example { "typescript": "~3.9.5" } */
  relatedPackages?: Record<string, string>;

  facebookReactNativeVersion: string;

  facebookReactVersion?: string;

  beta?: boolean;
};

export type SDKVersions = Record<string, SDKVersion>;

export type Versions = {
  sdkVersions: SDKVersions;
};

/** Get versions from remote endpoint. */
export async function getVersionsAsync(): Promise<Versions> {
  const results = await fetch(new URL(`/v2/versions/latest`, getExpoApiBaseUrl()).toString());
  const json = await results.json();
  return json.data;
}

function getExpoApiBaseUrl(): string {
  if (process.env.EXPO_STAGING) {
    return `https://staging-api.expo.dev`;
  } else if (process.env.EXPO_LOCAL) {
    return `http://127.0.0.1:3000`;
  } else {
    return `https://api.expo.dev`;
  }
}
