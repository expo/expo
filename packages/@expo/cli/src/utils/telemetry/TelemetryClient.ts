import * as ciInfo from 'ci-info';
import os from 'os';

import type { TelemetryRecord, TelemetryEvent, TelemetryProperties } from './types';
import { type Actor } from '../../api/user/user';

const PLATFORM_TO_TELEMETRY_PLATFORM: { [platform: string]: string } = {
  darwin: 'Mac',
  win32: 'Windows',
  linux: 'Linux',
};

export abstract class TelemetryClient {
  abstract isIdentified: boolean;

  protected records: TelemetryRecord[] = [];

  abstract identify(actor?: Actor): Promise<void>;
  abstract flush(): Promise<void>;

  record(event: TelemetryEvent, properties?: TelemetryProperties) {
    this.records.push({ event, properties });
  }

  get context(): TelemetryProperties {
    const platform = PLATFORM_TO_TELEMETRY_PLATFORM[os.platform()] || os.platform();
    return {
      os: { name: platform, version: os.release() },
      device: { type: platform, model: platform },
      app: { name: 'expo', version: process.env.__EXPO_VERSION },
      ci: ciInfo.isCI ? { name: ciInfo.name, isPr: ciInfo.isPR } : undefined,
    };
  }
}
