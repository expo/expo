import chalk from 'chalk';

import * as Log from '../../log';
import { UnimplementedError } from '../../utils/errors';

/** An abstract class for interacting with a native device. */
export class DeviceManager<IDevice> {
  constructor(public device: IDevice) {}

  get name(): string {
    throw new UnimplementedError();
  }

  get identifier(): string {
    throw new UnimplementedError();
  }

  public logOpeningUrl(url: string) {
    Log.log(chalk`\u203A Opening {underline ${url}} on {bold ${this.name}}`);
  }

  startAsync(): Promise<IDevice> {
    throw new UnimplementedError();
  }

  getAppVersionAsync(applicationId: string): Promise<string | null> {
    throw new UnimplementedError();
  }

  installAppAsync(binaryPath: string): Promise<void> {
    throw new UnimplementedError();
  }

  uninstallAppAsync(applicationId: string): Promise<void> {
    throw new UnimplementedError();
  }

  isAppInstalledAsync(applicationId: string): Promise<boolean> {
    throw new UnimplementedError();
  }

  openUrlAsync(url: string): Promise<void> {
    throw new UnimplementedError();
  }

  activateWindowAsync(): Promise<void> {
    throw new UnimplementedError();
  }

  ensureExpoGoAsync(sdkVersion?: string): Promise<boolean> {
    throw new UnimplementedError();
  }
}
