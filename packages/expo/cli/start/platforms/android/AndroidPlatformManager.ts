import { CreateURLOptions } from '../../server/UrlCreator';
import { AppIdResolver } from '../AppIdResolver';
import { BaseOpenInCustomProps, BaseResolveDeviceProps, PlatformManager } from '../PlatformManager';
import { Device } from './adb';
import * as AndroidDeviceBridge from './adb';
import { AndroidAppIdResolver } from './AndroidAppIdResolver';
import { AndroidDeviceManager } from './AndroidDeviceManager';

interface AndroidOpenInCustomProps extends BaseOpenInCustomProps {
  launchActivity?: string;
}

export class AndroidPlatformManager extends PlatformManager<Device, AndroidOpenInCustomProps> {
  constructor(
    protected projectRoot: string,
    protected port: number,
    getDevServerUrl: () => string | null,
    getLoadingUrl: (opts: CreateURLOptions, platform: string) => string | null,
    getManifestUrl: (props: { scheme?: string }) => string | null
  ) {
    super(projectRoot, {
      platform: 'android',
      getDevServerUrl,
      getLoadingUrl: () => getLoadingUrl({}, 'android'),
      getNativeDevServerUrl: getManifestUrl,
      resolveDeviceAsync: AndroidDeviceManager.resolveAsync,
    });
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

  protected getAppIdResolver(): AppIdResolver {
    return new AndroidAppIdResolver(this.projectRoot);
  }

  protected resolveAlternativeLaunchUrl(
    applicationId: string,
    props?: Partial<AndroidOpenInCustomProps>
  ): string {
    return props?.launchActivity ?? `${applicationId}/.MainActivity`;
  }
}
