import { getConfig } from '@expo/config';
import assert from 'assert';

import * as Log from '../../log';
import { logEvent } from '../../utils/analytics/rudderstackClient';
import { CommandError, UnimplementedError } from '../../utils/errors';
import { learnMore } from '../../utils/link';
import { AppIdResolver } from './AppIdResolver';
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
      /** Expo Go URL */
      getExpoGoUrl: () => string | null;
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

  protected async openProjectInExpoGoAsync(
    resolveSettings: Partial<IResolveDeviceProps> = {}
  ): Promise<{ url: string }> {
    const url = this.props.getExpoGoUrl();
    // This should never happen, but just in case...
    assert(url, 'Could not get dev server URL');

    const deviceManager = await this.props.resolveDeviceAsync(resolveSettings);
    deviceManager.logOpeningUrl(url);

    // TODO: Expensive, we should only do this once.
    const { exp } = getConfig(this.projectRoot);
    const installedExpo = await deviceManager.ensureExpoGoAsync(exp.sdkVersion);

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
    Log.debug(
      `open custom (${Object.entries(props)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ')})`
    );
    let url = this.props.getCustomRuntimeUrl({ scheme: props.scheme });
    // TODO: It's unclear why we do application id validation when opening with a URL
    const applicationId = props.applicationId ?? (await this._getAppIdResolver().getAppIdAsync());

    const deviceManager = await this.props.resolveDeviceAsync(resolveSettings);

    if (!(await deviceManager.isAppInstalledAsync(applicationId))) {
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
    Log.debug(
      `open (runtime: ${options.runtime}, platform: ${this.props.platform}, device: ${resolveSettings.device}, shouldPrompt: ${resolveSettings.shouldPrompt})`
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
