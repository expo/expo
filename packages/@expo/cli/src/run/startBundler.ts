import { getConfig } from '@expo/config';
import chalk from 'chalk';

import * as Log from '../log';
import { startInterfaceAsync } from '../start/interface/startInterface';
import { DevServerManager } from '../start/server/DevServerManager';
import { isInteractive } from '../utils/interactive';

export async function startBundlerAsync(
  projectRoot: string,
  {
    port,
    headless,
    scheme,
  }: {
    port: number;
    headless?: boolean;
    scheme?: string;
  }
): Promise<DevServerManager> {
  const options = {
    port,
    headless,
    devClient: true,

    location: {
      scheme,
    },
  };

  const devServerManager = new DevServerManager(projectRoot, options);

  await devServerManager.startAsync([
    {
      // TODO: Allow swapping this value for another bundler.
      type: 'metro',
      options,
    },
  ]);

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
      Log.log(chalk`Waiting on {underline ${url}}`);
    }
  }

  if (!options.headless) {
    await devServerManager.watchEnvironmentVariables();
    await devServerManager.bootstrapTypeScriptAsync();
  }

  return devServerManager;
}
