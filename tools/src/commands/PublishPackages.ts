import { Command } from '@expo/commander';
import chalk from 'chalk';
import fs from 'node:fs';
import path from 'node:path';
import semver from 'semver';

import { EXPO_DIR } from '../Constants';
import logger from '../Logger';
import { runTurboTasksAsync } from '../Turbo';
import * as Versions from '../Versions';
import { formatVersionsDelta } from '../VersionsDiff';
import {
  assertCleanWorkingTreeAsync,
  assertChangesetPrerequisiteAsync,
  assertReleaseBranch,
  assertVersionCommitAsync,
  getReleaseBranchAsync,
  getPublishPlanAsync,
  getStablePublishArgsAsync,
  packChangesetsAsync,
  runChangesetsAsync,
} from '../changesets/Changesets';
import {
  readBundledNativeModulesAsync,
  syncNativeModulesEndpointsAsync,
} from '../changesets/NativeModules';

type CommandOptions = { dryRun: boolean; force: boolean };

export default (program: Command) => {
  program
    .command('publish-packages')
    .option('--dry-run', 'Prepare and validate release artifacts without publishing.', false)
    .option(
      '-f, --force',
      'Publish despite pending changeset entries. Other release safeguards are not bypassed.',
      false
    )
    .description('Publish packages from an already-versioned stable release commit.')
    .asyncAction(async (options: CommandOptions) => {
      const branchName = await getReleaseBranchAsync();
      if (!options.force) {
        await assertReleaseBranch(branchName, 'stable');
        await assertCleanWorkingTreeAsync();
        await assertChangesetPrerequisiteAsync('absent', options.force);
        await assertVersionCommitAsync();
      }
      const publishPlan = await getPublishPlanAsync();
      if (publishPlan.length) {
        await runTurboTasksAsync(['build']);
        await runTurboTasksAsync(['precompile-ios', 'precompile-android']);
      }
      if (options.dryRun) {
        if (publishPlan.length) {
          await packChangesetsAsync('expo-changesets-pack-');
        }
        return;
      }
      if (publishPlan.length) {
        await runChangesetsAsync(await getStablePublishArgsAsync(branchName));
      }

      const stagingUpdated = await updateVersionsEndpointAsync();
      await syncNativeModulesAsync();
      await promoteVersionsAsync(stagingUpdated);
    });
};

function warnPublishedButNot(task: string, command: string, error?: unknown): void {
  const reason = error instanceof Error ? error.message : error ? String(error) : undefined;
  logger.warn(
    chalk.yellow.bold(
      `⚠️  The packages were published, but ${task}${reason ? `: ${reason}` : ''}. Run \`${command}\` locally to finish the release.`
    )
  );
}

async function promoteVersionsAsync(stagingUpdated: boolean): Promise<void> {
  if (!stagingUpdated) {
    warnPublishedButNot(
      'the versions endpoint was not promoted to production because the staging update failed',
      'et promote-versions'
    );
    return;
  }
  try {
    const delta = await Versions.promoteVersionsToProductionAsync();
    if (delta) {
      logger.info('Promoted the staging versions endpoint to production:');
      logger.info(formatVersionsDelta(delta, await Versions.getVersionsAsync()));
    } else {
      logger.info('The production versions endpoint already matches staging.');
    }
  } catch (error) {
    warnPublishedButNot(
      'the versions endpoint was not promoted to production',
      'et promote-versions',
      error
    );
  }
}

async function readExpoPackageVersionAsync(): Promise<string> {
  const expoPackage = JSON.parse(
    await fs.promises.readFile(path.join(EXPO_DIR, 'packages/expo/package.json'), 'utf8')
  );
  return expoPackage.version;
}

async function syncNativeModulesAsync(): Promise<void> {
  const sdkVersion = `${semver.major(await readExpoPackageVersionAsync())}.0.0`;
  const results = await syncNativeModulesEndpointsAsync({
    sdkVersion,
    secret: process.env.EXPO_SDK_NATIVE_MODULES_SECRET,
    bundledNativeModules: await readBundledNativeModulesAsync(),
  });
  for (const { env, status, changes, error } of results) {
    if (status === 'failed') {
      warnPublishedButNot(
        `bundledNativeModules.json for SDK ${sdkVersion} was not synced to ${env}`,
        env === 'staging' ? 'et sbnm' : `et sbnm -e ${env}`,
        error
      );
    } else if (status === 'synced') {
      logger.info(
        `Synced ${changes.length} native module versions for SDK ${sdkVersion} to ${env}.`
      );
    } else {
      logger.info(`Native module versions for SDK ${sdkVersion} on ${env} are already up to date.`);
    }
  }
}

async function updateVersionsEndpointAsync(): Promise<boolean> {
  const version = await readExpoPackageVersionAsync();
  const sdkVersion = `${semver.major(version)}.0.0`;
  const expoVersion = `~${version}`;

  logger.info(
    `Updating the versions endpoint for SDK ${sdkVersion} with expoVersion ${expoVersion}.`
  );
  try {
    await Versions.modifySdkVersionsAsync(sdkVersion, (sdkVersions) => ({
      ...sdkVersions,
      expoVersion,
    }));
    return true;
  } catch (error) {
    warnPublishedButNot(
      `the staging versions endpoint was not updated with expoVersion ${expoVersion}`,
      `et update-versions --sdkVersion ${sdkVersion} --key expoVersion --value '${expoVersion}'`,
      error
    );
    return false;
  }
}
