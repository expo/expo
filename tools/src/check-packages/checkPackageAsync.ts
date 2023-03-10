import chalk from 'chalk';

import logger from '../Logger';
import { Package } from '../Packages';
import checkUniformityAsync from './checkUniformityAsync';
import runPackageScriptAsync from './runPackageScriptAsync';
import { ActionOptions } from './types';

const { green } = chalk;

/**
 * Runs package checks on given package.
 */
export default async function checkPackageAsync(
  pkg: Package,
  options: ActionOptions
): Promise<boolean> {
  try {
    if (options.isPlugin) {
      logger.info(`🔌 Checking ${green.bold(pkg.packageName)} plugin`);
    } else {
      logger.info(`🔍 Checking ${green.bold(pkg.packageName)} package`);
    }

    const args = options.isPlugin ? ['plugin'] : [];
    if (options.build) {
      await runPackageScriptAsync(pkg, 'clean', args);
      await runPackageScriptAsync(pkg, 'build', args);
      if (pkg.scripts.bundle) {
        await runPackageScriptAsync(pkg, 'bundle', args);
      }

      if (options.uniformityCheck) {
        await checkUniformityAsync(pkg, './build');
        if (pkg.scripts.bundle) {
          await checkUniformityAsync(pkg, '*bundle');
        }
      }
    }
    if (options.test) {
      const args = ['--watch', 'false', '--passWithNoTests'];
      if (options.isPlugin) {
        args.unshift('plugin');
      }
      if (process.env.CI) {
        // Limit to one worker on CIs
        args.push('--maxWorkers', '1');
      }
      await runPackageScriptAsync(pkg, 'test', args);
    }
    if (options.lint) {
      const args = ['--max-warnings', '0'];
      if (options.isPlugin) {
        args.unshift('plugin');
      }
      if (options.fixLint) {
        args.push('--fix');
      }
      await runPackageScriptAsync(pkg, 'lint', args);
    }
    logger.log(`✨ ${green.bold(pkg.packageName)} checks passed`);

    if (!options.isPlugin && pkg.hasPlugin) {
      return await checkPackageAsync(pkg, { ...options, isPlugin: true });
    }
    return true;
  } catch {
    // runPackageScriptAsync is intentionally written to handle errors and make it safe to suppress errors in the caller
    return false;
  }
}
