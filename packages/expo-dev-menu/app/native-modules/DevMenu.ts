import { DeviceEventEmitter, NativeModules, EventSubscription } from 'react-native';

export type AppInfo = {
  appIcon?: string;
  appVersion?: string;
  hostUrl?: string;
  appName?: string;
  sdkVersion?: string;
  runtimeVersion?: string;
};

export type DevSettings = {
  isDebuggingRemotely?: boolean;
  isElementInspectorShown?: boolean;
  isHotLoadingEnabled?: boolean;
  isPerfMonitorShown?: boolean;
};

const DevMenu = NativeModules.ExpoDevMenuInternal;

export function hideMenu(): void {
  DevMenu.hideMenu();
}

export function subscribeToCloseEvents(listener: () => void): EventSubscription {
  return DeviceEventEmitter.addListener('closeDevMenu', listener);
}

export function subscribeToOpenEvents(listener: () => void): EventSubscription {
  return DeviceEventEmitter.addListener('openDevMenu', listener);
}

export function openDevMenuFromReactNative() {
  DevMenu.openDevMenuFromReactNative();
}

export async function navigateToLauncherAsync(): Promise<void> {
  return await DevMenu.navigateToLauncherAsync();
}

export async function togglePerformanceMonitorAsync() {
  return await DevMenu.togglePerformanceMonitorAsync();
}

export async function toggleElementInspectorAsync() {
  return await DevMenu.toggleElementInspectorAsync();
}

export async function reloadAsync() {
  return await DevMenu.reloadAsync();
}

export async function toggleDebugRemoteJSAsync() {
  return await DevMenu.toggleDebugRemoteJSAsync();
}

export async function toggleFastRefreshAsync() {
  return await DevMenu.toggleFastRefreshAsync();
}

export async function copyToClipboardAsync(content: string) {
  return await DevMenu.copyToClipboardAsync(content);
}
