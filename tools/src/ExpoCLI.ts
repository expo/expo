import { extractLocalNpmTarballAsync } from '@expo/cli/build/src/utils/npm';
import { IOSConfig } from '@expo/config-plugins';
import spawnAsync from '@expo/spawn-async';
import process from 'process';

import { EXPO_DIR } from './Constants';

type Options = {
  cwd?: string;
  stdio?: 'inherit' | 'pipe' | 'ignore';
};

export async function runExpoCliAsync(
  command: string,
  args: string[] = [],
  options: Options = {}
): Promise<void> {
  // Don't handle SIGINT/SIGTERM in this process...defer to expo-cli
  process.on('SIGINT', () => {});
  process.on('SIGTERM', () => {});

  await spawnAsync('npx', ['expo', command, ...args], {
    cwd: options.cwd || EXPO_DIR,
    stdio: options.stdio || 'inherit',
    env: {
      ...process.env,
      EXPO_NO_DOCTOR: 'true',
    },
  });
}

export async function extractTarballAsync(tarFilePath: string, props: ExtractProps): Promise<void> {
  return await extractLocalNpmTarballAsync(tarFilePath, props);
}

type ExtractProps = {
  name: string;
  cwd: string;
  strip?: number;
  fileList?: string[];
};

export function sanitizedName(name: string): string {
  return IOSConfig.XcodeUtils.sanitizedName(name);
}
