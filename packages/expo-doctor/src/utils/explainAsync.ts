import spawnAsync, { SpawnResult } from '@expo/spawn-async';
import chalk from 'chalk';

import { RootNodePackage } from './explainDependencies.types';
import { Log } from './log';

function isSpawnResult(result: any): result is SpawnResult {
  return 'stderr' in result && 'stdout' in result && 'status' in result;
}

/** Spawn `npm explain [name] --json` and return the parsed JSON. Returns `null` if the requested package is not installed. */
export async function explainAsync(
  packageName: string,
  projectRoot: string,
  parameters: string[] = []
): Promise<RootNodePackage[] | null> {
  const args = ['explain', packageName, ...parameters, '--json'];

  try {
    const { stdout } = await spawnAsync('npm', args, {
      stdio: 'pipe',
      cwd: projectRoot,
    });

    return JSON.parse(stdout);
  } catch (error: any) {
    if (isSpawnResult(error)) {
      if (error.stderr.match(/No dependencies found matching/)) {
        return null;
      } else if (error.stdout.match(/Usage: npm <command>/)) {
        throw new Error(
          `Dependency tree validation for ${chalk.underline(
            packageName
          )} failed. This validation is only available on Node 16+ / npm 8.`
        );
      }
    }
    if (error.stderr) {
      Log.debug(error.stderr);
    }
    throw new Error(`Failed to find dependency tree for ${packageName}: ` + error.message);
  }
}
