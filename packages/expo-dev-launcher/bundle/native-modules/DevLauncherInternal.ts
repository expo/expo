import { NativeModules, NativeEventEmitter, EventSubscription } from 'react-native';

const DevLauncher = NativeModules.EXDevLauncherInternal;
const EventEmitter = new NativeEventEmitter(DevLauncher);

const ON_NEW_DEEP_LINK_EVENT = 'expo.modules.devlauncher.onnewdeeplink';

export async function getRecentlyOpenedApps(): Promise<{ [key: string]: string | null }[]> {
  return await DevLauncher.getRecentlyOpenedApps();
}

export async function loadApp(url: string): Promise<void> {
  return await DevLauncher.loadApp(url);
}

export async function getPendingDeepLink(): Promise<string | null> {
  return await DevLauncher.getPendingDeepLink();
}

export async function openCamera(): Promise<void> {
  return await DevLauncher.openCamera();
}

export function addDeepLinkListener(callback: (string) => void): EventSubscription {
  return EventEmitter.addListener(ON_NEW_DEEP_LINK_EVENT, callback);
}

export type AppInfo = {
  appName?: string;
  appVersion?: string;
  appIcon?: string;
  sdkVersion?: string;
  runtimeVersion?: string;
};

export async function getAppInfoAsync(): Promise<AppInfo> {
  return DevLauncher.getBuildInfo();
}

export async function copyToClipboardAsync(content: string): Promise<null> {
  return DevLauncher.copyToClipboard(content);
}

export const clientUrlScheme = DevLauncher.clientUrlScheme;
