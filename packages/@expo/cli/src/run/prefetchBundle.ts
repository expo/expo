import { getConfig } from '@expo/config';

import { isEnableHermesManaged } from '../export/exportHermes';
import { DevServerManager } from '../start/server/DevServerManager';
import { getRouterDirectoryModuleIdWithManifest } from '../start/server/metro/router';
import { resolveMainModuleName } from '../start/server/middleware/ManifestMiddleware';
import {
  createBundleUrlPath,
  getAsyncRoutesFromExpoConfig,
  getBaseUrlFromExpoConfig,
} from '../start/server/middleware/metroOptions';
import { env } from '../utils/env';

const debug = require('debug')('expo:run:prefetch') as typeof console.log;

/**
 * Fire-and-forget prefetch of the JS bundle so Metro's graph cache is warm
 * by the time the app launches on the device/simulator.
 */
export function prefetchBundleAsync(
  projectRoot: string,
  manager: DevServerManager,
  platform: string
): void {
  const serverUrl = manager.getDefaultDevServer()?.getDevServerUrl();
  if (!serverUrl) {
    debug('No dev server URL available, skipping prefetch');
    return;
  }

  try {
    const { exp } = getConfig(projectRoot, {
      skipSDKVersionRequirement: true,
      skipPlugins: true,
    });

    const mainModuleName = resolveMainModuleName(projectRoot, { platform });
    const engine = isEnableHermesManaged(exp, platform) ? 'hermes' : undefined;

    const bundlePath = createBundleUrlPath({
      mode: 'development',
      minify: false,
      platform,
      mainModuleName,
      lazy: !env.EXPO_NO_METRO_LAZY,
      engine,
      bytecode: engine === 'hermes',
      baseUrl: getBaseUrlFromExpoConfig(exp),
      isExporting: false,
      asyncRoutes: getAsyncRoutesFromExpoConfig(exp, 'development', platform),
      routerRoot: getRouterDirectoryModuleIdWithManifest(projectRoot, exp),
      reactCompiler: !!exp.experiments?.reactCompiler,
    });

    const url = serverUrl + bundlePath;
    debug('Prefetching bundle:', url);

    fetch(url).then(
      (res) => {
        debug('Prefetch completed with status:', res.status);
      },
      (error) => {
        debug('Prefetch failed (non-fatal):', error?.message);
      }
    );
  } catch (error: any) {
    debug('Failed to construct prefetch URL (non-fatal):', error?.message);
  }
}
