import { DeviceEventEmitter } from 'react-native';

import { HMRMetroBuildError } from './buildErrors';
import { getFullBundlerUrl as getFullBundlerUrlHelper } from './getFullBundlerUrl';

export function getFullBundlerUrl(_: {
  serverScheme?: string;
  serverHost?: string;
  bundleEntry?: string;
  platform?: string;
}): string {
  return getFullBundlerUrlHelper();
}

export function showLoading(message: string, _type: 'load' | 'refresh') {
  // Ensure events are sent so custom Fast Refresh views are shown.
  DeviceEventEmitter.emit('devLoadingView:showMessage', {
    message,
  });
}

export function hideLoading() {
  DeviceEventEmitter.emit('devLoadingView:hide', {});
}

export function resetErrorOverlay() {
  // @ts-expect-error
  globalThis.__expo_dev_resetErrors?.();
}

export function reload() {
  // "Bundle Splitting – Metro disconnected"
  window.location.reload();
}

export function getConnectionError(serverHost: string, e: Error): string {
  return `
Cannot connect to Expo CLI.

Try the following to fix the issue:
- Ensure the Expo dev server is running and available on the same network as this device

URL: ${serverHost}

Error: ${e.message}
  `.trim();
}

export function handleCompileError(cause: any) {
  if (!cause) {
    return;
  }
  throw new HMRMetroBuildError(cause.message, cause.type, cause.cause);
}
