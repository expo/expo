import JsonFile from '@expo/json-file';
import chalk from 'chalk';
import path from 'path';

import { updateWorkspaceProjects } from './updateWorkspaceProjects';
import logger from '../../Logger';
import { getListOfPackagesAsync } from '../../Packages';
import { Task } from '../../TasksRunner';
import { Parcel, TaskArgs } from '../types';

const { green, yellow, cyan, magenta } = chalk;

const DEPENDENCY_KEYS = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
] as const;

const WORKSPACE_PREFIX = 'workspace:';

/**
 * Rewrites every `workspace:` specifier in each parcel's `package.json` to the
 * concrete npm range that should ship to the registry. `npm pack` (which the
 * publish flow ultimately calls) does not understand `workspace:` and would
 * otherwise embed the literal string in the published tarball — installs
 * outside the monorepo would then fail to resolve it.
 *
 * This task runs after `updateWorkspaceProjects`, which only rewrites entries
 * that pnpm classifies as workspace deps for packages in the current parcel
 * set. That filter has known blind spots (peer deps with `workspace:*`, deps on
 * workspace packages not being published in the current run), so this task is
 * a comprehensive safety net.
 *
 * Resolution rules (matching pnpm's publish-time behaviour):
 *
 *   workspace:*       → <on-disk version of target>
 *   workspace:        → <on-disk version of target>
 *   workspace:^       → ^<on-disk version of target>
 *   workspace:~       → ~<on-disk version of target>
 *   workspace:1.2.3   → 1.2.3
 *   workspace:^1.2.3  → ^1.2.3
 *   workspace:~1.2.3  → ~1.2.3
 */
export const resolveWorkspaceSpecs = new Task<TaskArgs>(
  {
    name: 'resolveWorkspaceSpecs',
    dependsOn: [updateWorkspaceProjects],
    filesToStage: ['packages/**/package.json', 'templates/**/package.json'],
  },
  async (parcels: Parcel[]) => {
    logger.info(`\n🔧 Resolving ${magenta.bold('workspace:')} specifiers...`);

    // Build a name -> version map keyed by package.json `name`. We can't use
    // `getPackageByName` because it assumes directory name matches package
    // name, which fails for packages like @expo/ui (dir: packages/expo-ui).
    const allPackages = await getListOfPackagesAsync();
    const versionByName = new Map<string, string>();
    for (const pkg of allPackages) {
      versionByName.set(pkg.packageName, String(pkg.packageJson.version));
    }

    let totalRewrites = 0;

    for (const { pkg } of parcels) {
      const packageJsonPath = path.join(pkg.path, 'package.json');
      const packageJson = await JsonFile.readAsync(packageJsonPath);
      let modified = false;

      for (const depKey of DEPENDENCY_KEYS) {
        const deps = packageJson[depKey];
        if (!deps || typeof deps !== 'object') {
          continue;
        }

        const depsRecord = deps as Record<string, string>;
        for (const [depName, currentSpec] of Object.entries(depsRecord)) {
          if (typeof currentSpec !== 'string' || !currentSpec.startsWith(WORKSPACE_PREFIX)) {
            continue;
          }

          const targetVersion = versionByName.get(depName);
          const resolved = resolveWorkspaceSpec(currentSpec, targetVersion, {
            packageName: pkg.packageName,
            depKey,
            depName,
          });

          depsRecord[depName] = resolved;
          modified = true;
          totalRewrites += 1;

          logger.log(
            '  ',
            green(pkg.packageName),
            yellow(`${depKey}.${depName}`),
            cyan(currentSpec),
            '→',
            cyan(resolved)
          );
        }
      }

      if (modified) {
        await JsonFile.writeAsync(packageJsonPath, packageJson);
      }
    }

    if (totalRewrites === 0) {
      logger.log('  No workspace: specifiers to resolve.');
    }
  }
);

/**
 * Pure resolver — exported so it can be unit tested without touching disk.
 *
 * @param spec The current dependency value (must start with `workspace:`).
 * @param targetVersion The on-disk version of the target package, or undefined
 *   if the target isn't a known workspace package.
 * @param context Identifying info for error messages.
 */
export function resolveWorkspaceSpec(
  spec: string,
  targetVersion: string | undefined,
  context: { packageName: string; depKey: string; depName: string }
): string {
  if (!spec.startsWith(WORKSPACE_PREFIX)) {
    return spec;
  }

  const rest = spec.slice(WORKSPACE_PREFIX.length);

  // Forms that need targetVersion: `workspace:`, `workspace:*`, `workspace:^`, `workspace:~`.
  const needsTargetVersion = rest === '' || rest === '*' || rest === '^' || rest === '~';

  if (needsTargetVersion && !targetVersion) {
    throw new Error(
      `${context.packageName} declares ${context.depKey}.${context.depName} as "${spec}" ` +
        `but ${context.depName} is not a workspace package in this monorepo. ` +
        `Either correct the dependency name or replace the workspace: prefix with an explicit version.`
    );
  }

  if (rest === '' || rest === '*') {
    return targetVersion!;
  }
  if (rest === '^' || rest === '~') {
    return `${rest}${targetVersion!}`;
  }
  // Explicit version range with optional ^/~ prefix already baked in.
  return rest;
}
