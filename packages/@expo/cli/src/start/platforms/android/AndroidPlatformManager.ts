import { AndroidAppIdResolver } from './AndroidAppIdResolver';
import { AndroidDeviceManager } from './AndroidDeviceManager';
import { Device } from './adb';
import { startAdbReverseAsync } from './adbReverse';
import { AppIdResolver } from '../AppIdResolver';
import { BaseOpenInCustomProps, BaseResolveDeviceProps, PlatformManager } from '../PlatformManager';

interface AndroidOpenInCustomProps extends BaseOpenInCustomProps {
  launchActivity?: string;
}

export class AndroidPlatformManager extends PlatformManager<Device, AndroidOpenInCustomProps> {
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
