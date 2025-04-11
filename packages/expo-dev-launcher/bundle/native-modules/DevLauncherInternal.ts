import { requireNativeModule } from 'expo-modules-core';

import { RecentApp } from '../providers/RecentlyOpenedAppsProvider';

const DevLauncher = requireNativeModule('ExpoDevLauncherInternal');
const ON_NEW_DEEP_LINK_EVENT = 'expo.modules.devlauncher.onnewdeeplink';

export async function getRecentlyOpenedApps(): Promise<RecentApp[]> {
  const recentlyOpenedApps = await DevLauncher.getRecentlyOpenedApps();
  return recentlyOpenedApps;
}

export async function clearRecentlyOpenedApps(): Promise<void> {
  return await DevLauncher.clearRecentlyOpenedApps();
}

export async function loadApp(url: string): Promise<void> {
  return await DevLauncher.loadApp(url);
}

export async function loadUpdate(updateUrl: string, projectUrl: string) {
  return await DevLauncher.loadUpdate(updateUrl, projectUrl);
}

export async function getNavigationStateAsync() {
  return await DevLauncher.getNavigationState();
}

export async function consumeNavigationStateAsync() {
  const serializedNavigationState = await DevLauncher.getNavigationState();
  let navigationState;

  try {
    navigationState = JSON.parse(serializedNavigationState);
  } catch {}

  // not necessary to await this as its effects are only applied on app launch
  clearNavigationStateAsync();
  return navigationState;
}

export async function saveNavigationStateAsync(navigationState: string) {
  return await DevLauncher.saveNavigationState(navigationState);
}

export async function clearNavigationStateAsync() {
  return await DevLauncher.clearNavigationState();
}

export async function getPendingDeepLink(): Promise<string | null> {
  return await DevLauncher.getPendingDeepLink();
}

export type CrashReport = {
  timestamp: number;
  message: string;
  stack: string;
};

export async function getCrashReport(): Promise<CrashReport | null> {
  return await DevLauncher.getCrashReport();
}

export function addDeepLinkListener(callback: (event: { url: string }) => void) {
  return DevLauncher.addListener(ON_NEW_DEEP_LINK_EVENT, callback);
}

export type BuildInfo = {
  appName?: string;
  appVersion?: string;
  appIcon?: string;
  sdkVersion?: string;
  runtimeVersion?: string;
  appId?: string;
};

export async function getBuildInfoAsync(): Promise<BuildInfo> {
  return DevLauncher.getBuildInfo();
}

export async function copyToClipboardAsync(content: string): Promise<null> {
  return DevLauncher.copyToClipboard(content);
}

export const clientUrlScheme = DevLauncher.clientUrlScheme;
export const installationID = DevLauncher.installationID;
export const isDevice = !!DevLauncher.isDevice;

export type EXUpdatesConfig = {
  runtimeVersion: string;
  sdkVersion: string;
  appId: string;
  usesEASUpdates: boolean;
  projectUrl: string;
};

export const updatesConfig: EXUpdatesConfig = DevLauncher.updatesConfig;

export async function loadFontsAsync() {
  return await DevLauncher.loadFontsAsync();
}
