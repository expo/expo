import { requireNativeModule } from 'expo-modules-core';

type ExpoGoModule = {
  expoVersion: string;
  projectConfig: ExpoGoProjectConfig;
};

type ExpoGoProjectConfig = {
  mainModuleName?: string;
  debuggerHost?: string;
  logUrl?: string;
  developer?: {
    tool?: string;
    [key: string]: any;
  };
  packagerOpts?: ExpoGoPackagerOpts;
};

export type ExpoGoPackagerOpts = {
  hostType?: string;
  dev?: boolean;
  strict?: boolean;
  minify?: boolean;
  urlType?: string;
  urlRandomness?: string;
  lanType?: string;
  [key: string]: any;
};

// ExpoGo module is available only when the app is run in Expo Go,
// otherwise we use `null` instead of throwing an error.
const NativeExpoGoModule = ((): ExpoGoModule | null => {
  try {
    return requireNativeModule('ExpoGo');
  } catch {
    return null;
  }
})();

/**
 * Returns a boolean value whether the app is running in Expo Go.
 */
export function isRunningInExpoGo(): boolean {
  return NativeExpoGoModule != null;
}

/**
 * @hidden
 * Returns an Expo Go project config from the manifest or `null` if the app is not running in Expo Go.
 */
export function getExpoGoProjectConfig(): ExpoGoProjectConfig | null {
  return NativeExpoGoModule?.projectConfig ?? null;
}
