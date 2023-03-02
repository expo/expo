import fetch from 'node-fetch';

import { launchBrowserAsync, type LaunchBrowserInstance } from './LaunchBrowser';

export interface MetroInspectorProxyApp {
  description: string;
  devtoolsFrontendUrl: string;
  faviconUrl: string;
  id: string;
  title: string;
  type: 'node';
  vm: 'Hermes' | "don't use";
  webSocketDebuggerUrl: string;
}

let openingBrowserInstance: LaunchBrowserInstance | null = null;

export async function openJsInspector(app: MetroInspectorProxyApp) {
  // To update devtoolsFrontendRev, find the full commit hash in the url:
  // https://chromium.googlesource.com/chromium/src.git/+log/refs/tags/{CHROME_VERSION}/chrome/VERSION
  //
  // 1. Replace {CHROME_VERSION} with the target chrome version
  // 2. Click the first log item in the webpage
  // 3. The full commit hash is the desired revision
  const devtoolsFrontendRev = 'd9568d04d7dd79269c5a655d7ada69650c5a8336'; // Chrome 100.0.4896.75

  const urlBase = `https://chrome-devtools-frontend.appspot.com/serve_rev/@${devtoolsFrontendRev}/devtools_app.html`;
  const ws = app.webSocketDebuggerUrl.replace(/^ws:\/\//, '');
  const url = `${urlBase}?panel=sources&ws=${encodeURIComponent(ws)}`;
  await closeJsInspector();
  openingBrowserInstance = await launchBrowserAsync(url);
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
  return apps.filter((app) => app.title === 'React Native Experimental (Improved Chrome Reloads)');
}

// The description of `React Native Experimental (Improved Chrome Reloads)` target is `don't use` from metro.
// This function tries to transform the unmeaningful description to appId
function transformApps(apps: MetroInspectorProxyApp[]): MetroInspectorProxyApp[] {
  const deviceIdToAppId: Record<string, string> = {};

  for (const app of apps) {
    if (app.description !== "don't use") {
      const deviceId = app.id.split('-')[0];
      const appId = app.description;
      deviceIdToAppId[deviceId] = appId;
    }
  }

  return apps.map((app) => {
    if (app.description === "don't use") {
      const deviceId = app.id.split('-')[0];
      app.description = deviceIdToAppId[deviceId] ?? app.description;
    }
    return app;
  });
}
