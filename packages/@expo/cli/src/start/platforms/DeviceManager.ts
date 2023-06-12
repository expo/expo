import chalk from 'chalk';

import * as Log from '../../log';

/** An abstract class for interacting with a native device. */
export abstract class DeviceManager<IDevice> {
  constructor(public device: IDevice) {}

  abstract get name(): string;

  abstract get identifier(): string;

  logOpeningUrl(url: string) {
    Log.log(chalk`\u203A Opening {underline ${url}} on {bold ${this.name}}`);
  }

  abstract startAsync(): Promise<IDevice>;

  abstract getAppVersionAsync(applicationId: string): Promise<string | null>;

  abstract installAppAsync(binaryPath: string): Promise<void>;

  abstract uninstallAppAsync(applicationId: string): Promise<void>;

  abstract isAppInstalledAsync(applicationId: string): Promise<boolean>;

  abstract startAppAsync(applicationId: string): Promise<void>;

  abstract openUrlAsync(url: string): Promise<void>;

  abstract activateWindowAsync(): Promise<void>;

  abstract ensureExpoGoAsync(sdkVersion?: string): Promise<boolean>;
}
