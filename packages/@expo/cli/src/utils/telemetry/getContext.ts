import * as ciInfo from 'ci-info';
import os from 'os';

const PLATFORM_TO_TELEMETRY_PLATFORM: { [platform: string]: string } = {
  darwin: 'Mac',
  win32: 'Windows',
  linux: 'Linux',
};

export function getContext() {
  const platform = PLATFORM_TO_TELEMETRY_PLATFORM[os.platform()] || os.platform();
  return {
    os: { name: platform, version: os.release() },
    device: { type: platform, model: platform },
    app: { name: 'expo', version: process.env.__EXPO_VERSION },
    ci: ciInfo.isCI ? { name: ciInfo.name, isPr: ciInfo.isPR } : undefined,
  };
}
