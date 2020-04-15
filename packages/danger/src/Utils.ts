import * as fs from 'fs';
import { join } from 'path';
import * as path from 'path';

/**
 * @param packageName for example: `expo-image-picker` or `unimodules-constatns-interface`
 * @returns relative path to package's changelog. For example: `packages/expo-image-picker/CHANGELOG.md`
 */
export function getPackageChangelogRelativePath(packageName: string): string {
  return path.join('packages', packageName, 'CHANGELOG.md');
}

export function getExpoRepositoryRootDir(): string {
  // EXPO_ROOT_DIR is set locally by direnv
  return process.env.EXPO_ROOT_DIR || join(__dirname, '..');
}

export async function getFileContentAsync(path: string): Promise<string> {
  const buffer = await fs.promises.readFile(path);
  return buffer.toString();
}
