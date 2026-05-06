import JsonFile from '@expo/json-file';
import chalk from 'chalk';
import path from 'path';

import { resolveWorkspaceSpecs } from './resolveWorkspaceSpecs';
import { Task } from '../../TasksRunner';
import { Parcel, TaskArgs } from '../types';

const { red, yellow } = chalk;

const DEPENDENCY_KEYS = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
] as const;

const WORKSPACE_PREFIX = 'workspace:';

export type WorkspaceSpecOffender = {
  packageName: string;
  depKey: string;
  depName: string;
  spec: string;
};

/**
 * Pure scanner — exported for unit tests. Returns every entry in any
 * dependency-shaped object whose value still begins with `workspace:`.
 */
export function findWorkspaceSpecs(
  packageJson: Record<string, unknown>,
  packageName: string
): WorkspaceSpecOffender[] {
  const offenders: WorkspaceSpecOffender[] = [];
  for (const depKey of DEPENDENCY_KEYS) {
    const deps = packageJson[depKey];
    if (!deps || typeof deps !== 'object') {
      continue;
    }
    for (const [depName, spec] of Object.entries(deps as Record<string, unknown>)) {
      if (typeof spec === 'string' && spec.startsWith(WORKSPACE_PREFIX)) {
        offenders.push({ packageName, depKey, depName, spec });
      }
    }
  }
  return offenders;
}

/**
 * Final guard: scans every parcel's on-disk `package.json` immediately before
 * publishing and aborts if any value still starts with `workspace:`. Catches
 * regressions in `resolveWorkspaceSpecs` and any other code path that might
 * mutate package.json after it ran.
 */
export const verifyNoWorkspaceSpecs = new Task<TaskArgs>(
  {
    name: 'verifyNoWorkspaceSpecs',
    dependsOn: [resolveWorkspaceSpecs],
  },
  async (parcels: Parcel[]) => {
    const offenders: WorkspaceSpecOffender[] = [];

    for (const { pkg } of parcels) {
      const packageJsonPath = path.join(pkg.path, 'package.json');
      const packageJson = await JsonFile.readAsync(packageJsonPath);
      offenders.push(...findWorkspaceSpecs(packageJson, pkg.packageName));
    }

    if (offenders.length === 0) {
      return;
    }

    const list = offenders
      .map((o) => `  - ${red(o.packageName)} ${o.depKey}.${o.depName}: ${yellow(o.spec)}`)
      .join('\n');
    throw new Error(
      `Found ${offenders.length} unresolved \`workspace:\` specifier${
        offenders.length === 1 ? '' : 's'
      } in package.json files about to be published:\n${list}\n\n` +
        `npm pack ships these strings verbatim, breaking installs in non-workspace projects. ` +
        `The resolveWorkspaceSpecs task should have rewritten them — please report this as a bug ` +
        `in the publish pipeline.`
    );
  }
);
