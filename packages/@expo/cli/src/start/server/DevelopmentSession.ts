import { ExpoConfig, getConfig } from '@expo/config';

import {
  closeDevelopmentSessionAsync,
  updateDevelopmentSessionAsync,
} from '../../api/updateDevelopmentSession';
import { getUserAsync } from '../../api/user/user';
import { env } from '../../utils/env';
import * as ProjectDevices from '../project/devices';

const debug = require('debug')('expo:start:server:developmentSession') as typeof console.log;

async function isAuthenticatedAsync(): Promise<boolean> {
  return !!(await getUserAsync().catch(() => null));
}

export class DevelopmentSession {
  /** If the `startAsync` was successfully called */
  private hasActiveSession = false;

  constructor(
    /** Project root directory. */
    private projectRoot: string,
    /** Development Server URL. */
    public url: string | null
  ) {}

  /**
   * Notify the Expo servers that a project is running, this enables the Expo Go app
   * and Dev Clients to offer a "recently in development" section for quick access.
   *
   * @param projectRoot Project root folder, used for retrieving device installation IDs.
   * @param props.exp Partial Expo config with values that will be used in the Expo Go app.
   * @param props.runtime which runtime the app should be opened in. `native` for dev clients, `web` for web browsers.
   */
  public async startAsync({
    exp = getConfig(this.projectRoot).exp,
    runtime,
  }: {
    exp?: Pick<ExpoConfig, 'name' | 'description' | 'slug' | 'primaryColor'>;
    runtime: 'native' | 'web';
  }): Promise<void> {
    try {
      if (env.CI || env.EXPO_OFFLINE) {
        debug(
          env.CI
            ? 'This project will not be suggested in Expo Go or Dev Clients because Expo CLI is running in CI.'
            : 'This project will not be suggested in Expo Go or Dev Clients because Expo CLI is running in offline-mode.'
        );
        return;
      }

      const deviceIds = await this.getDeviceInstallationIdsAsync();

      if (!(await isAuthenticatedAsync()) && !deviceIds?.length) {
        debug(
          'Development session will not ping because the user is not authenticated and there are no devices.'
        );
        return;
      }

      if (this.url) {
        debug(`Development session ping (runtime: ${runtime}, url: ${this.url})`);
        await updateDevelopmentSessionAsync({
          url: this.url,
          runtime,
          exp,
          deviceIds,
        });
        this.hasActiveSession = true;
      }
    } catch (error: any) {
      debug(`Error updating development session API: ${error}`);
    }
  }

  /** Get all recent devices for the project. */
  private async getDeviceInstallationIdsAsync(): Promise<string[]> {
    const { devices } = await ProjectDevices.getDevicesInfoAsync(this.projectRoot);
    return devices.map(({ installationId }) => installationId);
  }

  /** Try to close any pending development sessions, but always resolve */
  public async closeAsync(): Promise<boolean> {
    if (env.CI || env.EXPO_OFFLINE || !this.hasActiveSession) {
      return false;
    }

    // Clear out the development session, even if the call fails.
    // This blocks subsequent calls to `stopAsync`
    this.hasActiveSession = false;

    try {
      const deviceIds = await this.getDeviceInstallationIdsAsync();

      if (!(await isAuthenticatedAsync()) && !deviceIds?.length) {
        return false;
      }

      if (this.url) {
        await closeDevelopmentSessionAsync({
          url: this.url,
          deviceIds,
        });
      }

      return true;
    } catch (error: any) {
      debug(`Error closing development session API: ${error}`);
      return false;
    }
  }
}
