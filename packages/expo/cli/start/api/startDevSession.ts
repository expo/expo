import { ExpoConfig } from '@expo/config';

import { updateDevelopmentSessionAsync } from '../../api/updateDevelopmentSession';
import { getUserAsync } from '../../api/user/user';
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

  await updateDevelopmentSessionAsync({
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
