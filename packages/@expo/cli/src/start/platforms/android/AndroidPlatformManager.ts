import { AndroidAppIdResolver } from './AndroidAppIdResolver';
import { AndroidDeviceManager } from './AndroidDeviceManager';
import { Device } from './adb';
import { startAdbReverseAsync } from './adbReverse';
import { AppIdResolver } from '../AppIdResolver';
import { BaseOpenInCustomProps, BaseResolveDeviceProps, PlatformManager } from '../PlatformManager';

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

      // Android's adb list packages returns the app id, not the package name.
      // By default, this app id is identical to the package name.
      // When using product flavors, the installed app should be refered by the custom app id.
      if (options.props?.customAppId) {
        return super.openAsync(
          {
            runtime: 'custom',
            props: { ...options.props, applicationId: options.props.customAppId },
          },
          resolveSettings
        );
      }
    }

    return super.openAsync(options, resolveSettings);
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
