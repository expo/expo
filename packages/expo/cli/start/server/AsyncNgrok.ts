import * as PackageManager from '@expo/package-manager';
import chalk from 'chalk';
import crypto from 'crypto';
import * as path from 'path';
import resolveFrom from 'resolve-from';
import semver from 'semver';
import slugify from 'slugify';

import { getActorDisplayName, getUserAsync } from '../../api/user/user';
import UserSettings from '../../api/user/UserSettings';
import * as Log from '../../log';
import { delayAsync } from '../../utils/delay';
import { EXPO_DEBUG } from '../../utils/env';
import { CommandError } from '../../utils/errors';
import { installExitHooks } from '../../utils/exit';
import { confirmAsync } from '../../utils/prompts';
import { startAdbReverseAsync } from '../platforms/android/AndroidDeviceBridge';
import { ProjectSettings } from '../project/ProjectSettings';

export interface NgrokOptions {
  authtoken?: string;
  port?: string | number | null;
  host?: string;
  httpauth?: string;
  region?: string;
  configPath?: string;

  proto?: 'http' | 'tcp' | 'tls';
  addr?: string;
  inspect?: boolean;
  auth?: string;
  host_header?: string;
  bind_tls?: true | false | 'both';
  subdomain?: string;
  hostname?: string;
  crt?: string;
  key?: string;
  client_cas?: string;
  remote_addr?: string;
}

export interface NgrokInstance {
  getActiveProcess(): { pid: number };
  connect(
    props: {
      hostname: string;
      configPath: string;
      onStatusChange: (status: string) => void;
    } & NgrokOptions
  );
  kill(): Promise<void>;
}

const NGROK_CONFIG = {
  authToken: '5W1bR67GNbWcXqmxZzBG1_56GezNeaX6sSRvn8npeQ8',
  domain: 'exp.direct',
};

const TUNNEL_TIMEOUT = 10 * 1000;

const EXPO_NGROK_REQUIRED_VERSION = '^4.1.0';

export class AsyncNgrok {
  private instance: NgrokInstance | null = null;

  /** Info about the currently running instance of ngrok. */
  private serverUrl: string | null = null;

  constructor(private projectRoot: string, private port: number) {}

  /** Get the active pid from the running instance of ngrok. */
  // TODO: Use this instead of a stored local value.
  private getActivePid(): number | null {
    return this.instance?.getActiveProcess?.()?.pid ?? null;
  }

  public getActiveUrl(): string | null {
    return this.serverUrl;
  }

  /** Terminate the instance by the pid. */
  private killInstance() {
    const pid = this.getActivePid();
    if (pid !== null) {
      try {
        process.kill(pid);
      } catch (e) {
        Log.error(`Failed to kill ngrok tunnel PID: ${pid}`);
      }
    }
  }

  private async getProjectHostnameAsync() {
    // TODO: Maybe assert no robot users?
    const username = getActorDisplayName(await getUserAsync());

    return [
      // TODO: Is this needed?
      await this.getProjectRandomnessAsync(),
      slugify(username),
      // TODO: Is this needed?
      slugify(path.basename(this.projectRoot)),
      // Use the port to distinguish between multiple tunnels (webpack, metro).
      this.port,
      NGROK_CONFIG.domain,
    ].join('.');
  }

  async startAsync(): Promise<void> {
    // Ensure that force quitting can clean up ngrok.
    installExitHooks(() => {
      this.killInstance();
    });

    // Ensure the instance is loaded first, this can linger so we should run it before the timeout.
    await this.resolveNgrokAsync();

    // Ensure ADB reverse is running.
    if (!(await startAdbReverseAsync([this.port]))) {
      // TODO: Better error message.
      throw new CommandError(
        'NGROK_ADB',
        `Cannot start tunnel URL because \`adb reverse\` failed for the connected Android(s).`
      );
    }

    this.serverUrl = await this.connectToNgrokAsync();

    Log.debug('[ngrok] Tunnel URL:', this.serverUrl);
    Log.log('Tunnel ready.');
  }

  public async stopAsync(): Promise<void> {
    Log.debug('[ngrok] Stopping Tunnel');

    await this.instance?.kill?.();
    this.serverUrl = null;
  }

  private async resolveNgrokAsync({
    shouldPrompt = true,
    autoInstall = false,
  }: { shouldPrompt?: boolean; autoInstall?: boolean } = {}): Promise<NgrokInstance> {
    const ngrok = await this.resolveBestInstanceAsync();
    if (ngrok) {
      return ngrok;
    }

    const packageName = `@expo/ngrok@${EXPO_NGROK_REQUIRED_VERSION}`;
    if (!autoInstall) {
      // Delay the prompt so it doesn't conflict with other dev tool logs
      await delayAsync(100);
    }
    const answer =
      autoInstall ||
      (shouldPrompt &&
        (await confirmAsync({
          message: `The package ${packageName} is required to use tunnels, would you like to install it globally?`,
          initial: true,
        })));
    if (answer) {
      Log.log(chalk`Installing ${packageName} for {bold tunnel} support...`);

      const packageManager = PackageManager.createForProject(this.projectRoot, {
        silent: !EXPO_DEBUG,
      });

      try {
        await packageManager.addGlobalAsync(packageName);
        Log.log(`Successfully installed ${packageName}`);
      } catch (e) {
        e.message = `Failed to install ${packageName} globally: ${e.message}`;
        throw e;
      }
      return await this.resolveNgrokAsync({ shouldPrompt: false });
    }

    throw new CommandError(
      'NGROK_AVAILABILITY',
      `Please install ${packageName} and try again, or try using another hosting method like lan or localhost`
    );
  }

