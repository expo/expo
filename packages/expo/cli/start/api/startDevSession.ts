import { ExpoConfig } from '@expo/config';
import os from 'os';
import { URLSearchParams } from 'url';

import * as Log from '../../log';
import { apiClient } from '../../utils/api';
import { CommandError } from '../../utils/errors';
import { getUserAsync } from '../../utils/user/user';
import { constructDeepLinkAsync } from '../serverUrl';
import ProcessSettings from './ProcessSettings';
import * as ProjectDevices from './ProjectDevices';

const UPDATE_FREQUENCY = 20 * 1000; // 20 seconds

let timeout: ReturnType<typeof setTimeout>;

/**
 *
 * @param projectRoot
 * @param exp
 * @param runtime which runtime the app should be opened in. `native` for dev clients, `web` for web browsers.
 * @returns
 */
export async function startDevSessionAsync(
  projectRoot: string,
  {
    exp,
    runtime,
  }: {
    exp: Pick<ExpoConfig, 'name' | 'description' | 'slug' | 'primaryColor'>;
    runtime: 'native' | 'web';
  }
): Promise<void> {
  if (ProcessSettings.isOffline) {
    stopDevSession();
    return;
  }

  const user = await getUserAsync().catch(() => null);
  const deviceIds = await getDeviceInstallationIdsAsync(projectRoot);

  if (!user && !deviceIds?.length) {
    stopDevSession();
    return;
  }

  const url = await getRuntimeUrlAsync(projectRoot, runtime);

  await notifyAliveAsync({
    url,
    runtime,
    exp,
    deviceIds,
  });

  stopDevSession();
  timeout = setTimeout(() => startDevSessionAsync(projectRoot, { exp, runtime }), UPDATE_FREQUENCY);
}

async function getDeviceInstallationIdsAsync(projectRoot: string): Promise<string[]> {
  const { devices } = await ProjectDevices.getDevicesInfoAsync(projectRoot);
  return devices?.map(({ installationId }) => installationId);
}

export function stopDevSession() {
  clearTimeout(timeout);
}

async function getRuntimeUrlAsync(projectRoot: string, runtime: 'native' | 'web'): Promise<string> {
  if (runtime === 'native') {
    return await constructDeepLinkAsync(projectRoot);
  } else if (runtime === 'web') {
    const WebpackDevServer = await import('../webpack/WebpackDevServer');
    // Use localhost since this URL will be used in-app, meaning the ip address won't match the computer.
    return WebpackDevServer.getDevServerUrl({ hostType: 'localhost' });
  }
  stopDevSession();
  throw new CommandError('PLATFORM', `Unsupported runtime target: ${runtime}`);
}

async function notifyAliveAsync({
  deviceIds,
  exp,
  runtime,
  url,
}: {
  deviceIds: string[];
  exp: Pick<ExpoConfig, 'name' | 'description' | 'slug' | 'primaryColor'>;
  runtime: 'native' | 'web';
  url: string;
}) {
  const searchParams = new URLSearchParams();
  deviceIds.forEach((id) => {
    searchParams.append('deviceId', id);
  });

  await apiClient
    .post(`development-sessions/notify-alive`, {
      searchParams,
      json: {
        data: {
          session: {
            description: `${exp.name} on ${os.hostname()}`,
            hostname: os.hostname(),
            platform: runtime,
            config: {
              // TODO: if icons are specified, upload a url for them too so people can distinguish
              description: exp.description,
              name: exp.name,
              slug: exp.slug,
              primaryColor: exp.primaryColor,
            },
            url,
            source: 'desktop',
          },
        },
      },
    })
    .catch((e) => {
      Log.debug(`Error updating dev session: ${e}`);
    });
}
