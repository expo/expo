import { requireNativeModule } from 'expo-modules-core';
import { DeviceEventEmitter, EventSubscription } from 'react-native';

export type JSEngine = 'Hermes' | 'JSC' | 'V8';

export type AppInfo = {
  appIcon?: string;
  appVersion?: string;
  hostUrl?: string;
  appName?: string;
  sdkVersion?: string;
  runtimeVersion?: string;
  engine?: JSEngine;
};

export type DevSettings = {
  isDebuggingRemotely?: boolean;
  isElementInspectorShown?: boolean;
  isHotLoadingEnabled?: boolean;
  isPerfMonitorShown?: boolean;
  isRemoteDebuggingAvailable?: boolean;
  isElementInspectorAvailable?: boolean;
  isHotLoadingAvailable?: boolean;
  isPerfMonitorAvailable?: boolean;
  isJSInspectorAvailable?: boolean;
};

export type MenuPreferences = {
  isOnboardingFinished?: boolean;
};

const DevMenu = requireNativeModule('ExpoDevMenuInternal');

export async function dispatchCallableAsync(
  callableId: string,
  args: object | null = null
): Promise<void> {
  return await DevMenu.dispatchCallableAsync(callableId, args);
}

export function hideMenu(): void {
  DevMenu.hideMenu();
}

export function closeMenu(): void {
  DevMenu.closeMenu();
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

export async function togglePerformanceMonitorAsync() {
  return await dispatchCallableAsync('performance-monitor');
}

export async function toggleElementInspectorAsync() {
  return await dispatchCallableAsync('inspector');
}

export async function reloadAsync() {
  return await dispatchCallableAsync('reload');
}

export async function toggleDebugRemoteJSAsync() {
  return await dispatchCallableAsync('remote-debug');
}

export async function toggleFastRefreshAsync() {
  return await dispatchCallableAsync('fast-refresh');
}

export async function openJSInspector() {
  return await dispatchCallableAsync('js-inspector');
}

export async function copyToClipboardAsync(content: string) {
  return await DevMenu.copyToClipboardAsync(content);
}

export async function setOnboardingFinishedAsync(isFinished: boolean) {
  return await DevMenu.setOnboardingFinished(isFinished);
}

export async function loadFontsAsync() {
  return await DevMenu.loadFontsAsync();
}

export async function fireCallbackAsync(name: string) {
  return await DevMenu.fireCallback(name).catch((error) => console.warn(error.message));
}
