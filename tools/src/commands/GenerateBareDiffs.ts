import { Command } from '@expo/commander';
import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';
import { spawn } from 'child_process';
import { PromisyClass, TaskQueue } from 'cwait';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
//import semver from 'semver';

import { EXPO_DIR } from '../Constants';
import logger from '../Logger';

type ActionOptions = {
  minSdk: string;
  maxSdk: string;
};

// Add minor/ patch to SDK version int if it's not already there, and not unversioned
/*function sdkVersionToSemverish(sdkVersion : string) {
  if (sdkVersion === 'unversioned') {
    return sdkVersion;
  }
  if (sdkVersion.match(/^\d+$/)) {
    return `${sdkVersion}.0.0`;
  }
}*/

const executeDiffCommand = async (diffDirPath: string, sdkFrom: string, sdkTo: string) => {
  function sdkToBranch(sdkVersion: string) {
    if (sdkVersion === 'unversioned') {
      return 'main';
    }
    return `sdk-${sdkVersion}`;
  }

  const diffPath = path.join(diffDirPath, `${sdkFrom}..${sdkTo}.diff`);

  const diffCommand = `origin/${sdkToBranch(sdkFrom)}..origin/${sdkToBranch(sdkTo)}`;

  try {
    const diff = await spawnAsync(
      'git',
      ['diff', diffCommand, '--', 'templates/expo-template-bare-minimum'],
      {
        cwd: EXPO_DIR,
      }
    );

    fs.writeFileSync(diffPath, diff.stdout);
  } catch (error) {
    logger.error(error);
    logger.log(error.stderr);
    throw error;
  }
};

// Keep a running list of all SDK versions by the versions that are alerady in the diff directory.
// When starting over, diff from lowest to highest, and then all versions will be diffed with each other.
/*const readSdkVersions = async (diffDirPath: string, toSdkVersion: string) => {
  function onlyUnique(value, index, array) {
    return array.indexOf(value) === index;
  }

  const files = fs.readdirSync(diffDirPath);
  const fromSdkVersions = files.map((file) => file.split('..')[0]);
  fromSdkVersions.push(toSdkVersion); // add the SDK version that we're diffing to the list in case it's the first time we're generating a diff
  const uniqueSdkVersions = fromSdkVersions.filter(onlyUnique);

  if (uniqueSdkVersions.find((version) => version !== 'unversioned' && !version.match(/^\d+$/))) {
    throw new Error('One or more diffs has an invalid SDK version. Bad!!!');
  }

  return uniqueSdkVersions;
};*/

async function action({ minSdk, maxSdk }: ActionOptions) {
  function allVersions(min, max) {
    const versions: string[] = [];
    for (let i = parseInt(min, 10); i <= parseInt(max, 10); i++) {
      versions.push(i.toString());
    }
    return versions;
  }

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
    let diffJobs: PromiseLike<any>[] = [];

    const sdkVersionsToDiff = allVersions(minSdk, maxSdk);

    // clear all versions before regenerating
    await spawnAsync('rm', ['-rf', diffDirPath]);
    fs.mkdirSync(diffDirPath);

    // start with the lowest SDK version and diff it with all other SDK versions equal to or lower than it
    sdkVersionsToDiff.forEach((toSdkVersion) => {
      const sdkVersionsLowerThenOrEqualTo = sdkVersionsToDiff.filter((s) => s <= toSdkVersion);
      diffJobs = diffJobs.concat(
        sdkVersionsLowerThenOrEqualTo.map((fromSdkVersion) =>
          taskQueue.add(() => executeDiffCommand(diffDirPath, fromSdkVersion, toSdkVersion))
        )
      );
    });
    await Promise.all(diffJobs);
    // write the list of SDK versions to a file to generate list of versions for which diffs can be viewed
    fs.writeFileSync(path.join(diffDirPath, 'versions.json'), JSON.stringify(sdkVersionsToDiff));

    logger.log(chalk.green(`\n🎉 Successfully generated diffs against all previous SDK versions!`));
  } catch (error) {
    logger.error(error);
  }
}

export default (program: Command) => {
  program
    .command('generate-bare-diffs')
    .alias('gbd')
    .description(`Generate diffs of template-bare-minimum for bare upgrade instructions.`)
    .option(
      '-a, --minSdk <version>',
      'Lowest SDK for which to generate diffs for all applicable previous SDK versions'
    )
    .option(
      '-b, --maxSdk <version>',
      'Highest SDK for which to generate diffs for all applicable previous SDK versions'
    )
    .asyncAction(action);
};
