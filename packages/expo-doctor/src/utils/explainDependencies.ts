// copied from https://github.com/expo/expo-cli/blob/d00319aae4fdcacf1a335af5a8428c45b62fc4d7/packages/expo-cli/src/commands/info/doctor/depedencies/explain.ts
// adapted to return warnings instead of displaying, with some modest renaming to match,
// but otherwise logic is unchanged.

import spawnAsync, { SpawnResult } from '@expo/spawn-async';
import chalk from 'chalk';
import semver from 'semver';

import { RootNodePackage, VersionSpec } from './explainDependencies.types';
import { Log } from './log';

type TargetPackage = { name: string; version?: VersionSpec };

function isSpawnResult(result: any): result is SpawnResult {
  return 'stderr' in result && 'stdout' in result && 'status' in result;
}

/** Spawn `npm explain [name] --json` and return the parsed JSON. Returns `null` if the requested package is not installed. */
async function explainAsync(
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

function organizeExplanations(
  pkg: TargetPackage,
  {
    explanations,
    isValid,
  }: {
    explanations: RootNodePackage[];
    isValid: (pkg: TargetPackage) => boolean;
  }
) {
  const valid: RootNodePackage[] = [];
  const invalid: RootNodePackage[] = [];

  for (const explanation of explanations) {
    const { name } = explanation;
    if (name === pkg.name) {
      if (isValid(explanation)) {
        valid.push(explanation);
      } else {
        invalid.push(explanation);
      }
    }
  }
  return { valid, invalid };
}

/**
 * @param pkg
 * @param explanations
 * @returns null if versions of the package satisfy the constraints, otherwise a string with the warning
 */
async function getExplanationsAsync(
  pkg: TargetPackage,
  explanations: RootNodePackage[]
): Promise<string | null> {
  const { invalid } = organizeExplanations(pkg, {
    explanations,
    isValid(otherPkg) {
      return semver.satisfies(otherPkg.version!, pkg.version!);
    },
  });

  if (invalid.length > 0) {
    return formatInvalidPackagesWarning(pkg, { explanations: invalid });
  }
  return null;
}

function formatInvalidPackagesWarning(
  pkg: TargetPackage,
  { explanations }: { explanations: RootNodePackage[] }
): string {
  const lines: string[] = [];
  if (pkg.version) {
    lines.push(`Expected package ${formatPkg(pkg, 'green')}`);
  } else {
    lines.push(`Expected to not find any copies of ${formatPkg(pkg, 'green')}`);
  }
  lines.push(chalk`Found invalid:`);
  lines.push(explanations.map((explanation) => '  ' + formatPkg(explanation, 'red')).join('\n'));
  lines.push(chalk`  {dim (for more info, run: {bold npm why ${pkg.name}})}`);

  return lines.join('\n');
}

function formatPkg(pkg: TargetPackage, versionColor: string) {
  if (pkg.version) {
    return chalk`{bold ${pkg.name}}{cyan @}{${versionColor} ${pkg.version}}`;
  } else {
    return chalk`{bold ${pkg.name}}`;
  }
}

/**
 * @param pkg
 * @returns string if there's a warning, null if otherwise
 */
export async function getDeepDependenciesWarningAsync(
  pkg: TargetPackage,
  projectRoot: string
): Promise<string | null> {
  const explanations = await explainAsync(pkg.name, projectRoot);

  if (!explanations) {
    return null;
  }

  return getExplanationsAsync(pkg, explanations);
}
