import * as ciInfo from 'ci-info';
import os from 'os';

import { groupBy } from '../../array';

export function createContext() {
  return {
    os: { name: os.platform(), version: os.release(), node: process.versions.node },
    device: { arch: os.arch(), memory: summarizeMemory() },
    cpu: summarizeCpuInfo(),
    app: { name: 'expo/cli', version: process.env.__EXPO_VERSION },
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
