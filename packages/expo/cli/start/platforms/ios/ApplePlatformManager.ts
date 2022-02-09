import * as UrlUtils from '../../serverUrl';
import { BaseOpenInCustomProps, PlatformManager } from '../PlatformManager';
import { VirtualDeviceManager } from '../VirtualDeviceManager';
import { ensureDeviceHasValidExpoGoAsync } from './ensureDeviceHasValidExpoGoAsync';
import { resolveExistingApplicationIdAsync } from './resolveExistingApplicationId';
import { SimulatorDevice } from './SimControl';
import { VirtualAppleDeviceManager } from './VirtualAppleDeviceManager';

export class ApplePlatformManager extends PlatformManager<SimulatorDevice> {
  constructor(projectRoot: string) {
    super(projectRoot, 'ios', VirtualAppleDeviceManager.resolveAsync);
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

  constructLoadingUrl(): string {
    return UrlUtils.constructLoadingUrl(this.platform, 'localhost');
  }

  async ensureDeviceHasValidExpoGoAsync(
    deviceManager: VirtualDeviceManager<SimulatorDevice>
  ): Promise<boolean> {
    return ensureDeviceHasValidExpoGoAsync(this.projectRoot, deviceManager);
  }

  async resolveExistingApplicationIdAsync(): Promise<string> {
    return resolveExistingApplicationIdAsync(this.projectRoot);
  }

  resolveAlternativeLaunchUrl(
    applicationId: string,
    props?: Partial<BaseOpenInCustomProps>
  ): string {
    return applicationId;
  }
}
