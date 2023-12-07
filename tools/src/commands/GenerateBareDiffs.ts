import { Command } from '@expo/commander';
import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';
import { PromisyClass, TaskQueue } from 'cwait';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import semver from 'semver';

import { EXPO_DIR } from '../Constants';
import Git from '../Git';
import logger from '../Logger';

type ActionOptions = {
  check?: boolean;
};

async function buildDiffsJson(diffs: { name: string; contents: string }[], versions: string[]) {
  const diffMap = {};
  for (const diff of diffs) {
    diffMap[diff.name] = diff.contents;
  }
  const diffObj = {
    versions,
    diffs: diffMap,
  };
  return JSON.stringify(diffObj);
}

function allVersions(min, max) {
  const versions: string[] = [];
  for (let i = min; i <= max; i++) {
    versions.push(i.toString());
  }
  return versions;
}

function getReleasedSdkVersionRange() {
  const packageJson = fs.readJSONSync(path.join(EXPO_DIR, 'packages', 'expo', 'package.json'));
  const expoPackageVersion = packageJson.version;
  let maxSdk = semver.major(expoPackageVersion);
  // if current version is an alpha or beta, then one version behind is the latest stable release
  if (expoPackageVersion.includes('alpha') || expoPackageVersion.includes('beta')) {
    maxSdk--;
  }
  return {
    maxSdk,
    minSdk: maxSdk - 5,
  };
}

function sdkToBranch(sdkVersion: string) {
  if (sdkVersion === 'unversioned') {
    return 'main';
  }
  return `sdk-${sdkVersion}`;
}

async function executeDiffCommand(sdkFrom: string, sdkTo: string) {
  const diffCommand = `origin/${sdkToBranch(sdkFrom)}..origin/${sdkToBranch(sdkTo)}`;

  await Git.fetchAsync();

  const diff = await spawnAsync(
    'git',
    ['diff', diffCommand, '--', 'templates/expo-template-bare-minimum'],
    {
      cwd: EXPO_DIR,
    }
  );

  return { name: `${sdkFrom}..${sdkTo}`, contents: diff.stdout };
}

async function action({ check = false }: ActionOptions) {
  const taskQueue = new TaskQueue(Promise as PromisyClass, os.cpus().length);

  const diffDirPath = path.join(
    EXPO_DIR,
    'docs',
    'public',
    'static',
    'diffs',
    'template-bare-minimum'
  );

  try {
    //const sdkVersions = await readSdkVersions(diffDirPath, sdk);
    // generate from all other SDK version to the specified SDK version
    const diffJobs: PromiseLike<any>[] = [];

    const { minSdk, maxSdk } = getReleasedSdkVersionRange();

    const sdkVersionsToDiff = allVersions(minSdk, maxSdk);
    sdkVersionsToDiff.push('unversioned');

    // clear all versions before regenerating
    await fs.remove(diffDirPath);
    await fs.ensureDir(diffDirPath);

    //const diffPairs: string[] = [];

    // start with the lowest SDK version and diff it with all other SDK versions equal to or lower than it
    sdkVersionsToDiff.forEach((toSdkVersion) => {
      const sdkVersionsLowerThenOrEqualTo =
        toSdkVersion === 'unversioned'
          ? sdkVersionsToDiff
          : sdkVersionsToDiff.filter((s) => s <= toSdkVersion);
      sdkVersionsLowerThenOrEqualTo.forEach((fromSdkVersion) => {
        diffJobs.push(taskQueue.add(() => executeDiffCommand(fromSdkVersion, toSdkVersion)));
      });
    });
    const diffs = await Promise.all(diffJobs);

    // write a JSON file with all the diffs so we can load them synchronously
    await fs.writeFile(
      path.join(diffDirPath, 'diffInfo.json'),
      await buildDiffsJson(diffs, sdkVersionsToDiff)
    );

    // see if diff regeneration changed the diff files from the last commit
    // Used to fail package checks when diffs are not regenerated
    if (check) {
      const child = await spawnAsync(
        'git',
        ['status', '--porcelain', 'docs/public/static/diffs/template-bare-minimum**'],
        {
          stdio: 'pipe',
        }
      );

      const lines = child.stdout ? child.stdout.trim().split(/\r\n?|\n/g) : [];

      if (lines.length > 0) {
        logger.log(
          `expo-template-bare-minimum has changed. Run 'et generate-bare-diffs' to regenerate them.`
        );
        process.exit(1);
      }

      logger.success('🏁 No changes to expo-template-bare-minimum.');
      return;
    }

    logger.log(
      chalk.green(
        `\n🎉 Successfully generated diffs for template-bare-minimum for the last 6 SDK versions + main`
      )
    );
  } catch (error) {
    logger.error(error);
  }
}

export default (program: Command) => {
  program
    .command('generate-bare-diffs')
    .alias('gbd')
    .description(
      `Generate diffs of expo-template-bare-minimum for bare upgrade instructions for the last 6 versions.`
    )
    .option(
      '-c, --check',
      'Check for if expo-template-bare-minimum was changed but new diffs were not generated.'
    )
    .asyncAction(action);
};
