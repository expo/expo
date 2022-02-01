import openBrowserAsync from 'better-opn';
import chalk from 'chalk';
import getenv from 'getenv';

import * as Log from '../../log';
import { CommandError } from '../../utils/errors';
import { choosePortAsync } from '../../utils/port';
import ProcessSettings from '../api/ProcessSettings';
import { ensureEnvironmentSupportsSSLAsync } from './ssl';
import * as ExpoWebpackDevServer from './WebpackDevServer';
import { clearWebProjectCacheAsync } from './WebProjectCache';

type StartWebpackCLIOptions = {
  // pwa?: boolean;
  port?: number;
};

/** Start Webpack dev server and apply all side-effects. */
export async function startAsync(
  projectRoot: string,
  options: StartWebpackCLIOptions = {}
): Promise<ExpoWebpackDevServer.WebpackDevServerResults | null> {
  const mode = ProcessSettings.isDevMode ? 'development' : 'production';
  const port = await getAvailablePortAsync(projectRoot, {
    defaultPort: options.port,
  });
  Log.debug('Starting web on port: ' + port);

  if (ProcessSettings.resetDevServer) {
    Log.log(chalk.dim(`Clearing ${mode} cache directory...`));
    await clearWebProjectCacheAsync(projectRoot, mode);
  }

  if (ProcessSettings.https) {
    Log.debug('Configuring SSL to enable HTTPS support');
    await ensureEnvironmentSupportsSSLAsync(projectRoot);
  }

  return await ExpoWebpackDevServer.startAsync(projectRoot, {
    forceManifestType: ProcessSettings.forceManifestType,
    host: WEB_HOST,
    port,
    isImageEditingEnabled: false, //options.pwa,
    https: ProcessSettings.https,
    mode,
  });
}

export async function openAsync(
  projectRoot: string,
  options?: StartWebpackCLIOptions
): Promise<void> {
  if (!ExpoWebpackDevServer.getInstance().server) {
    await startAsync(projectRoot, options);
  }
  await openProjectAsync();
}

async function getAvailablePortAsync(
  projectRoot: string,
  options: {
    host?: string;
    defaultPort?: number;
  }
): Promise<number> {
  try {
    const defaultPort = options.defaultPort ?? WEB_PORT;
    const port = await choosePortAsync(projectRoot, {
      defaultPort,
      host: options.host ?? WEB_HOST,
    });
    if (!port) {
      throw new CommandError('NO_PORT_FOUND', `Port ${defaultPort} not available.`);
    }
    return port;
  } catch (error) {
    throw new CommandError('NO_PORT_FOUND', error.message);
  }
}

async function openProjectAsync(): Promise<
  { success: true; url: string } | { success: false; error: Error }
> {
  try {
    const WebpackDevServer = await import('../webpack/WebpackDevServer');
    const url = WebpackDevServer.getDevServerUrl({ hostType: 'localhost' });
    if (!url) {
      throw new CommandError('Webpack Dev Server is not running');
    }
    openBrowserAsync(url);
    return { success: true, url };
  } catch (e) {
    Log.error(`Couldn't start project on web: ${e.message}`);
    return { success: false, error: e };
  }
}

export const WEB_HOST = getenv.string('WEB_HOST', '0.0.0.0');

export const WEB_PORT = getenv.int('WEB_PORT', 19006);
