import { BaseOpenInCustomProps, PlatformManager } from '../PlatformManager';
import { AppleDeviceManager } from './AppleDeviceManager';
import { resolveAppIdAsync } from './resolveAppId';
import { Device } from './simctl';

export class ApplePlatformManager extends PlatformManager<Device> {
  constructor(
    protected projectRoot: string,
    protected port: number,
    protected getDevServerUrl: () => string | null,
    protected constructLoadingUrl: (platform?: string, type?: string) => string | null,
    protected constructManifestUrl: (props: { scheme?: string }) => string | null
  ) {
    super(
      projectRoot,
      'ios',
      getDevServerUrl,
      () => constructLoadingUrl(this.platform, 'localhost'),
      constructManifestUrl,
      AppleDeviceManager.resolveAsync
    );
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
