import fetch from 'node-fetch';

import { ExpoCliExtensionAppInfo } from './CliExtension.types.js';

export async function queryAllInspectorAppsAsync(
  metroServerOrigin: string
): Promise<ExpoCliExtensionAppInfo[]> {
  const resp = await fetch(`${metroServerOrigin}/json/list`);
  // The newest runtime will be at the end of the list,
  // reversing the result would save time from try-error.
  return ((await resp.json()).reverse() as ExpoCliExtensionAppInfo[]).filter(pageIsSupported);
}

function pageIsSupported(app: ExpoCliExtensionAppInfo): boolean {
  const capabilities = app.reactNative?.capabilities ?? {};
  return 'nativePageReloads' in capabilities && capabilities.nativePageReloads === true;
}
