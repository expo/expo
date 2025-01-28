import { getConfig } from '@expo/config';
import chalk from 'chalk';

import * as Log from '../log';
import { startInterfaceAsync } from '../start/interface/startInterface';
import { BundlerStartOptions } from '../start/server/BundlerDevServer';
import { DevServerManager } from '../start/server/DevServerManager';
import { env } from '../utils/env';
import { isInteractive } from '../utils/interactive';

export async function startBundlerAsync(
  projectRoot: string,
  {
    port,
    headless,
    scheme,
    hostname,
  }: {
    port: number;
    headless?: boolean;
    scheme?: string;
    hostname?: string;
  }
): Promise<DevServerManager> {
  const options: BundlerStartOptions = {
    port,
    headless,
    devClient: true,
    minify: false,

    location: {
      scheme,
      hostname,
    },
  };

  const devServerManager = await DevServerManager.startMetroAsync(projectRoot, options);

  // Present the Terminal UI.
  if (!headless && isInteractive()) {
    // Only read the config if we are going to use the results.
    const { exp } = getConfig(projectRoot, {
      // We don't need very many fields here, just use the lightest possible read.
      skipSDKVersionRequirement: true,
      skipPlugins: true,
    });
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
