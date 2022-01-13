import { DeviceEventEmitter, NativeModules, EventSubscription } from 'react-native';

export type BuildInfo = {
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

export async function dispatchCallableAsync(
  callableId: string,
  args: object | null = null
): Promise<void> {
  return await DevMenu.dispatchCallableAsync(callableId, args);
}

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

export async function navigateToLauncherAsync(): Promise<void> {}

export async function togglePerformanceMonitor() {}

export async function toggleElementInspector() {}

export async function reload() {}

export async function toggleDebugRemoteJS() {}

export async function toggleFastRefresh() {}

export async function getDevSettingsAsync(): Promise<DevSettings> {
  return {
    isDebuggingRemotely: false,
    isElementInspectorShown: false,
    isHotLoadingEnabled: false,
    isPerfMonitorShown: false,
  };
}

export async function getBuildInfoAsync(): Promise<BuildInfo> {
  return {
    appIcon: '',
    appName: '123',
    appVersion: '32.1.2',
    sdkVersion: '45.0.0',
    runtimeVersion: '12',
    hostUrl: '127.0.0.1',
  };
}

export async function copyToClipboardAsync(content: string) {}
