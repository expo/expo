import { getConfig } from '@expo/config';
import assert from 'assert';
import chalk from 'chalk';

import { Log } from '../../log';
import { logEventAsync } from '../../utils/analytics/rudderstackClient';
import { CommandError, UnimplementedError } from '../../utils/errors';
import { learnMore } from '../../utils/link';
import { AppIdResolver } from './AppIdResolver';
import { DeviceManager } from './DeviceManager';

const debug = require('debug')('expo:start:platforms:platformManager') as typeof console.log;

export interface BaseOpenInCustomProps {
  scheme?: string;
  applicationId?: string | null;
}

export interface BaseResolveDeviceProps<IDevice> {
  /** Should prompt the user to select a device. */
  shouldPrompt?: boolean;
  /** The target device to use. */
  device?: IDevice;
}

/** An abstract class for launching a URL on a device. */
export class PlatformManager<
  IDevice,
  IOpenInCustomProps extends BaseOpenInCustomProps = BaseOpenInCustomProps,
  IResolveDeviceProps extends BaseResolveDeviceProps<IDevice> = BaseResolveDeviceProps<IDevice>
> {
  constructor(
    protected projectRoot: string,
    protected props: {
      platform: 'ios' | 'android';
      /** Get the base URL for the dev server hosting this platform manager. */
      getDevServerUrl: () => string | null;
      /** Expo Go URL. */
      getExpoGoUrl: () => string;
      /**
       * Get redirect URL for native disambiguation.
       * @returns a URL like `http://localhost:19000/_expo/loading`
       */
      getRedirectUrl: () => string | null;
      /** Dev Client */
      getCustomRuntimeUrl: (props?: { scheme?: string }) => string | null;
      /** Resolve a device, this function should automatically handle opening the device and asserting any system validations. */
      resolveDeviceAsync: (
        resolver?: Partial<IResolveDeviceProps>
      ) => Promise<DeviceManager<IDevice>>;
    }
  ) {}

  /** Returns the project application identifier or asserts that one is not defined. Exposed for testing. */
  _getAppIdResolver(): AppIdResolver {
    throw new UnimplementedError();
  }

  /**
   * Get the URL for users intending to launch the project in Expo Go.
   * The CLI will check if the project has a custom dev client and if the redirect page feature is enabled.
   * If both are true, the CLI will return the redirect page URL.
   */
  protected async getExpoGoOrCustomRuntimeUrlAsync(
    deviceManager: DeviceManager<IDevice>
  ): Promise<string> {
    // Determine if the redirect page feature is enabled first since it's the cheapest to check.
    const redirectUrl = this.props.getRedirectUrl();
    if (redirectUrl) {
      // If the redirect page feature is enabled, check if the project has a resolvable native identifier.
      let applicationId;
      try {
        applicationId = await this._getAppIdResolver().getAppIdAsync();
      } catch {
        Log.warn(
          chalk`\u203A Launching in Expo Go. If you want to use a ` +
            `development build, you need to create and install one first, or, if you already ` +
            chalk`have a build, add {bold ios.bundleIdentifier} and {bold android.package} to ` +
            `this project's app config.\n${learnMore('https://docs.expo.dev/development/build/')}`
        );
      }
      if (applicationId) {
        debug(`Resolving launch URL: (appId: ${applicationId}, redirect URL: ${redirectUrl})`);
        // NOTE(EvanBacon): This adds considerable amount of time to the command, we should consider removing or memoizing it.
        // Finally determine if the target device has a custom dev client installed.
        if (await deviceManager.isAppInstalledAsync(applicationId)) {
          return redirectUrl;
        } else {
          // Log a warning if no development build is available on the device, but the
          // interstitial page would otherwise be opened.
          Log.warn(
            chalk`\u203A The {bold expo-dev-client} package is installed, but a development build is not ` +
              chalk`installed on {bold ${deviceManager.name}}.\nLaunching in Expo Go. If you want to use a ` +
              `development build, you need to create and install one first.\n${learnMore(
                'https://docs.expo.dev/development/build/'
              )}`
          );
        }
      }
    }

    return this.props.getExpoGoUrl();
  }

  protected async openProjectInExpoGoAsync(
    resolveSettings: Partial<IResolveDeviceProps> = {}
  ): Promise<{ url: string }> {
    const deviceManager = await this.props.resolveDeviceAsync(resolveSettings);
    const url = await this.getExpoGoOrCustomRuntimeUrlAsync(deviceManager);

    deviceManager.logOpeningUrl(url);

    // TODO: Expensive, we should only do this once.
    const { exp } = getConfig(this.projectRoot);
    const installedExpo = await deviceManager.ensureExpoGoAsync(exp.sdkVersion);

    deviceManager.activateWindowAsync();
    await deviceManager.openUrlAsync(url);

    await logEventAsync('Open Url on Device', {
      platform: this.props.platform,
      installedExpo,
    });

    return { url };
  }

  private async openProjectInCustomRuntimeAsync(
    resolveSettings: Partial<IResolveDeviceProps> = {},
    props: Partial<IOpenInCustomProps> = {}
  ): Promise<{ url: string }> {
    debug(
      `open custom (${Object.entries(props)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ')})`
    );

    let url = this.props.getCustomRuntimeUrl({ scheme: props.scheme });
    debug(`Opening project in custom runtime: ${url} -- %O`, props);
    // TODO: It's unclear why we do application id validation when opening with a URL
    const applicationId = props.applicationId ?? (await this._getAppIdResolver().getAppIdAsync());

    const deviceManager = await this.props.resolveDeviceAsync(resolveSettings);

    if (!(await deviceManager.isAppInstalledAsync(applicationId))) {
      throw new CommandError(
        `No development build (${applicationId}) for this project is installed. ` +
          `Please make and install a development build on the device first.\n${learnMore(
            'https://docs.expo.dev/development/build/'
          )}`
      );
    }

    // TODO: Rethink analytics
    await logEventAsync('Open Url on Device', {
      platform: this.props.platform,
      installedExpo: false,
    });

    if (!url) {
      url = this._resolveAlternativeLaunchUrl(applicationId, props);
    }

    deviceManager.logOpeningUrl(url);
    await deviceManager.activateWindowAsync();
    await deviceManager.openUrlAsync(url);

    return {
      url,
    };
  }

  /** Launch the project on a device given the input runtime. */
  async openAsync(
    options:
      | {
          runtime: 'expo' | 'web';
        }
      | {
          runtime: 'custom';
          props?: Partial<IOpenInCustomProps>;
        },
    resolveSettings: Partial<IResolveDeviceProps> = {}
  ): Promise<{ url: string }> {
    debug(
      `open (runtime: ${options.runtime}, platform: ${this.props.platform}, device: %O, shouldPrompt: ${resolveSettings.shouldPrompt})`,
      resolveSettings.device
    );
    if (options.runtime === 'expo') {
      return this.openProjectInExpoGoAsync(resolveSettings);
    } else if (options.runtime === 'web') {
      return this.openWebProjectAsync(resolveSettings);
    } else if (options.runtime === 'custom') {
      return this.openProjectInCustomRuntimeAsync(resolveSettings, options.props);
    } else {
      throw new CommandError(`Invalid runtime target: ${options.runtime}`);
    }
  }

  /** Open the current web project (Webpack) in a device . */
  private async openWebProjectAsync(resolveSettings: Partial<IResolveDeviceProps> = {}): Promise<{
    url: string;
  }> {
    const url = this.props.getDevServerUrl();
    assert(url, 'Dev server is not running.');

    const deviceManager = await this.props.resolveDeviceAsync(resolveSettings);
    deviceManager.logOpeningUrl(url);
    await deviceManager.activateWindowAsync();
    await deviceManager.openUrlAsync(url);

    return { url };
  }

  /** If the launch URL cannot be determined (`custom` runtimes) then an alternative string can be provided to open the device. Often a device ID or activity to launch. Exposed for testing. */
  _resolveAlternativeLaunchUrl(
    applicationId: string,
    props: Partial<IOpenInCustomProps> = {}
  ): string {
    throw new UnimplementedError();
  }
}
