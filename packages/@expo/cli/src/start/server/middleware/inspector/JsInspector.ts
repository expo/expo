import type { CustomMessageHandlerConnection } from '@react-native/dev-middleware';
import chalk from 'chalk';

import { evaluateJsFromCdpAsync } from './CdpClient';
import { selectAsync } from '../../../../utils/prompts';
import { pageIsSupported } from '../../metro/debugging/pageIsSupported';

const debug = require('debug')(
  'expo:start:server:middleware:inspector:jsInspector'
) as typeof console.log;

export interface MetroInspectorProxyApp {
  /** Unique device ID combined with the page ID */
  id: string;
  /** Information about the underlying CDP implementation, e.g. "React Native Bridgeless [C++ connection]" */
  title: string;
  /** The application ID that is currently running on the device, e.g. "dev.expo.bareexpo" */
  description: string;
  /** The CDP debugger type, which should always be "node" */
  type: 'node';
  /** The internal `devtools://..` URL for the debugger to connect to */
  devtoolsFrontendUrl: string;
  /** The websocket URL for the debugger to connect to */
  webSocketDebuggerUrl: string;
  /**
   * Human-readable device name
   * @since react-native@0.73
   */
  deviceName: string;
  /**
   * React Native specific information, like the unique device ID and native capabilities
   * @since react-native@0.74
   */
  reactNative?: {
    /** The unique device ID */
    logicalDeviceId: string;
    /** All supported native capabilities */
    capabilities: CustomMessageHandlerConnection['page']['capabilities'];
  };
}

/**
 * Launch the React Native DevTools by executing the `POST /open-debugger` request.
 * This endpoint is handled through `@react-native/dev-middleware`.
 */
export async function openJsInspector(metroBaseUrl: string, app: MetroInspectorProxyApp) {
  if (!app.reactNative?.logicalDeviceId) {
    debug('Failed to open React Native DevTools, target is missing device ID');
    return false;
  }

  const url = new URL('/open-debugger', metroBaseUrl);
  url.searchParams.set('appId', app.description);
  url.searchParams.set('device', app.reactNative.logicalDeviceId);
  url.searchParams.set('target', app.id);

  const response = await fetch(url, { method: 'POST' });
  if (!response.ok) {
    debug('Failed to open React Native DevTools, received response:', response.status);
  }

  return response.ok;
}

export async function queryInspectorAppAsync(
  metroServerOrigin: string,
  appId: string
): Promise<MetroInspectorProxyApp | null> {
  const apps = await queryAllInspectorAppsAsync(metroServerOrigin);
  return apps.find((app) => app.description === appId) ?? null;
}

export async function queryAllInspectorAppsAsync(
  metroServerOrigin: string
): Promise<MetroInspectorProxyApp[]> {
  const resp = await fetch(`${metroServerOrigin}/json/list`);
  const apps: MetroInspectorProxyApp[] = transformApps(await resp.json());
  const results: MetroInspectorProxyApp[] = [];
  for (const app of apps) {
    // Only use targets with better reloading support
    if (!pageIsSupported(app)) {
      continue;
    }
    // Hide targets that are marked as hidden from the inspector, e.g. instances from expo-dev-menu and expo-dev-launcher.
    if (await appShouldBeIgnoredAsync(app)) {
      continue;
    }
    results.push(app);
  }
  return results;
}

export async function promptInspectorAppAsync(apps: MetroInspectorProxyApp[]) {
  if (apps.length === 1) {
    return apps[0];
  }

  // Check if multiple devices are connected with the same device names
  // In this case, append the actual app id (device ID + page number) to the prompt
  const hasDuplicateNames = apps.some(
    (app, index) => index !== apps.findIndex((other) => app.deviceName === other.deviceName)
  );

  const choices = apps.map((app) => {
    const name = app.deviceName ?? 'Unknown device';
    return {
      title: hasDuplicateNames ? chalk`${name}{dim  - ${app.id}}` : name,
      value: app.id,
      app,
    };
  });

  const value = await selectAsync(chalk`Debug target {dim (Hermes only)}`, choices);

  return choices.find((item) => item.value === value)?.app;
}

// The description of `React Native Experimental (Improved Chrome Reloads)` target is `don't use` from metro.
// This function tries to transform the unmeaningful description to appId
function transformApps(apps: MetroInspectorProxyApp[]): MetroInspectorProxyApp[] {
  const deviceIdToAppId: Record<string, string> = {};

  for (const app of apps) {
    if (app.description !== "don't use") {
      const deviceId = app.reactNative?.logicalDeviceId ?? app.id.split('-')[0];
      const appId = app.description;
      deviceIdToAppId[deviceId] = appId;
    }
  }

  return apps.map((app) => {
    if (app.description === "don't use") {
      const deviceId = app.reactNative?.logicalDeviceId ?? app.id.split('-')[0];
      app.description = deviceIdToAppId[deviceId] ?? app.description;
    }
    return app;
  });
}

const HIDE_FROM_INSPECTOR_ENV = 'globalThis.__expo_hide_from_inspector__';

async function appShouldBeIgnoredAsync(app: MetroInspectorProxyApp): Promise<boolean> {
  const hideFromInspector = await evaluateJsFromCdpAsync(
    app.webSocketDebuggerUrl,
    HIDE_FROM_INSPECTOR_ENV
  );
  debug(
    `[appShouldBeIgnoredAsync] webSocketDebuggerUrl[${app.webSocketDebuggerUrl}] hideFromInspector[${hideFromInspector}]`
  );
  return hideFromInspector !== undefined;
}
