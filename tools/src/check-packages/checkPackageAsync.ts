import chalk from 'chalk';

import { checkDependenciesAsync } from './checkDependenciesAsync';
import checkUniformityAsync from './checkUniformityAsync';
import runPackageScriptAsync from './runPackageScriptAsync';
import { ActionOptions } from './types';
import logger from '../Logger';
import { Package } from '../Packages';

const { green } = chalk;

/**
 * Runs package checks on given package.
 */
export default async function checkPackageAsync(
  pkg: Package,
  options: ActionOptions
): Promise<boolean> {
  try {
    switch (options.checkPackageType) {
      case 'package':
        logger.info(`🔍 Checking ${green.bold(pkg.packageName)} package`);
        break;
      case 'plugin':
        logger.info(`🔌 Checking ${green.bold(pkg.packageName)} plugin`);
        break;
      case 'cli':
        logger.info(`🍣 Checking ${green.bold(pkg.packageName)} cli`);
        break;
      case 'utils':
        logger.info(`🥜 Checking ${green.bold(pkg.packageName)} utils`);
        break;
    }

    const args = options.checkPackageType === 'package' ? [] : [options.checkPackageType];
    if (options.build) {
      await runPackageScriptAsync(pkg, 'clean', args);
      await runPackageScriptAsync(pkg, 'build', args);
      if (pkg.scripts.bundle) {
        await runPackageScriptAsync(pkg, 'bundle', args);
      }

      if (options.uniformityCheck) {
        if (options.checkPackageType === 'package') {
          await checkUniformityAsync(pkg, './build');
        } else {
          await checkUniformityAsync(pkg, `./${options.checkPackageType}/build`);
        }
        if (pkg.scripts.bundle) {
          await checkUniformityAsync(pkg, '*bundle');
        }
      }
    }
    if (options.test) {
      const args = ['--watch', 'false', '--passWithNoTests'];
      if (options.checkPackageType !== 'package') {
        args.unshift(options.checkPackageType);
      }
      if (process.env.CI) {
        // Limit to one worker on CIs
        args.push('--maxWorkers', '1');
      }
      await runPackageScriptAsync(pkg, 'test', args);

      if (pkg.hasReactServerComponents && options.checkPackageType === 'package') {
        // Test RSC if available...
        await runPackageScriptAsync(pkg, 'test:rsc', args);
      }
    }
    if (options.lint) {
      const args = ['--max-warnings', '0'];
      if (options.checkPackageType !== 'package') {
        args.unshift(options.checkPackageType);
      }
      if (options.fixLint) {
        args.push('--fix');
      }
      await runPackageScriptAsync(pkg, 'lint', args);
    }
    if (options.dependencyCheck) {
      await checkDependenciesAsync(pkg, options.checkPackageType);
    }
    logger.log(`✨ ${green.bold(pkg.packageName)} checks passed`);

    if (options.checkPackageType === 'package') {
      let finalResult: boolean = true;
      if (pkg.hasPlugin) {
        finalResult =
          finalResult && (await checkPackageAsync(pkg, { ...options, checkPackageType: 'plugin' }));
      }
      if (pkg.hasCli) {
        finalResult =
          finalResult && (await checkPackageAsync(pkg, { ...options, checkPackageType: 'cli' }));
      }
      if (pkg.hasUtils) {
        finalResult =
          finalResult && (await checkPackageAsync(pkg, { ...options, checkPackageType: 'utils' }));
      }
      return finalResult;
    }
    return true;
  } catch {
    // runPackageScriptAsync is intentionally written to handle errors and make it safe to suppress errors in the caller
    return false;
  }
}
