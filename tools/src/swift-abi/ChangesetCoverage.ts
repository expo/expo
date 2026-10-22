import path from 'node:path';

import * as Directories from '../Directories';
import { spawnAsync } from '../Utils';
import { getPendingChangesetsAsync } from '../changesets/Changesets';
import { DigesterFinding, isRemovalFinding } from './Digester';

const PRECOMPILED_QUERY =
  '{ packages(filter: { has: { field: TASK_NAME, value: "precompile-ios" } }) { items { name } } }';

export function parsePrecompiledPackages(stdout: string): string[] {
  const items: { name: string }[] = JSON.parse(stdout.slice(stdout.indexOf('\n{') + 1)).data
    .packages.items;
  return items
    .map((item) => item.name)
    .filter((name) => name !== 'expo-modules-core' && name !== 'expo-modules-jsi')
    .sort();
}

export async function getRequiredPackagesAsync(): Promise<string[]> {
  const turboBin = path.join(Directories.getNodeModulesDir(), '.bin', 'turbo');
  const { stdout } = await spawnAsync(turboBin, ['query', PRECOMPILED_QUERY], {
    cwd: Directories.getExpoRepositoryRootDir(),
  });
  return parsePrecompiledPackages(stdout);
}

export async function findMissingBumps(
  changesetsDir: string,
  required: string[]
): Promise<string[]> {
  const changesets = await getPendingChangesetsAsync(changesetsDir);
  const bumped = new Set(
    changesets.flatMap((changeset) =>
      changeset.releases.filter((release) => release.type !== 'none').map((release) => release.name)
    )
  );
  return required.filter((name) => !bumped.has(name));
}

export function packagesToBump(options: {
  abiFindings: DigesterFinding[];
  affected: string[];
  symbolsComplete: boolean;
  all: string[];
}): string[] {
  const onlyRemovals = options.abiFindings.every(isRemovalFinding);
  if (!onlyRemovals || (options.abiFindings.length > 0 && !options.symbolsComplete)) {
    return options.all;
  }
  return [...new Set(options.affected)].sort();
}
