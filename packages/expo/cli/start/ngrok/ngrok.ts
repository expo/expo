import { readExpRcAsync } from '@expo/config';
import * as path from 'path';

import * as Log from '../../log';
import { delayAsync } from '../../utils/delay';
import { CommandError } from '../../utils/errors';
import * as Android from '../android/Android';
import * as ProjectSettings from '../api/ProjectSettings';
import UserSettings from '../api/UserSettings';
import * as UrlUtils from './ngrokUrl';
import { NgrokOptions, resolveNgrokAsync } from './resolveNgrok';

const NGROK_CONFIG = {
  authToken: '5W1bR67GNbWcXqmxZzBG1_56GezNeaX6sSRvn8npeQ8',
  authTokenPublicId: '5W1bR67GNbWcXqmxZzBG1',
  domain: 'exp.direct',
};

function getNgrokConfigPath() {
  return path.join(UserSettings.getDirectory(), 'ngrok.yml');
}

async function getProjectRandomnessAsync(projectRoot: string) {
  const ps = await ProjectSettings.readAsync(projectRoot);
  const randomness = ps.urlRandomness;
  if (randomness) {
    return randomness;
  } else {
    return resetProjectRandomnessAsync(projectRoot);
  }
}

async function resetProjectRandomnessAsync(projectRoot: string) {
  const randomness = UrlUtils.someRandomness();
  ProjectSettings.setAsync(projectRoot, { urlRandomness: randomness });
  return randomness;
}

async function connectToNgrokAsync(
  projectRoot: string,
  ngrok: any,
  args: NgrokOptions,
  hostnameAsync: () => Promise<string>,
  ngrokPid: number | null | undefined,
  attempts: number = 0
): Promise<string> {
  try {
    const configPath = getNgrokConfigPath();
    const hostname = await hostnameAsync();
    const url = await ngrok.connect({
      hostname,
      configPath,
      onStatusChange: handleStatusChange.bind(null, projectRoot),
      ...args,
    });
    return url;
  } catch (e: any) {
    // Attempt to connect 3 times
    if (attempts >= 2) {
      if (e.message) {
        throw new CommandError('NGROK_ERROR', e.toString());
      } else {
        throw new CommandError('NGROK_ERROR', JSON.stringify(e));
      }
    }
    if (!attempts) {
      attempts = 0;
    } // Attempt to fix the issue
    if (e.error_code && e.error_code === 103) {
      if (attempts === 0) {
        // Failed to start tunnel. Might be because url already bound to another session.
        if (ngrokPid) {
          try {
            process.kill(ngrokPid, 'SIGKILL');
          } catch (e) {
            Log.debug(`Couldn't kill ngrok with PID ${ngrokPid}`);
          }
        } else {
          await ngrok.kill();
        }
      } else {
        // Change randomness to avoid conflict if killing ngrok didn't help
        await resetProjectRandomnessAsync(projectRoot);
      }
    } // Wait 100ms and then try again
    await delayAsync(100);
    return connectToNgrokAsync(projectRoot, ngrok, args, hostnameAsync, null, attempts + 1);
  }
}

const TUNNEL_TIMEOUT = 10 * 1000;

export async function startTunnelsAsync(
  projectRoot: string,
  options: { autoInstall?: boolean } = {}
): Promise<void> {
  const ngrok = await resolveNgrokAsync(projectRoot, options);
  const username = (await UserManager.getCurrentUsernameAsync()) || ANONYMOUS_USERNAME;
  const { packagerPort, ngrokPid } = await ProjectSettings.readPackagerInfoAsync(projectRoot);
  if (!packagerPort) {
    throw new CommandError(
      'NO_PACKAGER_PORT',
      `No dev server found for project at ${projectRoot}.`
    );
  }

  await stopTunnelsAsync(projectRoot);
  if (await Android.startAdbReverseAsync(projectRoot)) {
    Log.log(
      'Successfully ran `adb reverse`. Localhost URLs should work on the connected Android device.'
    );
  }
  const packageShortName = path.parse(projectRoot).base;
  const expRc = await readExpRcAsync(projectRoot);

  let startedTunnelsSuccessfully = false;

  // Some issues with ngrok cause it to hang indefinitely. After
  // TUNNEL_TIMEOUTms we just throw an error.
  await Promise.race([
    (async () => {
      await delayAsync(TUNNEL_TIMEOUT);
      if (!startedTunnelsSuccessfully) {
        throw new Error('Starting tunnels timed out');
      }
    })(),

    (async () => {
      const createResolver = (extra: string[] = []) =>
        async function resolveHostnameAsync() {
          const randomness = expRc.manifestTunnelRandomness
            ? expRc.manifestTunnelRandomness
            : await getProjectRandomnessAsync(projectRoot);
          return [
            ...extra,
            randomness,
            UrlUtils.domainify(username),
            UrlUtils.domainify(packageShortName),
            NGROK_CONFIG.domain,
          ].join('.');
        };

      // Custom dev server will share the port across expo and metro dev servers,
      // this means we only need one ngrok URL.
      const packagerNgrokUrl = await connectToNgrokAsync(
        projectRoot,
        ngrok,
        {
          authtoken: NGROK_CONFIG.authToken,
          port: packagerPort,
          proto: 'http',
        },
        createResolver(),
        ngrokPid
      );

      await ProjectSettings.setPackagerInfoAsync(projectRoot, {
        packagerNgrokUrl,
        ngrokPid: ngrok.getActiveProcess().pid,
      });

      startedTunnelsSuccessfully = true;

      Log.log('Tunnel ready.');
    })(),
  ]);
}

export async function stopTunnelsAsync(projectRoot: string): Promise<void> {
  const ngrok = await resolveNgrokAsync(projectRoot, { shouldPrompt: false }).catch(() => null);
  if (!ngrok) {
    return;
  }

  // This will kill all ngrok tunnels in the process.
  // We'll need to change this if we ever support more than one project
  // open at a time in XDE.
  const { ngrokPid } = await ProjectSettings.readPackagerInfoAsync(projectRoot);
  const ngrokProcess = ngrok.getActiveProcess();
  const ngrokProcessPid = ngrokProcess ? ngrokProcess.pid : null;
  if (ngrokPid && ngrokPid !== ngrokProcessPid) {
    // Ngrok is running in some other process. Kill at the os level.
    try {
      process.kill(ngrokPid);
    } catch (e) {
      Log.debug(`Couldn't kill ngrok with PID ${ngrokPid}`);
    }
  } else {
    // Ngrok is running from the current process. Kill using ngrok api.
    await ngrok.kill();
  }
  await ProjectSettings.setPackagerInfoAsync(projectRoot, {
    packagerNgrokUrl: null,
    ngrokPid: null,
  });
  await Android.stopAdbReverseAsync(projectRoot);
}

function handleStatusChange(projectRoot: string, status: string) {
  if (status === 'closed') {
    Log.error(
      'We noticed your tunnel is having issues. ' +
        'This may be due to intermittent problems with our tunnel provider. ' +
        'If you have trouble connecting to your app, try to Restart the project, ' +
        'or switch Host to LAN.'
    );
  } else if (status === 'connected') {
    Log.log('Tunnel connected.');
  }
}
