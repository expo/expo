import { Command } from '@expo/commander';
import chalk from 'chalk';
import inquirer from 'inquirer';

import logger from '../Logger';
import {
  getOrgMembersAsync,
  getTeamPackagesAsync,
  listOwnersAsync,
  removeOwnerAsync,
} from '../Npm';
import { runWithSpinner } from '../Utils';

type ActionOptions = object;

const API_TOKEN = process.env.NPM_TOKEN_READ_ONLY;
const ORG_NAME = 'expo';

// Limits the number of `npm view` processes that run at the same time.
const CONCURRENCY_LIMIT = 8;

// If we want to add any exemptions for particular users, add them here.
const USERS_TO_SKIP: string[] = [];

export default (program: Command) => {
  program
    .command('validate-npm-owners')
    .alias('vnpmo')
    .description('Ensures that owners of npm packages are all members of the expo organization.')
    .asyncAction(action);
};

async function action(_options: ActionOptions) {
  if (API_TOKEN) {
    // npm reads auth from the environment config, so every npm command
    // spawned by this process authenticates with the token.
    process.env['npm_config_//registry.npmjs.org/:_authToken'] = API_TOKEN;
  } else {
    logger.log(
      chalk.dim(
        'Environment variable `NPM_TOKEN_READ_ONLY` is not set, using the local npm credentials instead.\n'
      )
    );
  }

  const orgMembers = await runWithSpinner('Fetching organization members...', async (step) => {
    const memberNames = memberNamesFromOrgMembersResponse(await getOrgMembersAsync(ORG_NAME));
    step.succeed(`${memberNames.length} members found: ${chalk.dim(memberNames.join(', '))}`);
    return memberNames;
  });

  const packages = await runWithSpinner('Fetching organization packages...', async (step) => {
    const packageNames = packageNamesFromOrgPackagesResponse(await getTeamPackagesAsync(ORG_NAME));
    step.succeed(`${packageNames.length} packages found: ${chalk.dim(packageNames.join(', '))}`);
    return packageNames;
  });

  const packagesWithInvalidOwners = await runWithSpinner(
    'Validating package owners...',
    (step) => {
      return validatePackageOwnersAsync([...orgMembers, ...USERS_TO_SKIP], packages, (completed) => {
        step.text = chalk.bold(`Validating package owners... ${completed}/${packages.length}`);
      });
    },
    `Validated owners of ${packages.length} packages`
  );
  logger.log();

  if (Object.keys(packagesWithInvalidOwners).length === 0) {
    logger.log('✅ All packages have valid owners');
    return;
  }

  printPackagesWithInvalidOwners(packagesWithInvalidOwners);

  if (!process.stdout.isTTY || process.env.CI) {
    logger.log(
      'Run this command in an interactive terminal to remove some of these owners, ' +
        'or add exemptions to `USERS_TO_SKIP`.'
    );
    // Set the exit code instead of calling `process.exit` that would kill
    // the process before the piped stdout is fully flushed.
    process.exitCode = 1;
    return;
  }

  const allRemoved = await promptToRemoveInvalidOwnersAsync(packagesWithInvalidOwners);

  if (allRemoved) {
    logger.log('✅ All invalid owners have been removed');
  } else {
    process.exitCode = 1;
  }
}

/**
 * Asks the user to choose which invalid owners to remove from their packages,
 * then removes them. Resolves to `true` when no invalid owners are left.
 */
async function promptToRemoveInvalidOwnersAsync(packagesWithInvalidOwners: {
  [key: string]: string[];
}): Promise<boolean> {
  const groupedByOwner = groupPackagesByInvalidOwner(packagesWithInvalidOwners);
  const { ownersToRemove } = await inquirer.prompt<{ ownersToRemove: string[] }>([
    {
      type: 'checkbox',
      name: 'ownersToRemove',
      message: `Choose which users to remove from the owners of their packages\n  ${chalk.green(
        '●'
      )} selected  ○ unselected\n`,
      choices: groupedByOwner.map(([owner, ownedPackages]) => ({
        value: owner,
        short: owner,
        name: `${owner} ${chalk.dim(`(${pluralizePackages(ownedPackages.length)})`)}`,
      })),
      pageSize: Math.min(groupedByOwner.length, (process.stdout.rows || 100) - 4),
    },
  ]);

  const removals = groupedByOwner
    .filter(([owner]) => ownersToRemove.includes(owner))
    .flatMap(([owner, ownedPackages]) =>
      ownedPackages.map((packageName) => ({ owner, packageName }))
    );

  if (removals.length === 0) {
    return false;
  }

  const failures: { owner: string; packageName: string; reason: string }[] = [];

  await runWithSpinner('Removing owners...', async (step) => {
    let completedCount = 0;

    for (const { owner, packageName } of removals) {
      step.text = chalk.bold(
        `Removing owners... ${++completedCount}/${removals.length} ${chalk.dim(
          `(${owner} from ${packageName})`
        )}`
      );
      try {
        await removeOwnerAsync(packageName, owner);
      } catch (error: any) {
        const reason = String(error.stderr ?? error.message)
          .trim()
          .split('\n')[0];
        failures.push({ owner, packageName, reason });
      }
    }

    if (failures.length === 0) {
      step.succeed(`Removed ${removals.length} owners`);
    } else {
      step.fail(`Failed to remove ${failures.length} of ${removals.length} owners`);
    }
  });

  if (failures.length > 0) {
    for (const { owner, packageName, reason } of failures) {
      logger.log(`- ${chalk.red(owner)} from ${chalk.green(packageName)}: ${reason}`);
    }
    logger.log(
      'If your npm account uses two-factor auth, set the `NPM_OTP` env var ' +
        'to a fresh one-time password and re-run this command.'
    );
  }

  return failures.length === 0 && ownersToRemove.length === groupedByOwner.length;
}

