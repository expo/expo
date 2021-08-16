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
    if (options.isPlugin) {
      logger.info(`🔌 Checking ${green.bold(pkg.packageName)} plugin`);
    } else {
      logger.info(`🔍 Checking ${green.bold(pkg.packageName)} package`);
    }

    const args = options.isPlugin ? ['plugin'] : [];
    if (options.build) {
      console.time(`total: ${pkg.packageName} ${options.isPlugin ? ['plugin'] : []}`);
      console.time(`clean: ${pkg.packageName} ${options.isPlugin ? ['plugin'] : []}`);
      await runPackageScriptAsync(pkg, 'clean', args);
      console.timeEnd(`clean: ${pkg.packageName} ${options.isPlugin ? ['plugin'] : []}`);
      console.time(`build: ${pkg.packageName} ${options.isPlugin ? ['plugin'] : []}`);
      await runPackageScriptAsync(pkg, 'build', args);
      console.timeEnd(`build: ${pkg.packageName} ${options.isPlugin ? ['plugin'] : []}`);
      if (options.uniformityCheck) {
        await checkBuildUniformityAsync(pkg);
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
      console.time(`test: ${pkg.packageName} ${options.isPlugin ? ['plugin'] : []}`);
      await runPackageScriptAsync(pkg, 'test', args);
      console.timeEnd(`test: ${pkg.packageName} ${options.isPlugin ? ['plugin'] : []}`);
    }
    if (options.lint) {
      const args = ['--max-warnings', '0'];
      if (options.isPlugin) {
        args.unshift('plugin');
      }
      if (options.fixLint) {
        args.push('--fix');
      }
      console.time(`lint: ${pkg.packageName} ${options.isPlugin ? ['plugin'] : []}`);
      await runPackageScriptAsync(pkg, 'lint', args);
      console.timeEnd(`lint: ${pkg.packageName} ${options.isPlugin ? ['plugin'] : []}`);
    }
    logger.log(`✨ ${green.bold(pkg.packageName)} checks passed`);

    if (!options.isPlugin && pkg.hasPlugin) {
      return await checkPackageAsync(pkg, { ...options, isPlugin: true });
    }
    console.timeEnd(`total: ${pkg.packageName} ${options.isPlugin ? ['plugin'] : []}`);
    return true;
  } catch {
    console.timeEnd(`total: ${pkg.packageName} ${options.isPlugin ? ['plugin'] : []}`);
    // runPackageScriptAsync is intentionally written to handle errors and make it safe to suppress errors in the caller
    return false;
  }
}
