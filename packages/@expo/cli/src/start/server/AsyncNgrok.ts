import chalk from 'chalk';
import crypto from 'crypto';
import * as path from 'path';
import slugify from 'slugify';

import UserSettings from '../../api/user/UserSettings';
import { getActorDisplayName, getUserAsync } from '../../api/user/user';
import * as Log from '../../log';
import { delayAsync, resolveWithTimeout } from '../../utils/delay';
import { env } from '../../utils/env';
import { CommandError } from '../../utils/errors';
import { isNgrokClientError, NgrokInstance, NgrokResolver } from '../doctor/ngrok/NgrokResolver';
import { hasAdbReverseAsync, startAdbReverseAsync } from '../platforms/android/adbReverse';
import { ProjectSettings } from '../project/settings';

const debug = require('debug')('expo:start:server:ngrok') as typeof console.log;

const NGROK_CONFIG = {
  authToken: '5W1bR67GNbWcXqmxZzBG1_56GezNeaX6sSRvn8npeQ8',
  domain: 'exp.direct',
};

const TUNNEL_TIMEOUT = 10 * 1000;

export class AsyncNgrok {
  /** Resolves the best instance of ngrok, exposed for testing. */
  resolver: NgrokResolver;

  /** Info about the currently running instance of ngrok. */
  private serverUrl: string | null = null;

  constructor(
    private projectRoot: string,
    private port: number
  ) {
    this.resolver = new NgrokResolver(projectRoot);
  }

  public getActiveUrl(): string | null {
    return this.serverUrl;
  }

  /** Exposed for testing. */
  async _getIdentifyingUrlSegmentsAsync(): Promise<string[]> {
    const user = await getUserAsync();
    if (user?.__typename === 'Robot') {
      throw new CommandError('NGROK_ROBOT', 'Cannot use ngrok with a robot user.');
    }
    const username = getActorDisplayName(user);

    return [
      // NOTE: https://github.com/expo/expo/pull/16556#discussion_r822944286
      await this.getProjectRandomnessAsync(),
      slugify(username),
      // Use the port to distinguish between multiple tunnels (webpack, metro).
      String(this.port),
    ];
  }

  /** Exposed for testing. */
  async _getProjectHostnameAsync(): Promise<string> {
    return `${(await this._getIdentifyingUrlSegmentsAsync()).join('-')}.${NGROK_CONFIG.domain}`;
  }

  /** Exposed for testing. */
  async _getProjectSubdomainAsync(): Promise<string> {
    return (await this._getIdentifyingUrlSegmentsAsync()).join('-');
  }

  /** Start ngrok on the given port for the project. */
  async startAsync({ timeout }: { timeout?: number } = {}): Promise<void> {
    // Ensure the instance is loaded first, this can linger so we should run it before the timeout.
    await this.resolver.resolveAsync({
      // For now, prefer global install since the package has native code (harder to install) and doesn't change very often.
      prefersGlobalInstall: true,
    });

    // NOTE(EvanBacon): If the user doesn't have ADB installed,
    // then skip attempting to reverse the port.
    if (hasAdbReverseAsync()) {
      // Ensure ADB reverse is running.
      if (!(await startAdbReverseAsync([this.port]))) {
        // TODO: Better error message.
        throw new CommandError(
          'NGROK_ADB',
          `Cannot start tunnel URL because \`adb reverse\` failed for the connected Android device(s).`
        );
      }
    }

    this.serverUrl = await this._connectToNgrokAsync({ timeout });

    debug('Tunnel URL:', this.serverUrl);
    Log.log('Tunnel ready.');
  }

  /** Stop the ngrok process if it's running. */
  public async stopAsync(): Promise<void> {
    debug('Stopping Tunnel');

    await this.resolver.get()?.kill?.();
    this.serverUrl = null;
  }

