import * as ciInfo from 'ci-info';
import os from 'os';

import { groupBy } from '../array';

const PLATFORM_TO_TELEMETRY_PLATFORM: { [platform: string]: string } = {
  darwin: 'Mac',
  win32: 'Windows',
  linux: 'Linux',
};

export function getContext() {
  const platform = PLATFORM_TO_TELEMETRY_PLATFORM[os.platform()] || os.platform();
  return {
    os: { name: platform, version: os.release() },
    device: { arch: os.arch(), version: os.version(), memory: summarizeMemory() },
    cpu: summarizeCpuInfo(),
    app: { name: 'expo', version: process.env.__EXPO_VERSION },
    ci: ciInfo.isCI ? { name: ciInfo.name, isPr: ciInfo.isPR } : undefined,
  };
}

function summarizeMemory() {
  const gb = os.totalmem() / 1024 / 1024 / 1024;
  return Math.round(gb * 100) / 100;
}

function summarizeCpuInfo() {
  const cpus = groupBy(os.cpus() ?? [], (item) => item.model);
  const summary = { model: '', speed: 0, count: 0 };

  for (const key in cpus) {
    if (cpus[key].length > summary.count) {
      summary.model = key;
      summary.speed = cpus[key][0].speed;
      summary.count = cpus[key].length;
    }
  }

  return !summary.model || !summary.count ? undefined : summary;
}
