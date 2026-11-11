import { Command } from '@expo/commander';
import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';
import { PromisyClass, TaskQueue } from 'cwait';
import fs from 'fs-extra';
import npmPacklist from 'npm-packlist';
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

const TEMPLATE_PATH = 'templates/expo-template-bare-minimum';

async function getTemplatePathspecs(): Promise<string[]> {
  const packlist = await npmPacklist({ path: path.join(EXPO_DIR, TEMPLATE_PATH) });
  return packlist
    .filter((f) => f.startsWith('android/') || f.startsWith('ios/') || f === 'package.json')
    .map((f) => `${TEMPLATE_PATH}/${f}`);
}

const TEMPLATE_PACKAGE_JSON_PATH = `${TEMPLATE_PATH}/package.json`;

async function readPublishedPackageJsonAsync(ref: string) {
  const packageJson = await Git.readFileAsync(ref, path.join(EXPO_DIR, TEMPLATE_PACKAGE_JSON_PATH));
  let publishedPackageJson = packageJson;
  for (const [dependency, name, range] of packageJson.matchAll(/"([^"]+)": "workspace:([~^*])"/g)) {
    const packagePath = path.join(EXPO_DIR, 'packages', name, 'package.json');
    const { version } = JSON.parse(await Git.readFileAsync(ref, packagePath));
    publishedPackageJson = publishedPackageJson.replace(
      dependency,
      `"${name}": "${range === '*' ? '' : range}${version}"`
    );
  }
  return publishedPackageJson;
}

async function diffPublishedPackageJsonAsync(fromRef: string, toRef: string) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bare-diffs-'));
  try {
    const sides = [`a/${TEMPLATE_PACKAGE_JSON_PATH}`, `b/${TEMPLATE_PACKAGE_JSON_PATH}`];
    await fs.outputFile(path.join(tempDir, sides[0]), await readPublishedPackageJsonAsync(fromRef));
    await fs.outputFile(path.join(tempDir, sides[1]), await readPublishedPackageJsonAsync(toRef));
    const { stdout: shortHead } = await Git.runAsync(['rev-parse', '--short', 'HEAD']);
    const args = [
      '-c',
      `core.abbrev=${shortHead.trim().length}`,
      'diff',
      '--no-index',
      '--no-prefix',
    ];
    const { stdout } = await spawnAsync('git', [...args, ...sides], { cwd: tempDir }).catch(
      (error) => (error.status === 1 ? error : Promise.reject(error))
    );
    return stdout;
  } finally {
    await fs.remove(tempDir);
  }
}

async function executeDiffCommand(
  diffDirPathRaw,
  sdkFrom: string,
  sdkTo: string,
  pathspecs: string[]
) {
  const fromRef = `origin/${sdkToBranch(sdkFrom)}`;
  const toRef = `origin/${sdkToBranch(sdkTo)}`;
  const diffPath = path.join(diffDirPathRaw, `${sdkFrom}..${sdkTo}.diff`);

  const otherPathspecs = pathspecs.filter((pathspec) => pathspec !== TEMPLATE_PACKAGE_JSON_PATH);
  const diff = await spawnAsync('git', ['diff', `${fromRef}..${toRef}`, '--', ...otherPathspecs], {
    cwd: EXPO_DIR,
  });
  const contents = diff.stdout + (await diffPublishedPackageJsonAsync(fromRef, toRef));

  // write raw diff for later comparison to see if templates changed.
  await fs.writeFile(diffPath, contents);

  // used for the consolidated JSON
  return { name: `${sdkFrom}..${sdkTo}`, contents };
}

async function action({ check = false }: ActionOptions) {
  const taskQueue = new TaskQueue(Promise as PromisyClass, os.cpus().length);

  // base directory for diffs and the consolidated JSON
  const diffDirPathBase = path.join(
    EXPO_DIR,
    'docs',
    'public',
    'static',
    'diffs',
    'template-bare-minimum'
  );

  // subdirectory for raw diffs, to make it easier to check if there's been a change in CI
  // -c flag will only compare the raw diffs, not the consolidated JSON
  const diffDirPathRaw = path.join(diffDirPathBase, 'raw');

  try {
    // generate from all other SDK version to the specified SDK version
    const diffJobs: PromiseLike<any>[] = [];

    const { minSdk, maxSdk } = getReleasedSdkVersionRange();

    const sdkVersionsToDiff = allVersions(minSdk, maxSdk);
    sdkVersionsToDiff.push('unversioned');

    await Git.fetchAsync();

    // clear all versions before regenerating

    // files/folders never change in base directory, all diffs are written to diffInfo.json
    await fs.ensureDir(diffDirPathBase);

    // files inside of raw can change as SDK versions are updated and old ones fall off.
    await fs.remove(diffDirPathRaw);
    await fs.ensureDir(diffDirPathRaw);

    const pathspecs = await getTemplatePathspecs();

    // start with the lowest SDK version and diff it with all other SDK versions equal to or lower than it
    sdkVersionsToDiff.forEach((toSdkVersion) => {
      const sdkVersionsLowerThenOrEqualTo =
        toSdkVersion === 'unversioned'
          ? sdkVersionsToDiff
          : sdkVersionsToDiff.filter((s) => s <= toSdkVersion);
      sdkVersionsLowerThenOrEqualTo.forEach((fromSdkVersion) => {
        diffJobs.push(
          taskQueue.add(() =>
            executeDiffCommand(diffDirPathRaw, fromSdkVersion, toSdkVersion, pathspecs)
          )
        );
      });
    });
    const diffs = await Promise.all(diffJobs);

    // see if diff regeneration changed the diff files from the last commit
    // Used to fail package checks when diffs are not regenerated
    // This only compares the raw files to avoid failing due to a minute change in the JSON
    if (check) {
      const child = await spawnAsync(
        'git',
        ['status', '--porcelain', 'docs/public/static/diffs/template-bare-minimum/raw**'],
        {
          stdio: 'pipe',
        }
      );

      const lines = child.stdout ? child.stdout.trim().split(/\r\n?|\n/g) : [];

      if (lines.length > 0) {
        logger.log(
          `expo-template-bare-minimum has changed. Run 'et generate-bare-diffs' to regenerate them.`
        );
        logger.log(
          'If this check is failing in CI but the diffs have not changed, check that your version of git matches the version used in CI.'
        );
        process.exit(1);
      }

      logger.success('🏁 No changes to expo-template-bare-minimum.');
      return;
    }

    // write a JSON file with all the diffs so we can load them synchronously
    await fs.writeFile(
      path.join(diffDirPathBase, 'diffInfo.json'),
      await buildDiffsJson(diffs, sdkVersionsToDiff)
    );

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
      `Generate diffs of expo-template-bare-minimum for bare upgrade instructions for the last 6 versions. Generates a diffInfo.json file for reading by the docs website, as well as raw diffs used for detecting changes to expo-template-bare-minimum.`
    )
    .option(
      '-c, --check',
      'Check for if expo-template-bare-minimum was changed but new diffs were not generated.'
    )
    .asyncAction(action);
};
