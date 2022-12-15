import { existsSync } from 'fs';
import { join } from 'path';

import { ConfigError } from './Errors';

export function getRootPackageJsonPath(projectRoot: string): string {
  const packageJsonPath = join(projectRoot, 'package.json');
  if (!existsSync(packageJsonPath)) {
    throw new ConfigError(
      `The expected package.json path: ${packageJsonPath} does not exist`,
      'MODULE_NOT_FOUND'
    );
  }
  return packageJsonPath;
}
