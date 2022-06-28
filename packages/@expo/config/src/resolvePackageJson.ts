import { statSync } from 'fs';
import { join } from 'path';

import { ConfigError } from './Errors';

function fileExists(file: string): boolean {
  try {
    return statSync(file).isFile();
  } catch {
    return false;
  }
}

export function getRootPackageJsonPath(projectRoot: string): string {
  const packageJsonPath = join(projectRoot, 'package.json');
  if (!fileExists(packageJsonPath)) {
    throw new ConfigError(
      `The expected package.json path: ${packageJsonPath} does not exist`,
      'MODULE_NOT_FOUND'
    );
  }
  return packageJsonPath;
}
