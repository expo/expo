import { BaseOpenInCustomProps, BaseResolveDeviceProps, PlatformManager } from '../PlatformManager';
import { Device } from './AndroidDeviceBridge';
import * as AndroidDeviceBridge from './AndroidDeviceBridge';
import { AndroidDeviceManager } from './AndroidDeviceManager';
import { resolveAppIdAsync } from './resolveAppId';

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
      AndroidDeviceManager.resolveAsync
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

  protected async resolveExistingApplicationIdAsync(): Promise<string> {
    return resolveAppIdAsync(this.projectRoot);
  }

  protected resolveAlternativeLaunchUrl(
    applicationId: string,
    props?: Partial<AndroidOpenInCustomProps>
  ): string {
    return props?.launchActivity ?? `${applicationId}/.MainActivity`;
  }
}