  // Resolve a copy that's installed in the project.
  private async resolvePackageFromProjectAsync() {
    try {
      const ngrokPackagePath = resolveFrom(this.projectRoot, '@expo/ngrok/package.json');
      const pkg = require(ngrokPackagePath);
      if (pkg && semver.satisfies(pkg.version, EXPO_NGROK_REQUIRED_VERSION)) {
        const ngrokPath = resolveFrom(this.projectRoot, '@expo/ngrok');
        Log.debug(`Resolving @expo/ngrok from project: "${ngrokPath}"`);
        return require(ngrokPath);
      }
    } catch {}
    return null;
  }

  // Resolve a copy that's installed globally.
  private async resolveGlobalPackageAsync(): Promise<NgrokInstance | null> {
    const requireg = await import('requireg').then((module) => module.default);
    try {
      // use true to disable the use of local packages.
      const pkg = requireg('@expo/ngrok/package.json', true);
      if (semver.satisfies(pkg.version, EXPO_NGROK_REQUIRED_VERSION)) {
        Log.debug(`Resolving global @expo/ngrok from: "${requireg.resolve('@expo/ngrok')}"`);
        return requireg('@expo/ngrok', true);
      }
    } catch {}

    return null;
  }

  private async resolveBestInstanceAsync(): Promise<NgrokInstance | null> {
    if (!this.instance) {
      this.instance = await this.resolvePackageFromProjectAsync();
      if (!this.instance) {
        this.instance = await this.resolveGlobalPackageAsync();
      }
    }

    return this.instance ?? null;
  }

  private async connectToNgrokAsync(attempts: number = 0): Promise<string> {
    // Attempt to stop any hanging processes, this increases the chances of a successful connection.
    await this.stopAsync();

    // Some issues with ngrok cause it to hang indefinitely. After
    // TUNNEL_TIMEOUTms we just throw an error.
    const timeout = setTimeout(() => {
      throw new CommandError('NGROK_TIMEOUT', 'Ngrok tunnel took too long to connect.');
    }, TUNNEL_TIMEOUT);

    try {
      const instance = await this.resolveBestInstanceAsync();

      // Global config path.
      const configPath = path.join(UserSettings.getDirectory(), 'ngrok.yml');
      Log.debug('[ngrok] Global config path:', configPath);
      const hostname = await this.getProjectHostnameAsync();
      Log.debug('[ngrok] Hostname:', hostname);

      const url = await instance.connect({
        authtoken: NGROK_CONFIG.authToken,
        proto: 'http',
        hostname,
        configPath,
        onStatusChange(status) {
          if (status === 'closed') {
            Log.error(
              'We noticed your tunnel is having issues. ' +
                'This may be due to intermittent problems with Ngrok. ' +
                'If you have trouble connecting to your app, try to restart the project, ' +
                'or switch the host to `lan`.'
            );
          } else if (status === 'connected') {
            Log.log('Tunnel connected.');
          }
        },
        port: this.port,
      });
      // Clear the timeout since we succeeded.
      clearTimeout(timeout);
      return url;
    } catch (error: any) {
      // Clear the timeout since we're no longer attempting to connect to a remote.
      clearTimeout(timeout);

      // Attempt to connect 3 times
      if (attempts >= 2) {
        throw new CommandError('NGROK_CONNECT', error.toString());
      }

      // Attempt to fix the issue
      if (error?.error_code === 103) {
        // Change randomness to avoid conflict if killing ngrok doesn't help
        await this.resetProjectRandomnessAsync();
      }

      // Wait 100ms and then try again
      await delayAsync(100);
      return this.connectToNgrokAsync(attempts + 1);
    }
  }

  private async getProjectRandomnessAsync() {
    const { urlRandomness: randomness } = await ProjectSettings.readAsync(this.projectRoot);
    if (randomness) {
      return randomness;
    }
    return await this.resetProjectRandomnessAsync();
  }

  private async resetProjectRandomnessAsync() {
    const randomness = crypto.randomBytes(5).toString('base64url');
    await ProjectSettings.setAsync(this.projectRoot, { urlRandomness: randomness });
    Log.debug('[ngrok] Resetting project randomness:', randomness);
    return randomness;
  }
}
