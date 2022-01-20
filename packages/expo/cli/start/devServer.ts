import { ExpoConfig, getConfig } from '@expo/config';
import { closeJsInspector, MessageSocket } from '@expo/dev-server';
import { Server } from 'http';

import * as Log from '../log';
import * as Android from './android/Android';
import * as DevSession from './api/DevSession';
import ProcessSettings from './api/ProcessSettings';
import * as ProjectSettings from './api/ProjectSettings';
import { startDevServerAsync, StartOptions } from './metro/startDevServerAsync';
import { startTunnelsAsync, stopTunnelsAsync } from './ngrok/ngrok';
import { watchBabelConfigForProject } from './watchBabelConfig';
import * as Webpack from './webpack/Webpack';

let serverInstance: Server | null = null;
let messageSocket: MessageSocket | null = null;

/**
 * Sends a message over web sockets to any connected device,
 * does nothing when the dev server is not running.
 *
 * @param method name of the command. In RN projects `reload`, and `devMenu` are available. In Expo Go, `sendDevCommand` is available.
 * @param params
 */
export function broadcastMessage(
  method: 'reload' | 'devMenu' | 'sendDevCommand',
  params?: Record<string, any> | undefined
) {
  if (messageSocket) {
    messageSocket.broadcast(method, params);
  }
}

export async function startAsync(
  projectRoot: string,
  {
    exp = getConfig(projectRoot, { skipSDKVersionRequirement: true }).exp,
    ...options
  }: StartOptions & { exp?: ExpoConfig } = {}
): Promise<ExpoConfig> {
  Analytics.logEvent('Start Project', {
    developerTool: ProcessSettings.developerTool,
    sdkVersion: exp.sdkVersion ?? null,
  });

  watchBabelConfigForProject(projectRoot);

  if (options.webOnly) {
    await Webpack.startAsync(projectRoot, {
      ...options,
      port: options.webpackPort,
    });
  } else {
    [serverInstance, , messageSocket] = await startDevServerAsync(projectRoot, options);
  }

  const { hostType } = await ProjectSettings.readAsync(projectRoot);

  if (!ProcessSettings.isOffline && hostType === 'tunnel') {
    try {
      await startTunnelsAsync(projectRoot);
    } catch (e: any) {
      Log.error(`Error starting ngrok: ${e.message}`);
    }
  }

  const target = !options.webOnly || Webpack.isTargetingNative() ? 'native' : 'web';
  // This is used to make Expo Go open the project in either Expo Go, or the web browser.
  // Must come after ngrok (`startTunnelsAsync`) setup.
  DevSession.startSession(projectRoot, exp, target);
  return exp;
}

async function stopDevServerAsync() {
  return new Promise<void>((resolve, reject) => {
    if (serverInstance) {
      closeJsInspector();
      serverInstance.close((error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    }
  });
}

async function stopInternalAsync(projectRoot: string): Promise<void> {
  DevSession.stopSession();

  await Promise.all([
    Webpack.stopAsync(projectRoot),
    stopDevServerAsync(),
    async () => {
      if (!ProcessSettings.isOffline) {
        try {
          await stopTunnelsAsync(projectRoot);
        } catch (e: any) {
          Log.error(`Error stopping ngrok: ${e.message}`);
        }
      }
    },
    await Android.maybeStopAdbDaemonAsync(),
  ]);
}

async function forceQuitAsync(projectRoot: string) {
  // find RN packager and ngrok pids, attempt to kill them manually
  const { packagerPid, ngrokPid } = await ProjectSettings.readPackagerInfoAsync(projectRoot);
  if (packagerPid) {
    try {
      process.kill(packagerPid);
    } catch (e) {}
  }
  if (ngrokPid) {
    try {
      process.kill(ngrokPid);
    } catch (e) {}
  }
  await ProjectSettings.setPackagerInfoAsync(projectRoot, {
    packagerPort: null,
    packagerPid: null,
    packagerNgrokUrl: null,
    ngrokPid: null,
    webpackServerPort: null,
  });
}

export async function stopAsync(projectRoot: string): Promise<void> {
  try {
    const result = await Promise.race([
      stopInternalAsync(projectRoot),
      new Promise((resolve) => setTimeout(resolve, 2000, 'stopFailed')),
    ]);
    if (result === 'stopFailed') {
      await forceQuitAsync(projectRoot);
    }
  } catch (error) {
    await forceQuitAsync(projectRoot);
    throw error;
  }
}
