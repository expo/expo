import type { ModPlatform } from 'expo/config-plugins';
import fs from 'node:fs/promises';

export async function getPatchFilesAsync(
  patchRoot: string,
  platform: ModPlatform
): Promise<string[]> {
  return (await Array.fromAsync(fs.glob(`${platform}*.patch`, { cwd: patchRoot })))
    .sort()
    .reverse();
}
