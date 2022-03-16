import chalk from 'chalk';

import * as Log from '../../log';
import { DevServerManager } from '../../start/server/DevServerManager';
import { CI } from '../../utils/env';

export async function startBundlerAsync(
  projectRoot: string,
  { port, headless, platforms }: { port: number; platforms: string[]; headless?: boolean }
) {
  const options = {
    port,
    devClient: true,

    location: {},
  };
  const devServerManager = new DevServerManager(projectRoot, options);

  await devServerManager.startAsync([
    { type: 'metro', options: { headless, devClient: true, location: {} } },
  ]);

  // Present the Terminal UI.
  if (!headless && !CI) {
    // await profile(startInterfaceAsync)(devServerManager, {
    //   platforms,
    // });
  } else {
    // Display the server location in CI...
    const url = devServerManager.getDefaultDevServer()?.getDevServerUrl();
    if (url) {
      Log.log(chalk`Waiting on {underline ${url}}`);
    }
  }
  return devServerManager;
}
