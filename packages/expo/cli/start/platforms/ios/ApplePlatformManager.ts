import { CreateURLOptions } from '../../server/UrlCreator';
import { BaseOpenInCustomProps, PlatformManager } from '../PlatformManager';
import { AppleDeviceManager } from './AppleDeviceManager';
import { resolveAppIdAsync } from './resolveAppId';
import { Device } from './simctl';

export class ApplePlatformManager extends PlatformManager<Device> {
  constructor(
    protected projectRoot: string,
    protected port: number,
    getDevServerUrl: () => string | null,
    getLoadingUrl: (opts: CreateURLOptions, platform: string) => string | null,
    getManifestUrl: (props: { scheme?: string }) => string | null
  ) {
    super(projectRoot, {
      platform: 'ios',
      getDevServerUrl,
      getLoadingUrl: () => getLoadingUrl({ hostType: 'localhost' }, 'ios'),
      getNativeDevServerUrl: getManifestUrl,
      resolveDeviceAsync: AppleDeviceManager.resolveAsync,
    });
  }

  public async openAsync(
    options:
      | { runtime: 'expo' | 'web' }
      | { runtime: 'custom'; props?: Partial<BaseOpenInCustomProps> },
    resolveSettings?: Partial<{ shouldPrompt?: boolean; device?: Device; osType?: string }>
  ): Promise<{ url: string }> {
    await AppleDeviceManager.assertSystemRequirementsAsync();
    return super.openAsync(options, resolveSettings);
  }

  protected async resolveExistingAppIdAsync(): Promise<string> {
    return resolveAppIdAsync(this.projectRoot);
  }

  protected resolveAlternativeLaunchUrl(
    applicationId: string,
    props?: Partial<BaseOpenInCustomProps>
  ): string {
    return applicationId;
  }
}
