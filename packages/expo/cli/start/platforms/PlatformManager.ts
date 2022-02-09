import assert from 'assert';

import { logEvent } from '../../utils/analytics/rudderstackClient';
import { CommandError } from '../../utils/errors';
import { learnMore } from '../../utils/link';
import * as UrlUtils from '../serverUrl';
import { isDevClientPackageInstalled } from '../startAsync';
import { VirtualDeviceManager } from './VirtualDeviceManager';
import * as WebpackDevServer from '../webpack/WebpackDevServer';

export interface BaseOpenInCustomProps {
  scheme?: string;
  applicationId?: string | null;
}

export class PlatformManager<
  IDevice,
  IOpenInCustomProps extends BaseOpenInCustomProps = BaseOpenInCustomProps,
  IResolveDeviceProps extends {
    /** Should prompt the user to select a device. */
    shouldPrompt?: boolean;
    /** The target device to use. */
    device?: IDevice;

    osType?: string;
  } = {
    /** Should prompt the user to select a device. */
    shouldPrompt?: boolean;
    /** The target device to use. */
    device?: IDevice;

    osType?: string;
  }
> {
  constructor(
    protected projectRoot: string,
    protected platform: 'ios' | 'android',
    private resolveDeviceAsync: (
      resolver?: Partial<IResolveDeviceProps>
    ) => Promise<VirtualDeviceManager<IDevice>>
  ) {}

  private constructDeepLink(scheme?: string, devClient?: boolean): string | null {
    if (
      process.env['EXPO_ENABLE_INTERSTITIAL_PAGE'] &&
      !devClient &&
      isDevClientPackageInstalled(this.projectRoot)
    ) {
      return this.constructLoadingUrl();
    } else {
      try {
        return UrlUtils.constructDeepLink({
          scheme,
        });
      } catch (e) {
        if (devClient) {
          return null;
        }
        throw e;
      }
    }
  }

  async openProjectInExpoGoAsync(
    resolveSettings: Partial<IResolveDeviceProps> = {}
  ): Promise<{ url: string }> {
    // TODO: We shouldn't have so much extra stuff to support dc here.
    const url = this.constructDeepLink();
    // This should never happen, but just in case...
    assert(url, 'Could not get dev server URL');

    const deviceManager = await this.resolveDeviceAsync(resolveSettings);
    deviceManager.logOpeningUrl(url);
    const installedExpo = await this.ensureDeviceHasValidExpoGoAsync(deviceManager);

    await deviceManager.activateWindowAsync();
    await deviceManager.openUrlAsync(url);

    logEvent('Open Url on Device', {
      platform: this.platform,
      installedExpo,
    });

    return { url };
  }

  private async openProjectInDevClientAsync(
    resolveSettings: Partial<IResolveDeviceProps> = {},
    props: Partial<IOpenInCustomProps> = {}
  ): Promise<{ url: string }> {
    let url = this.constructDeepLink(props.scheme, true);
    // TODO: It's unclear why we do application id validation when opening with a URL
    const applicationId = props.applicationId ?? (await this.resolveExistingApplicationIdAsync());

    const deviceManager = await this.resolveDeviceAsync(resolveSettings);

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
      platform: this.platform,
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
      return this.openProjectInDevClientAsync(resolveSettings, options.props);
    } else {
      throw new CommandError(`Invalid runtime target: ${options.runtime}`);
    }
  }

  /** Open the current web project (Webpack) in a device . */
  async openWebProjectAsync(resolveSettings: Partial<IResolveDeviceProps> = {}): Promise<{
    url: string;
  }> {
    // Ensure Webpack Dev Server is running.
    const url = WebpackDevServer.getDevServerUrl();
    assert(url, 'Webpack Dev Server is not running.');

    const deviceManager = await this.resolveDeviceAsync(resolveSettings);
    deviceManager.logOpeningUrl(url);
    await deviceManager.activateWindowAsync();
    await deviceManager.openUrlAsync(url);

    return { url };
  }

  resolveAlternativeLaunchUrl(
    applicationId: string,
    props: Partial<IOpenInCustomProps> = {}
  ): string {
    throw new Error('unimplemented');
  }

  constructLoadingUrl(): string {
    throw new Error('unimplemented');
  }

  async ensureDeviceHasValidExpoGoAsync(
    deviceManager: VirtualDeviceManager<IDevice>
  ): Promise<boolean> {
    throw new Error('unimplemented');
  }

  async resolveExistingApplicationIdAsync(): Promise<string> {
    throw new Error('unimplemented');
  }
}
