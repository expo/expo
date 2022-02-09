import { BaseOpenInCustomProps, BaseResolveDeviceProps, PlatformManager } from '../PlatformManager';
import { VirtualDeviceManager } from '../VirtualDeviceManager';
import { Device } from './AndroidDeviceBridge';
import { ensureDeviceHasValidExpoGoAsync } from './ensureDeviceHasValidExpoGoAsync';
import { resolveExistingApplicationIdAsync } from './resolveExistingApplicationId';
import { VirtualAndroidDeviceManager } from './VirtualAndroidDeviceManager';
import * as AndroidDeviceBridge from './AndroidDeviceBridge';

interface AndroidOpenInCustomProps extends BaseOpenInCustomProps {
  launchActivity?: string;
}

export class AndroidPlatformManager extends PlatformManager<Device, AndroidOpenInCustomProps> {
  constructor(
    protected projectRoot: string,
    protected port: number,
    protected getDevServerUrl: () => string | null,
    protected constructLoadingUrl: (platform?: string, type?: string) => string | null,
    protected constructManifestUrl: (props: { scheme?: string }) => string | null
  ) {
    super(
      projectRoot,
      'android',
      getDevServerUrl,
      () => constructLoadingUrl(this.platform),
      constructManifestUrl,
      VirtualAndroidDeviceManager.resolveAsync
    );
  }

  public async openAsync(
    options:
      | { runtime: 'expo' | 'web' }
      | { runtime: 'custom'; props?: Partial<AndroidOpenInCustomProps> },
    resolveSettings?: Partial<BaseResolveDeviceProps<Device>>
  ): Promise<{ url: string }> {
    await AndroidDeviceBridge.startAdbReverseAsync([this.port]);
    return super.openAsync(options, resolveSettings);
  }

  protected async ensureDeviceHasValidExpoGoAsync(
    deviceManager: VirtualDeviceManager<Device>
  ): Promise<boolean> {
    return ensureDeviceHasValidExpoGoAsync(this.projectRoot, deviceManager);
  }

  protected async resolveExistingApplicationIdAsync(): Promise<string> {
    return resolveExistingApplicationIdAsync(this.projectRoot);
  }

  protected resolveAlternativeLaunchUrl(
    applicationId: string,
    props?: Partial<AndroidOpenInCustomProps>
  ): string {
    return props?.launchActivity ?? `${applicationId}/.MainActivity`;
  }
}
