import JsonFile from '@expo/json-file';
import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';
import path from 'path';

import { selectPackagesToPublish } from './selectPackagesToPublish';
import { EXPO_DIR } from '../../Constants';
import logger from '../../Logger';
import { Task } from '../../TasksRunner';
import { CommandOptions, Parcel, TaskArgs } from '../types';

const { green, yellow } = chalk;

const BARE_EXPO_PACKAGE_JSON = path.join(EXPO_DIR, 'apps/bare-expo/package.json');

/**
 * Adds any publishable native packages that are missing from `apps/bare-expo`'s
 * dependencies as `workspace:*` deps and runs `pnpm install`.
 *
 * This is necessary because the Android publish step invokes Gradle inside `apps/bare-expo/android`
 * and relies on Expo autolinking to register each package as a `:<pkg>` Gradle
 * subproject. Autolinking only walks BareExpo's own dependency graph, so any
 * native package that BareExpo doesn't depend on (e.g. `expo-router`) won't be
 * registered and `:<pkg>:expoPublish` fails with "project not found".
 *
 */
export const ensureBareExpoDependencies = new Task<TaskArgs>(
  {
    name: 'ensureBareExpoDependencies',
    dependsOn: [selectPackagesToPublish],
  },
  async (parcels: Parcel[], options: CommandOptions) => {
    if (options.templatesOnly || options.skipAndroidArtifacts) {
      return;
    }

    const nativeParcels = parcels.filter((parcel) => {
      const moduleConfig = parcel.pkg.expoModuleConfig;
      if (!moduleConfig) {
        return false;
      }
      return (
        moduleConfig.platforms?.includes('android') || moduleConfig.platforms?.includes('apple')
      );
    });

    if (nativeParcels.length === 0) {
      return;
    }

    const packageJson = await JsonFile.readAsync(BARE_EXPO_PACKAGE_JSON);
    const dependencies = (packageJson.dependencies ?? {}) as Record<string, string>;
    const devDependencies = (packageJson.devDependencies ?? {}) as Record<string, string>;

    const missing: string[] = [];
    for (const { pkg } of nativeParcels) {
      const name = pkg.packageName;
      if (!(name in dependencies) && !(name in devDependencies)) {
        missing.push(name);
      }
    }

    if (missing.length === 0) {
      return;
    }

    logger.info('\n📦 Adding missing native packages to bare-expo...');
    for (const name of missing) {
      logger.log('  ', `${green('+')} ${yellow(name)}`);
      dependencies[name] = 'workspace:*';
    }

    packageJson.dependencies = sortKeys(dependencies);
    await JsonFile.writeAsync(BARE_EXPO_PACKAGE_JSON, packageJson);

    logger.log('  ', 'Running pnpm install...');
    await spawnAsync('pnpm', ['install', '--no-frozen-lockfile'], {
      cwd: EXPO_DIR,
      stdio: 'inherit',
    });
    logger.success('  ', 'Linked missing native packages into bare-expo.');
  }
);

function sortKeys<T>(obj: Record<string, T>): Record<string, T> {
  return Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)));
}
