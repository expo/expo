import path from 'path';

import { Package } from '../Packages';
import { spawnAsync } from '../Utils';
import logger from '../Logger';
import { EXPO_DIR } from '../Constants';

/**
 * Checks whether the state of build files is the same after running build script.
 * @param pkg Package to check
 */
export default async function checkBuildUniformityAsync(pkg: Package): Promise<void> {
  const child = await spawnAsync('git', ['status', '--porcelain', './build'], {
    stdio: 'pipe',
    cwd: pkg.path,
  });
  const lines = child.stdout ? child.stdout.trim().split(/\r\n?|\n/g) : [];

  if (lines.length > 0) {
    logger.error(`The following build files need to be rebuilt and committed:`);
    lines.map((line) => {
      const filePath = path.join(EXPO_DIR, line.replace(/^\s*\S+\s*/g, ''));
      logger.warn(path.relative(pkg.path, filePath));
    });

    throw new Error(
      `The build folder for ${pkg.packageName} has uncommitted changes after building.`
    );
  }
}