  /** Exposed for testing. */
  async _connectToNgrokAsync(
    options: { timeout?: number } = {},
    attempts: number = 0
  ): Promise<string> {
    // Attempt to stop any hanging processes, this increases the chances of a successful connection.
    await this.stopAsync();

    // Get the instance quietly or assert otherwise.
    const instance = await this.resolver.resolveAsync({
      shouldPrompt: false,
      autoInstall: false,
    });

    // TODO(Bacon): Consider dropping the timeout functionality:
    // https://github.com/expo/expo/pull/16556#discussion_r822307373
    const results = await resolveWithTimeout(
      () => this.connectToNgrokInternalAsync(instance, attempts),
      {
        timeout: options.timeout ?? TUNNEL_TIMEOUT,
        errorMessage: 'ngrok tunnel took too long to connect.',
      }
    );
    if (typeof results === 'string') {
      return results;
    }

    // Wait 100ms and then try again
    await delayAsync(100);

    return this._connectToNgrokAsync(options, attempts + 1);
  }

  private async _getConnectionPropsAsync(): Promise<{ hostname?: string; subdomain?: string }> {
    const userDefinedSubdomain = env.EXPO_TUNNEL_SUBDOMAIN;
    if (userDefinedSubdomain) {
      const subdomain =
        typeof userDefinedSubdomain === 'string'
          ? userDefinedSubdomain
          : await this._getProjectSubdomainAsync();
      debug('Subdomain:', subdomain);
      return { subdomain };
    } else {
      const hostname = await this._getProjectHostnameAsync();
      debug('Hostname:', hostname);
      return { hostname };
    }
  }

  private async connectToNgrokInternalAsync(
    instance: NgrokInstance,
    attempts: number = 0
  ): Promise<string | false> {
    try {
      // Global config path.
      const configPath = path.join(UserSettings.getDirectory(), 'ngrok.yml');
      debug('Global config path:', configPath);
      const urlProps = await this._getConnectionPropsAsync();

      const url = await instance.connect({
        ...urlProps,
        authtoken: NGROK_CONFIG.authToken,
        configPath,
        onStatusChange(status) {
          if (status === 'closed') {
            Log.error(
              chalk.red(
                'Tunnel connection has been closed. This is often related to intermittent connection problems with the Ngrok servers. Restart the dev server to try connecting to Ngrok again.'
              ) + chalk.gray('\nCheck the Ngrok status page for outages: https://status.ngrok.com/')
            );
          } else if (status === 'connected') {
            Log.log('Tunnel connected.');
          }
        },
        port: this.port,
      });
      return url;
    } catch (error: any) {
      const assertNgrok = () => {
        if (isNgrokClientError(error)) {
          throw new CommandError(
            'NGROK_CONNECT',
            [
              error.body.msg,
              error.body.details?.err,
              chalk.gray('Check the Ngrok status page for outages: https://status.ngrok.com/'),
            ]
              .filter(Boolean)
              .join('\n\n')
          );
        }
        throw new CommandError(
          'NGROK_CONNECT',
          error.toString() +
            chalk.gray('\nCheck the Ngrok status page for outages: https://status.ngrok.com/')
        );
      };

      // Attempt to connect 3 times
      if (attempts >= 2) {
        assertNgrok();
      }

      // Attempt to fix the issue
      if (isNgrokClientError(error) && error.body.error_code === 103) {
        // Assert early if a custom subdomain is used since it cannot
        // be changed and retried. If the tunnel subdomain is a boolean
        // then we can reset the randomness and try again.
        if (typeof env.EXPO_TUNNEL_SUBDOMAIN === 'string') {
          assertNgrok();
        }
        // Change randomness to avoid conflict if killing ngrok doesn't help
        await this._resetProjectRandomnessAsync();
      }

      return false;
    }
  }

  private async getProjectRandomnessAsync() {
    const { urlRandomness: randomness } = await ProjectSettings.readAsync(this.projectRoot);
    if (randomness) {
      return randomness;
    }
    return await this._resetProjectRandomnessAsync();
  }

  async _resetProjectRandomnessAsync() {
    const randomness = crypto.randomBytes(5).toString('base64url');
    await ProjectSettings.setAsync(this.projectRoot, { urlRandomness: randomness });
    debug('Resetting project randomness:', randomness);
    return randomness;
  }
}
