import { openJsInspector, queryAllInspectorAppsAsync } from '@expo/dev-server';
import assert from 'assert';
import chalk from 'chalk';

import * as Log from '../../log';
import { learnMore } from '../../utils/link';
import { selectAsync } from '../../utils/prompts';
import * as Project from '../devServer';
import * as MetroDevServer from '../metro/MetroDevServer';
import * as UrlUtils from '../serverUrl';
import * as WebpackDevServer from '../webpack/WebpackDevServer';
import { BLT, printHelp, printItem, printUsage, StartOptions } from './commandsTable';
import { printQRCode } from './qr';

export async function openJsInspectorAsync() {
  Log.log(`Opening JavaScript inspector in the browser...`);
  const port = Project.getNativeDevServerPort();
  assert(port, 'Metro dev server is not running');
  const metroServerOrigin = `http://localhost:${port}`;
  const apps = await queryAllInspectorAppsAsync(metroServerOrigin);
  if (!apps.length) {
    Log.warn(
      `No compatible apps connected. This feature is only available for apps using the Hermes runtime. ${learnMore(
        'https://docs.expo.dev/guides/using-hermes/'
      )}`
    );
    return;
  }
  for (const app of apps) {
    openJsInspector(app);
  }
}

export async function printDevServerInfoAsync(
  projectRoot: string,
  options: Pick<StartOptions, 'webOnly' | 'isWebSocketsEnabled' | 'platforms'>
) {
  if (!options.webOnly) {
    try {
      const url = await UrlUtils.constructDeepLinkAsync(projectRoot);

      printQRCode(url);
      Log.log(printItem(`Metro waiting on ${chalk.underline(url)}`));
      // Log.newLine();
      // TODO: if development build, change this message!
      Log.log(printItem(`Scan the QR code above with Expo Go (Android) or the Camera app (iOS)`));
    } catch (error) {
      // @ts-ignore: If there is no development build scheme, then skip the QR code.
      if (error.code !== 'NO_DEV_CLIENT_SCHEME') {
        throw error;
      } else {
        const serverUrl = await UrlUtils.constructManifestUrlAsync(projectRoot, {
          urlType: 'http',
        });
        Log.log(printItem(`Metro waiting on ${chalk.underline(serverUrl)}`));
        Log.log(printItem(`Linking is disabled because the client scheme cannot be resolved.`));
      }
    }
  }

  const webUrl = WebpackDevServer.getDevServerUrl();
  if (webUrl) {
    Log.log();
    Log.log(printItem(`Webpack waiting on ${chalk.underline(webUrl)}`));
    Log.log(
      chalk.gray(printItem(`Expo Webpack (web) is in beta, and subject to breaking changes!`))
    );
  }

  await printUsage(options, { verbose: false });
  printHelp();
  Log.log();
}

export function reloadApp() {
  Log.log(`${BLT} Reloading apps`);
  // Send reload requests over the dev servers
  MetroDevServer.broadcastMessage('reload');
  WebpackDevServer.broadcastMessage('reload');
}

export async function openMoreToolsAsync() {
  try {
    // Options match: Chrome > View > Developer
    const value = await selectAsync(`Dev tools ${chalk.dim`(native only)`}`, [
      { title: 'Inspect elements', value: 'toggleElementInspector' },
      { title: 'Toggle performance monitor', value: 'togglePerformanceMonitor' },
      { title: 'Toggle developer menu', value: 'toggleDevMenu' },
      { title: 'Reload app', value: 'reload' },
      // TODO: Maybe a "View Source" option to open code.
      // Toggling Remote JS Debugging is pretty rough, so leaving it disabled.
      // { title: 'Toggle Remote Debugging', value: 'toggleRemoteDebugging' },
    ]);
    MetroDevServer.broadcastMessage('sendDevCommand', { name: value });
    WebpackDevServer.broadcastMessage('sendDevCommand', { name: value });
  } catch (e) {
    Log.debug(e);
    // do nothing
  } finally {
    printHelp();
  }
}

export function toggleDevMenu() {
  Log.log(`${BLT} Toggling dev menu`);
  MetroDevServer.broadcastMessage('devMenu');
  WebpackDevServer.broadcastMessage('devMenu');
}
