import { AndroidAppIdResolver } from './AndroidAppIdResolver';
import { AndroidDeviceManager } from './AndroidDeviceManager';
import { Device } from './adb';
import { startAdbReverseAsync } from './adbReverse';
import { CommandError } from '../../../utils/errors';
import { memoize } from '../../../utils/fn';
import { learnMore } from '../../../utils/link';
import { hasDirectDevClientDependency } from '../../detectDevClient';
import { AppIdResolver } from '../AppIdResolver';
import { BaseOpenInCustomProps, BaseResolveDeviceProps, PlatformManager } from '../PlatformManager';

const debug = require('debug')(
  'expo:start:platforms:platformManager:android'
) as typeof console.log;

export interface AndroidOpenInCustomProps extends BaseOpenInCustomProps {
  /**
   * The Android app intent to launch through `adb shell am start -n <launchActivity>`.
   */
  launchActivity?: string;
  /**
   * The custom app id to launch, provided through `--app-id`.
   * By default, the app id is identical to the package name.
   * When using product flavors, the app id might be customized.
   */
  customAppId?: string;
}

export class AndroidPlatformManager extends PlatformManager<Device, AndroidOpenInCustomProps> {
  /** The last used custom launch props, should be reused whenever launching custom runtime without launch props */
  private lastCustomRuntimeLaunchProps?: AndroidOpenInCustomProps;
  /** Memoized method to detect if dev client is installed */
  private hasDevClientInstalled: () => boolean;

  constructor(
    protected projectRoot: string,
    protected port: number,
    options: {
      /** Get the base URL for the dev server hosting this platform manager. */
      getDevServerUrl: () => string | null;
      /** Expo Go URL */
      getExpoGoUrl: () => string;
      /** Get redirect URL for native disambiguation. */
      getRedirectUrl: () => string | null;
      /** Dev Client URL. */
      getCustomRuntimeUrl: (props?: { scheme?: string }) => string | null;
    }
  ) {
    super(projectRoot, {
      platform: 'android',
      ...options,
      resolveDeviceAsync: AndroidDeviceManager.resolveAsync,
    });

    this.hasDevClientInstalled = memoize(hasDirectDevClientDependency.bind(this, projectRoot));
  }

  async openAsync(
    options:
      | { runtime: 'expo' | 'web' }
      | { runtime: 'custom'; props?: Partial<AndroidOpenInCustomProps> },
    resolveSettings?: Partial<BaseResolveDeviceProps<Device>>
  ): Promise<{ url: string }> {
    await startAdbReverseAsync([this.port]);

    if (options.runtime === 'custom') {
      // Store the resolved launch properties for future "openAsync" request.
      // This reuses the same launch properties when opening through the CLI interface (pressing `a`).
      if (options.props) {
        this.lastCustomRuntimeLaunchProps = options.props;
      } else if (!options.props && this.lastCustomRuntimeLaunchProps) {
        options.props = this.lastCustomRuntimeLaunchProps;
      }

      // Handle projects that need to launch with a custom app id and launch activity
      return this.openProjectInCustomRuntimeWithCustomAppIdAsync(options, resolveSettings);
    }

    return super.openAsync(options, resolveSettings);
  }

  /**
   * Launch the custom runtime project, using the provided custom app id and launch activity.
   * Instead of "open url", this will launch the activity directly.
   * If dev client is installed, it will also pass the dev client URL to the activity.
   */
  async openProjectInCustomRuntimeWithCustomAppIdAsync(
    options: { runtime: 'custom'; props?: Partial<AndroidOpenInCustomProps> },
    resolveSettings?: Partial<BaseResolveDeviceProps<Device>>
  ) {
    // Fall back to default dev client URL open behavior if no custom app id or launch activity is provided
    if (!options.props?.customAppId || !options.props?.launchActivity) {
      return super.openProjectInCustomRuntimeAsync(resolveSettings, options.props);
    }

    const { customAppId, launchActivity } = options.props;
    const url = this.hasDevClientInstalled()
      ? (this.props.getCustomRuntimeUrl({ scheme: options.props.scheme }) ?? undefined)
      : undefined;

    debug(`Opening custom runtime using launch activity: ${launchActivity} --`, options.props);

    const deviceManager = (await this.props.resolveDeviceAsync(
      resolveSettings
    )) as AndroidDeviceManager;

    if (!(await deviceManager.isAppInstalledAndIfSoReturnContainerPathForIOSAsync(customAppId))) {
      throw new CommandError(
        `No development build (${customAppId}) for this project is installed. ` +
          `Please make and install a development build on the device first.\n${learnMore(
            'https://docs.expo.dev/development/build/'
          )}`
      );
    }

    deviceManager.logOpeningUrl(url ?? launchActivity);
    await deviceManager.activateWindowAsync();
    await deviceManager.launchActivityAsync(launchActivity, url);

    return { url: url ?? launchActivity };
  }

  _getAppIdResolver(): AppIdResolver {
    return new AndroidAppIdResolver(this.projectRoot);
  }

  _resolveAlternativeLaunchUrl(
    applicationId: string,
    props?: Partial<AndroidOpenInCustomProps>
  ): string {
    return props?.launchActivity ?? `${applicationId}/.MainActivity`;
  }
}
