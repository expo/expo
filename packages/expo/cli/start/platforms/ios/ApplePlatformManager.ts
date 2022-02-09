import { BaseOpenInCustomProps, PlatformManager } from '../PlatformManager';
import { VirtualDeviceManager } from '../VirtualDeviceManager';
import { ensureDeviceHasValidExpoGoAsync } from './ensureDeviceHasValidExpoGoAsync';
import { resolveExistingApplicationIdAsync } from './resolveExistingApplicationId';
import { SimulatorDevice } from './SimControl';
import { VirtualAppleDeviceManager } from './VirtualAppleDeviceManager';

export class ApplePlatformManager extends PlatformManager<SimulatorDevice> {
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
      VirtualAppleDeviceManager.resolveAsync
    );
  }

  public async openAsync(
    options:
      | { runtime: 'expo' | 'web' }
      | { runtime: 'custom'; props?: Partial<BaseOpenInCustomProps> },
    resolveSettings?: Partial<{ shouldPrompt?: boolean; device?: SimulatorDevice; osType?: string }>
  ): Promise<{ url: string }> {
    await VirtualAppleDeviceManager.assertSystemRequirementsAsync();
    return super.openAsync(options, resolveSettings);
  }

  protected async ensureDeviceHasValidExpoGoAsync(
    deviceManager: VirtualDeviceManager<SimulatorDevice>
  ): Promise<boolean> {
    return ensureDeviceHasValidExpoGoAsync(this.projectRoot, deviceManager);
  }

  protected async resolveExistingApplicationIdAsync(): Promise<string> {
    return resolveExistingApplicationIdAsync(this.projectRoot);
  }

  protected resolveAlternativeLaunchUrl(
    applicationId: string,
    props?: Partial<BaseOpenInCustomProps>
  ): string {
    return applicationId;
  }
}
