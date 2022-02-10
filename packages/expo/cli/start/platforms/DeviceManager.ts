import chalk from 'chalk';

import * as Log from '../../log';

/** An abstract class for interacting with a native device. */
export class DeviceManager<IDevice> {
  constructor(public device: IDevice) {}

  get name(): string {
    throw new Error('Unimplemented');
  }

  get identifier(): string {
    throw new Error('Unimplemented');
  }

  public logOpeningUrl(url: string) {
    Log.log(chalk`\u203A Opening {underline ${url}} on {bold ${this.name}}`);
  }

  startAsync(): Promise<IDevice> {
    throw new Error('Unimplemented');
  }

  getAppVersionAsync(applicationId: string): Promise<string | null> {
    throw new Error('Unimplemented');
  }

  installAppAsync(binaryPath: string): Promise<void> {
    throw new Error('Unimplemented');
  }

  uninstallAppAsync(applicationId: string): Promise<void> {
    throw new Error('Unimplemented');
  }

  isAppInstalledAsync(applicationId: string): Promise<boolean> {
    throw new Error('Unimplemented');
  }

  openUrlAsync(url: string): Promise<void> {
    throw new Error('Unimplemented');
  }

  activateWindowAsync(): Promise<void> {
    throw new Error('Unimplemented');
  }

  ensureExpoGoAsync(sdkVersion?: string): Promise<boolean> {
    throw new Error('Unimplemented');
  }
}
