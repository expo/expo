import { ExpoConfig, getConfig } from '@expo/config';

import { updateDevelopmentSessionAsync } from '../../api/updateDevelopmentSession';
import { getUserAsync } from '../../api/user/user';
import { ProcessSettings } from '../ProcessSettings';
import * as ProjectDevices from '../project/ProjectDevices';

const UPDATE_FREQUENCY = 20 * 1000; // 20 seconds

async function isAuthenticatedAsync() {
  return !!(await getUserAsync().catch(() => null));
}

export class DevelopmentSession {
  private timeout: ReturnType<typeof setTimeout>;

  constructor(public projectRoot: string, public url: string) {}

  /**
   * Notify the Expo servers that a project is running, this enables the Expo Go app
   * and Dev Clients to offer a "recently in development" section for quick access.
   *
   * This method starts an interval that will continue to ping the servers until we stop it.
   *
   * @param projectRoot Project root folder, used for retrieving device installation ids.
   * @param props.exp Partial Expo config with values that will be used in the Expo Go app.
   * @param props.runtime which runtime the app should be opened in. `native` for dev clients, `web` for web browsers.
   * @returns
   */
  public async startDevSessionAsync({
    exp = getConfig(this.projectRoot).exp,
    runtime,
  }: {
    exp?: Pick<ExpoConfig, 'name' | 'description' | 'slug' | 'primaryColor'>;
    runtime: 'native' | 'web';
  }): Promise<void> {
    if (ProcessSettings.isOffline) {
      this.stopSession();
      return;
    }

    const deviceIds = await this.getDeviceInstallationIdsAsync();

    if (!(await isAuthenticatedAsync()) && !deviceIds?.length) {
      this.stopSession();
      return;
    }

    await updateDevelopmentSessionAsync({
      url: this.url,
      runtime,
      exp,
      deviceIds,
    });

    this.stopSession();

    this.timeout = setTimeout(() => this.startDevSessionAsync({ exp, runtime }), UPDATE_FREQUENCY);
  }

  /** Get all recent devices for the project. */
  private async getDeviceInstallationIdsAsync(): Promise<string[]> {
    const { devices } = await ProjectDevices.getDevicesInfoAsync(this.projectRoot);
    return devices?.map(({ installationId }) => installationId);
  }

  /** Stop notifying the Expo servers that the development session is running. */
  public stopSession() {
    clearTimeout(this.timeout);
  }
}
