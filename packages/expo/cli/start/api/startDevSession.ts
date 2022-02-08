import { ExpoConfig } from '@expo/config';
import os from 'os';
import { URLSearchParams } from 'url';

import { fetchAsync } from '../../api/rest/client';
import { getUserAsync } from '../../api/user/user';
import * as Log from '../../log';
import { CommandError } from '../../utils/errors';
import { constructDeepLink } from '../serverUrl';
import * as WebpackDevServer from '../webpack/WebpackDevServer';
import ProcessSettings from './ProcessSettings';
import * as ProjectDevices from './ProjectDevices';

const UPDATE_FREQUENCY = 20 * 1000; // 20 seconds

let timeout: ReturnType<typeof setTimeout>;

async function isAuthenticatedAsync() {
  return !!(await getUserAsync().catch(() => null));
}

/**
 * @param projectRoot Project root folder, used for retrieving device installation ids.
 * @param props.exp Partial Expo config with values that will be used in the Expo Go app.
 * @param props.runtime which runtime the app should be opened in. `native` for dev clients, `web` for web browsers.
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

  const deviceIds = await getDeviceInstallationIdsAsync(projectRoot);

  if (!(await isAuthenticatedAsync()) && !deviceIds?.length) {
    stopDevSession();
    return;
  }

  const url = getRuntimeUrl(runtime);

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

function getRuntimeUrl(runtime: 'native' | 'web'): string {
  if (runtime === 'native') {
    return constructDeepLink();
  } else if (runtime === 'web') {
    // Use localhost since this URL will be used in-app, meaning the ip address won't match the computer.
    return WebpackDevServer.getDevServerUrl({ hostType: 'localhost' });
  }
  stopDevSession();
  throw new CommandError('PLATFORM', `Unsupported runtime target: ${runtime}`);
}

export function createSessionInfo({
  exp,
  runtime,
  url,
}: {
  exp: Pick<ExpoConfig, 'name' | 'description' | 'slug' | 'primaryColor'>;
  runtime: 'native' | 'web';
  url: string;
}) {
  return {
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
  };
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

  await fetchAsync('/development-sessions/notify-alive', {
    searchParams,
    method: 'POST',
    body: JSON.stringify({
      data: createSessionInfo({ exp, runtime, url }),
    }),
  }).catch((e) => {
    Log.debug(`Error updating dev session: ${e}`);
  });
}