async function getPackageOwnersAsync(packageName: string): Promise<string[]> {
  let output: string;
  try {
    output = await listOwnersAsync(packageName);
  } catch (error: any) {
    throw new Error(
      `Could not list owners of the "${packageName}" package. ` +
        'The package may have been unpublished or replaced by a security placeholder. ' +
        'If it no longer exists, remove it from the organization, otherwise re-run the command.\n' +
        String(error.stderr ?? error.message).trim()
    );
  }
  return ownerNamesFromOwnerLsOutput(output);
}

/**
 * Extracts member names from the `npm org ls` response, which maps each member
 * name to their role in the organization.
 */
export function memberNamesFromOrgMembersResponse(response: unknown): string[] {
  if (!response || typeof response !== 'object' || Array.isArray(response)) {
    throw new Error(`Invalid response structure or data type: ${JSON.stringify(response)}`);
  }

  const memberNames = Object.keys(response);

  if (memberNames.length === 0) {
    throw new Error(
      `npm returned no members for the "${ORG_NAME}" organization. ` +
        'This usually means the request was not authenticated, in which case npm silently returns an empty list. ' +
        'Run `npm login` or set the `NPM_TOKEN_READ_ONLY` env var to a token of an organization member.'
    );
  }

  return memberNames;
}

/**
 * Extracts package names from the `npm access list packages` response, which
 * maps each package name to the organization's permission level.
 */
export function packageNamesFromOrgPackagesResponse(response: unknown): string[] {
  if (!response || typeof response !== 'object' || Array.isArray(response)) {
    throw new Error(`Invalid response structure or data type: ${JSON.stringify(response)}`);
  }

  const packageNames = Object.keys(response);

  if (packageNames.length === 0) {
    throw new Error(
      `npm returned no packages for the "${ORG_NAME}" organization. ` +
        'This makes the validation pass without checking anything, so it fails instead. ' +
        'Check whether the npm CLI or its output format has changed.'
    );
  }

  return packageNames;
}

/**
 * Extracts owner names from the `npm owner ls` output, where each line
 * contains one owner formatted as `name <email>`. Some old deprecated
 * packages have no owners at all, which npm reports as `no admin found`.
 */
export function ownerNamesFromOwnerLsOutput(output: string): string[] {
  if (output.trim() === 'no admin found') {
    return [];
  }

  const ownerNames = output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => line.replace(/\s*<[^<>]*>\s*$/, ''));

  if (ownerNames.length === 0) {
    throw new Error(
      '`npm owner ls` returned no owners, but every published package has at least one. ' +
        'Check whether the npm CLI or its output format has changed.'
    );
  }

  return ownerNames;
}

async function validatePackageOwnersAsync(
  orgMembers: string[],
  packages: string[],
  onProgress: (completedCount: number) => void
): Promise<{ [key: string]: string[] }> {
  const packagesWithInvalidOwners: { [key: string]: string[] } = {};
  const queue = [...packages];
  let completedCount = 0;

  const worker = async () => {
    let pkg: string | undefined;
    while ((pkg = queue.shift()) !== undefined) {
      const owners = await getPackageOwnersAsync(pkg);
      const invalidOwners = owners.filter((owner) => !orgMembers.includes(owner));

      if (invalidOwners.length > 0) {
        packagesWithInvalidOwners[pkg] = invalidOwners;
      }
      onProgress(++completedCount);
    }
  };

  await Promise.all(Array.from({ length: CONCURRENCY_LIMIT }, worker));

  return packagesWithInvalidOwners;
}

/**
 * Groups the packages by their invalid owner. Returns `[owner, packageNames]`
 * pairs sorted by the number of packages in descending order, then by the
 * owner name. Package names of each owner are sorted alphabetically.
 */
export function groupPackagesByInvalidOwner(packagesWithInvalidOwners: {
  [key: string]: string[];
}): [string, string[]][] {
  const packagesByOwner: { [owner: string]: string[] } = {};

  for (const [packageName, owners] of Object.entries(packagesWithInvalidOwners)) {
    for (const owner of owners) {
      (packagesByOwner[owner] ??= []).push(packageName);
    }
  }

  return Object.entries(packagesByOwner)
    .map(([owner, packageNames]): [string, string[]] => [owner, packageNames.sort()])
    .sort(([ownerA, packagesA], [ownerB, packagesB]) => {
      return packagesB.length - packagesA.length || ownerA.localeCompare(ownerB);
    });
}

/**
 * Print the users that own some packages but are not members of the organization,
 * together with the packages they own, to summarize the validation.
 */
function printPackagesWithInvalidOwners(packagesWithInvalidOwners: { [key: string]: string[] }) {
  const groupedByOwner = groupPackagesByInvalidOwner(packagesWithInvalidOwners);
  const packagesCount = Object.keys(packagesWithInvalidOwners).length;

  logger.log(
    `❌ Found ${chalk.red.bold(String(groupedByOwner.length))} users that are not members ` +
      `of the organization, but own some of its ${chalk.red.bold(String(packagesCount))} packages\n`
  );

  for (const [owner, ownedPackages] of groupedByOwner) {
    logger.log(`${chalk.red.bold(owner)} owns ${pluralizePackages(ownedPackages.length)}:`);
    logger.log(`  ${chalk.dim(ownedPackages.join(', '))}\n`);
  }
}

function pluralizePackages(count: number): string {
  return `${count} ${count === 1 ? 'package' : 'packages'}`;
}
