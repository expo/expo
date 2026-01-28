import { getConfig } from '@expo/config';
import assert from 'assert';

import { Options } from './resolveOptions';
import { getPublicExpoManifestAsync } from '../getPublicExpoManifest';
import { isEnableHermesManaged, assertEngineMismatchAsync } from '../exportHermes';
import * as Log from '../../log';
import { DevServerManager } from '../../start/server/DevServerManager';
import { MetroBundlerDevServer } from '../../start/server/metro/MetroBundlerDevServer';
import { getEntryWithServerRoot } from '../../start/server/middleware/ManifestMiddleware';
import { setNodeEnv } from '../../utils/nodeEnv';

export async function checkForProcessEnvAsync(
  projectRoot: string,
  { platforms, clear, dev, maxWorkers }: Options
): Promise<void> {
  // Force the environment during export and do not allow overriding it.
  const environment = dev ? 'development' : 'production';
  process.env.NODE_ENV = environment;
  setNodeEnv(environment);

  require('@expo/env').load(projectRoot);

  const projectConfig = getConfig(projectRoot);
  const exp = await getPublicExpoManifestAsync(projectRoot, {
    // Web doesn't require validation.
    skipValidation: platforms.length === 1 && platforms[0] === 'web',
  });

  const mode = dev ? 'development' : 'production';

  const devServerManager = await DevServerManager.startMetroAsync(projectRoot, {
    minify: true,
    mode,
    port: 8081,
    isExporting: true,
    location: {},
    resetDevServer: clear,
    maxWorkers,
  });

  const devServer = devServerManager.getDefaultDevServer();
  assert(devServer instanceof MetroBundlerDevServer);

  let hasProcessEnvRef = false;
  const processEnvPattern = /process\.env\./;

  try {
    for (const platform of platforms) {
      const isHermes = isEnableHermesManaged(exp, platform);
      if (isHermes) {
        await assertEngineMismatchAsync(projectRoot, exp, platform);
      }

      try {
        const bundle = await devServer.nativeExportBundleAsync(
          exp,
          {
            platform,
            splitChunks: false,
            mainModuleName: getEntryWithServerRoot(projectRoot, {
              platform,
              pkg: projectConfig.pkg,
            }),
            mode,
            engine: isHermes ? 'hermes' : undefined,
            serializerIncludeMaps: false,
            bytecode: isHermes,
            reactCompiler: !!exp.experiments?.reactCompiler,
          },
          new Map()
        );

        for (const artifact of bundle.artifacts) {
          if (artifact.type === 'js' && processEnvPattern.test(artifact.source)) {
            hasProcessEnvRef = true;
            break;
          }
        }

        if (hasProcessEnvRef) break;
      } catch (error) {
        Log.log('');
        if (error instanceof Error) {
          Log.exception(error);
        } else {
          Log.error('Failed to bundle the app');
          Log.log(error as any);
        }
        process.exit(1);
      }
    }
  } finally {
    await devServerManager.stopAsync();
  }

  Log.log(hasProcessEnvRef ? 'true' : 'false');
}
