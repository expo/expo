import type { CustomMessageHandlerConnection } from '@react-native/dev-middleware';
import chalk from 'chalk';
import fetch from 'node-fetch';

import { launchInspectorBrowserAsync, type LaunchBrowserInstance } from './LaunchBrowser';
import { Log } from '../../../../log';
import { env } from '../../../../utils/env';
import { pageIsSupported } from '../../metro/debugging/pageIsSupported';

export interface MetroInspectorProxyApp {
  id: string;
  description: string;
  title: string;
  faviconUrl: string;
  devtoolsFrontendUrl: string;
  type: 'node';
  webSocketDebuggerUrl: string;
  vm: 'Hermes' | "don't use";
  /** Added since React Native 0.73.x */
  deviceName?: string;
  /** Added since React Native 0.74.x */
  reactNative?: {
    logicalDeviceId: string;
    capabilities: CustomMessageHandlerConnection['page']['capabilities'];
  };
}

let openingBrowserInstance: LaunchBrowserInstance | null = null;

export function openJsInspector(metroBaseUrl: string, app: MetroInspectorProxyApp) {
  if (env.EXPO_USE_UNSTABLE_DEBUGGER) {
    return openExperimentalJsInspector(metroBaseUrl, app);
  } else {
    return openClassicJsInspector(app);
  }
}

async function openExperimentalJsInspector(metroBaseUrl: string, app: MetroInspectorProxyApp) {
  const device = encodeURIComponent(app.id);
  const appId = encodeURIComponent(app.description);
  await fetch(`${metroBaseUrl}/open-debugger?device=${device}&appId=${appId}`, { method: 'POST' });
}

/**
 * Chrome DevTools UI implemented for SDK <49.
 * TODO(cedric): Remove this when we fully swap over to the new React Native JS Inspector.
 */
async function openClassicJsInspector(app: MetroInspectorProxyApp) {
  Log.log(chalk`{bold Debug:} Opening JavaScript inspector in the browser...`);

  // To update devtoolsFrontendRev, find the full commit hash in the url:
  // https://chromium.googlesource.com/chromium/src.git/+log/refs/tags/{CHROME_VERSION}/chrome/VERSION
  //
  // 1. Replace {CHROME_VERSION} with the target chrome version
  // 2. Click the first log item in the webpage
  // 3. The full commit hash is the desired revision
  const devtoolsFrontendRev = 'd9568d04d7dd79269c5a655d7ada69650c5a8336'; // Chrome 100.0.4896.75

  const urlBase = `https://chrome-devtools-frontend.appspot.com/serve_rev/@${devtoolsFrontendRev}/devtools_app.html`;
  const ws = app.webSocketDebuggerUrl.replace(/^ws:\/\//, '');
  const url = `${urlBase}?panel=console&ws=${encodeURIComponent(ws)}`;
  await closeJsInspector();
  openingBrowserInstance = await launchInspectorBrowserAsync(url);
}

export async function closeJsInspector() {
  await openingBrowserInstance?.close();
  openingBrowserInstance = null;
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
  // Only use targets with better reloading support
  return apps.filter((app) => pageIsSupported(app));
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
