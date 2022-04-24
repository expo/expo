import { ExpoConfig } from '@expo/config';
import chalk from 'chalk';

import * as Log from '../log';
import { startInterfaceAsync } from '../start/interface/startInterface';
import { DevServerManager } from '../start/server/DevServerManager';
import { env } from '../utils/env';

// TODO: Maybe combine with `startAsync`
export async function startBundlerAsync(
  projectRoot: string,
  {
    port,
    headless,
    platforms,
  }: {
    port: number;
    platforms: ExpoConfig['platforms'];
    headless?: boolean;
  }
): Promise<DevServerManager> {
  const options = {
    port,
    headless,
    devClient: true,
    location: {},
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
  if (!headless && !env.CI) {
    await startInterfaceAsync(devServerManager, {
      platforms,
    });
  } else {
    // Display the server location in CI...
    const url = devServerManager.getDefaultDevServer()?.getDevServerUrl();
    if (url) {
      Log.log(chalk`Waiting on {underline ${url}}`);
    }
  }
  return devServerManager;
}
