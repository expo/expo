import * as UrlUtils from '../../serverUrl';
import { BaseOpenInCustomProps, PlatformManager } from '../PlatformManager';
import { VirtualDeviceManager } from '../VirtualDeviceManager';
import { Device } from './AndroidDeviceBridge';
import { ensureDeviceHasValidExpoGoAsync } from './ensureDeviceHasValidExpoGoAsync';
import { resolveExistingApplicationIdAsync } from './resolveExistingApplicationId';
import { VirtualAndroidDeviceManager } from './VirtualAndroidDeviceManager';

interface AndroidOpenInCustomProps extends BaseOpenInCustomProps {
  launchActivity?: string;
}

export class AndroidPlatformManager extends PlatformManager<Device, AndroidOpenInCustomProps> {
  constructor(projectRoot: string) {
    super(projectRoot, 'android', VirtualAndroidDeviceManager.resolveAsync);
  }

  constructLoadingUrl(): string {
    return UrlUtils.constructLoadingUrl(this.platform);
  }

  async ensureDeviceHasValidExpoGoAsync(
    deviceManager: VirtualDeviceManager<Device>
  ): Promise<boolean> {
    return ensureDeviceHasValidExpoGoAsync(this.projectRoot, deviceManager);
  }

  async resolveExistingApplicationIdAsync(): Promise<string> {
    return resolveExistingApplicationIdAsync(this.projectRoot);
  }

  resolveAlternativeLaunchUrl(
    applicationId: string,
    props?: Partial<AndroidOpenInCustomProps>
  ): string {
    return props?.launchActivity ?? `${applicationId}/.MainActivity`;
  }
}
