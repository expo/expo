import { getConfig } from '@expo/config';
import assert from 'assert';
import resolveFrom from 'resolve-from';

import { logEvent } from '../../utils/analytics/rudderstackClient';
import { CommandError, UnimplementedError } from '../../utils/errors';
import { learnMore } from '../../utils/link';
import { CreateURLOptions } from '../server/UrlCreator';
import { DeviceManager } from './DeviceManager';

export interface BaseOpenInCustomProps {
  scheme?: string;
  applicationId?: string | null;
}

export interface BaseResolveDeviceProps<IDevice> {
  /** Should prompt the user to select a device. */
  shouldPrompt?: boolean;
  /** The target device to use. */
  device?: IDevice;
  /** Indicates the type of device to use, useful for launching TVs, watches, etc. */
  osType?: string;
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
      getLoadingUrl: (opts?: CreateURLOptions, platform?: string) => string | null;

      // TODO: Combine the dev server url methods
      getNativeDevServerUrl: (props?: { scheme?: string }) => string | null;
      /** Resolve a device, this function should automatically handle opening the device and asserting any system validations. */
      resolveDeviceAsync: (
        resolver?: Partial<IResolveDeviceProps>
      ) => Promise<DeviceManager<IDevice>>;
    }
  ) {}

  /** Should use the interstitial page for selecting which runtime to use. Exposed for testing. */
  private shouldUseInterstitialPage(): boolean {
    return (
      process.env.EXPO_ENABLE_INTERSTITIAL_PAGE &&
      // TODO: >:0
      // Checks if dev client is installed.
      !!resolveFrom.silent(this.projectRoot, 'expo-dev-launcher')
    );
  }

  private constructDeepLink(scheme?: string, devClient?: boolean): string | null {
    if (
      !devClient &&
      // TODO: >:0
      // Checks if dev client is installed.
      this.shouldUseInterstitialPage()
    ) {
      return this.props.getLoadingUrl();
    } else {
      try {
        return this.props.getNativeDevServerUrl({ scheme });
      } catch (e) {
        if (devClient) {
          return null;
        }
        throw e;
      }
    }
  }

  protected async openProjectInExpoGoAsync(
    resolveSettings: Partial<IResolveDeviceProps> = {}
  ): Promise<{ url: string }> {
    // TODO: We shouldn't have so much extra stuff to support dc here.
    const url = this.constructDeepLink('exp');
    // This should never happen, but just in case...
    assert(url, 'Could not get dev server URL');

    const deviceManager = await this.props.resolveDeviceAsync(resolveSettings);
    deviceManager.logOpeningUrl(url);
    const installedExpo = await this.ensureDeviceHasValidExpoGoAsync(deviceManager);

    await deviceManager.activateWindowAsync();
    await deviceManager.openUrlAsync(url);

    logEvent('Open Url on Device', {
      platform: this.props.platform,
      installedExpo,
    });

    return { url };
  }

  private async openProjectInCustomRuntimeAsync(
    resolveSettings: Partial<IResolveDeviceProps> = {},
    props: Partial<IOpenInCustomProps> = {}
  ): Promise<{ url: string }> {
    let url = this.constructDeepLink(props.scheme, true);
    // TODO: It's unclear why we do application id validation when opening with a URL
    const applicationId = props.applicationId ?? (await this.resolveExistingAppIdAsync());

    const deviceManager = await this.props.resolveDeviceAsync(resolveSettings);

    if (!(await deviceManager.isAppInstalledAsync(applicationId))) {
      // TODO: Ensure links are up to date -- collapse redirects.
      throw new CommandError(
        `The development client (${applicationId}) for this project is not installed. ` +
          `Please build and install the client on the device first.\n${learnMore(
            'https://docs.expo.dev/development/build/'
          )}`
      );
    }

    // TODO: Rethink analytics
    logEvent('Open Url on Device', {
      platform: this.props.platform,
      installedExpo: false,
    });

    if (!url) {
      url = this.resolveAlternativeLaunchUrl(applicationId, props);
    }

    deviceManager.logOpeningUrl(url);
    await deviceManager.activateWindowAsync();
    await deviceManager.openUrlAsync(url);

    return {
      url,
    };
  }

  /** Launch the project on a device given the input runtime. */
  public async openAsync(
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
  protected async openWebProjectAsync(resolveSettings: Partial<IResolveDeviceProps> = {}): Promise<{
    url: string;
  }> {
    const url = this.props.getNativeDevServerUrl();
    // const url =  this.props.getDevServerUrl();
    assert(url, 'Dev server is not running.');

    const deviceManager = await this.props.resolveDeviceAsync(resolveSettings);
    deviceManager.logOpeningUrl(url);
    await deviceManager.activateWindowAsync();
    await deviceManager.openUrlAsync(url);

    return { url };
  }

  /** If the launch URL cannot be determined (`custom` runtimes) then an alternative string can be provided to open the device. Often a device ID or activity to launch. */
  protected resolveAlternativeLaunchUrl(
    applicationId: string,
    props: Partial<IOpenInCustomProps> = {}
  ): string {
    throw new UnimplementedError();
  }

  /** Returns true if the project has a valid version of Expo Go installed. */
  protected async ensureDeviceHasValidExpoGoAsync(
    deviceManager: DeviceManager<IDevice>
  ): Promise<boolean> {
    const { exp } = getConfig(this.projectRoot);
    return deviceManager.ensureExpoGoAsync(exp.sdkVersion);
  }

  /** Returns the project application identifier or asserts that one is not defined. */
  protected async resolveExistingAppIdAsync(): Promise<string> {
    throw new UnimplementedError();
  }
}
