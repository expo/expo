import { getConfig } from '@expo/config';
import chalk from 'chalk';

import * as Log from '../log';
import { startInterfaceAsync } from '../start/interface/startInterface';
import type { BundlerStartOptions } from '../start/server/BundlerDevServer';
import { DevServerManager } from '../start/server/DevServerManager';
import { getPlatformBundlers } from '../start/server/platformBundlers';
import { env } from '../utils/env';
import { isInteractive } from '../utils/interactive';
import type { EnvironmentMode } from '../utils/nodeEnv';

export async function startBundlerAsync(
  projectRoot: string,
  {
    port,
    headless,
    scheme,
    mode,
    bundler,
    platform,
  }: {
    port: number;
    headless?: boolean;
    scheme?: string;
    mode: EnvironmentMode;
    /** Native bundler override (e.g. `rollipop`) honoured for `expo run:ios/android`. */
    bundler?: 'metro' | 'rollipop';
    /** The native platform being run, used to pick the configured bundler (`ios.bundler`/`android.bundler`). */
    platform?: 'ios' | 'android';
  }
): Promise<DevServerManager> {
  const options: BundlerStartOptions = {
    port,
    headless,
    devClient: true,
    minify: false,
    mode,

    location: {
      scheme,
    },
  };

  // Resolve the bundler for the native platform being run. `expo run:ios/android`
  // should use the same bundler as the rest of the project (e.g.
  // `ios.bundler` / `android.bundler: 'rollipop'` in app.json, or an explicit
  // `--bundler`). Rollipop ships its own dev server driven through
  // `RollipopBundlerDevServer`, so it is a first-class target here rather than
  // Metro-only. An explicit `bundler` arg wins; otherwise we read the
  // per-platform config for the platform being run (`ios` or `android`).
  const { exp } = getConfig(projectRoot, {
    skipSDKVersionRequirement: true,
    skipPlugins: true,
  });
  const resolvedBundler = bundler ?? getPlatformBundlers(projectRoot, exp)[platform ?? 'ios'];

  const devServerManager = await DevServerManager.startMetroAsync(
    projectRoot,
    options,
    resolvedBundler
  );

  // Present the Terminal UI.
  if (!headless && isInteractive()) {
    // Only read the config if we are going to use the results.
    await startInterfaceAsync(devServerManager, {
      platforms: exp.platforms ?? [],
    });
  } else {
    // Display the server location in CI...
    const url = devServerManager.getDefaultDevServer()?.getDevServerUrl();

    if (url) {
      if (env.__EXPO_E2E_TEST) {
        // Print the URL to stdout for tests
        console.info(`[__EXPO_E2E_TEST:server] ${JSON.stringify({ url })}`);
      }
      Log.log(chalk`Waiting on {underline ${url}}`);
    }
  }

  if (!options.headless) {
    await devServerManager.watchEnvironmentVariables();
    await devServerManager.bootstrapTypeScriptAsync();
  }

  return devServerManager;
}
