import chalk from 'chalk';

import logger from '../Logger';
import { Package } from '../Packages';
import { ActionOptions } from './types';
import runPackageScriptAsync from './runPackageScriptAsync';
import checkBuildUniformityAsync from './checkBuildUniformityAsync';

const { green } = chalk;

/**
 * Runs package checks on given package.
 */
export default async function checkPackageAsync(
  pkg: Package,
  options: ActionOptions
): Promise<boolean> {
  try {
    logger.info(`🔍 Checking ${green.bold(pkg.packageName)} package`);

    if (options.build) {
      await runPackageScriptAsync(pkg, 'clean');
      await runPackageScriptAsync(pkg, 'build');

      if (options.uniformityCheck) {
        await checkBuildUniformityAsync(pkg);
      }
    }
    if (options.test) {
      const args = ['--watch', 'false', '--passWithNoTests'];

      if (process.env.CI) {
        // Limit to one worker on CIs
        args.push('--maxWorkers', '1');
      }
      await runPackageScriptAsync(pkg, 'test', args);
    }
    if (options.lint) {
      const args = ['--max-warnings', '0'];
      if (options.fixLint) {
        args.push('--fix');
      }
      await runPackageScriptAsync(pkg, 'lint', args);
    }
    logger.log(`✨ ${green.bold(pkg.packageName)} checks passed`);
    return true;
  } catch (e) {
    return false;
  }
}
