import { AppleAppIdResolver } from './AppleAppIdResolver';
import { AppleDeviceManager } from './AppleDeviceManager';
import { Device } from './simctl';
import { AppIdResolver } from '../AppIdResolver';
import { BaseOpenInCustomProps, PlatformManager } from '../PlatformManager';

/** Manages launching apps on Apple simulators. */
export class ApplePlatformManager extends PlatformManager<Device> {
  constructor(
    protected projectRoot: string,
    protected port: number,
    options: {
      /** Get the base URL for the dev server hosting this platform manager. */
      getDevServerUrl: () => string | null;
      /** Expo Go URL. */
      getExpoGoUrl: () => string;
      /** Get redirect URL for native disambiguation. */
      getRedirectUrl: () => string | null;
      /** Dev Client */
      getCustomRuntimeUrl: (props?: { scheme?: string }) => string | null;
    }
  ) {
    super(projectRoot, {
      platform: 'ios',
      ...options,
      resolveDeviceAsync: AppleDeviceManager.resolveAsync,
    });
  }

  async openAsync(
    options:
      | { runtime: 'expo' | 'web' }
      | { runtime: 'custom'; props?: Partial<BaseOpenInCustomProps> },
    resolveSettings?: Partial<{ shouldPrompt?: boolean; device?: Device }>
  ): Promise<{ url: string }> {
    await AppleDeviceManager.assertSystemRequirementsAsync();
    return super.openAsync(options, resolveSettings);
  }

  _getAppIdResolver(): AppIdResolver {
    return new AppleAppIdResolver(this.projectRoot);
  }

  _resolveAlternativeLaunchUrl(
    applicationId: string,
    props?: Partial<BaseOpenInCustomProps>
  ): string {
    return applicationId;
  }
}
