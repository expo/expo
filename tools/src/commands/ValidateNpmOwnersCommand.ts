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
import { promptOtp, withOtpRetry } from '../NpmOtp';
import { runWithSpinner, spawnErrorOutput } from '../Utils';

type ActionOptions = {
  byPackage?: boolean;
};

const API_TOKEN = process.env.NPM_TOKEN_READ_ONLY;
const ORG_NAME = 'expo';

// Limits the number of `npm view` processes that run at the same time.
const CONCURRENCY_LIMIT = 8;

/**
 * Owners who are not members of the organization but are allowed to keep the
 * packages listed here. Anything else they own is still reported.
 */
const USERS_TO_SKIP: { [owner: string]: string[] } = {
  evanbacon: [
    'altool',
    'create-expo-app',
    'expo-app-auth',
    'expo-asset-utils',
    'expo-firebase-analytics',
    'expo-firebase-app',
    'expo-firebase-auth',
    'expo-firebase-crashlytics',
    'expo-firebase-database',
    'expo-firebase-firestore',
    'expo-firebase-functions',
    'expo-firebase-instance-id',
    'expo-firebase-invites',
    'expo-firebase-links',
    'expo-firebase-messaging',
    'expo-firebase-notifications',
    'expo-firebase-performance',
    'expo-firebase-remote-config',
    'expo-firebase-storage',
    'expo-google-sign-in',
    'expo-liquid-glass',
    'expo-optimize',
    'expo-phaser',
    'expo-pixi',
    'expo-server',
    'liquid-glass',
    'pod-install',
    'react-liquid-glass',
    'react-native-liquid-glass',
    'testflight',
    'uri-scheme',
  ],
  esamelson: [
    'expo-2d-context',
    'expo-pwa',
    'expo-splash-screen',
    'expo-updates',
    'expo-updates-interface',
  ],
  fson: ['expo-codemod', 'expo-template-blank', 'expo-template-tabs'],
  wkozyra: ['eas-cli-local-build-plugin', 'expo-codemod', 'turtle-cli'],
  davidmokos: ['agent-cli-detector', 'sandbox-cli-detector'],
  ijzerenhein: ['snack-build', 'snack-sdk'],
  nikki93: ['expo-development-client', 'snack-sdk'],
  tcdavis: ['snack-build', 'snack-sdk'],
  jake7: ['expo-type-information'],
  jesseruder: ['snack-sdk'],
  nacl: ['expo-2d-context'],
  sjchmiela: ['expo-blur'],
};

/**
 * Packages that the organization can access but cannot govern, so their owners
 * are not ours to change. `npm access list packages` returns everything the
 * organization has access to, which includes scopes owned by someone else.
 *
 * A pattern ending with `/` exempts an entire scope, anything else is an exact
 * package name. Every entry needs a reason, so that an exemption stays a
 * documented decision instead of a way to make the command quiet.
 */
const PACKAGES_TO_SKIP: { pattern: string; reason: string }[] = [
  {
    pattern: '@config-plugins/',
    reason:
      'Owned by the separate `config-plugins` npm organization, which only grants the expo ' +
      'organization access. `npm owner rm` fails with "Team not found" for non-members.',
  },
];

export default (program: Command) => {
  program
    .command('validate-npm-owners')
    .alias('vnpmo')
    .description('Ensures that owners of npm packages are all members of the expo organization.')
    .option(
      '--by-package',
      'List the invalid owners of each package instead of the packages of each owner, then exit ' +
        'without offering to remove anyone.'
    )
    .asyncAction(action);
};

async function action(options: ActionOptions) {
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
    const memberNames = memberNamesFromOrgMembersResponse(
      await getOrgMembersAsync(ORG_NAME).catch(rethrowNpmAuthError)
    );
    step.succeed(`${memberNames.length} members found: ${chalk.dim(memberNames.join(', '))}`);
    return memberNames;
  });

  const packages = await runWithSpinner('Fetching organization packages...', async (step) => {
    const packageNames = packageNamesFromOrgPackagesResponse(
      await getTeamPackagesAsync(ORG_NAME).catch(rethrowNpmAuthError)
    );
    const { validated, exempt, matched } = partitionExemptPackages(packageNames);

    if (validated.length === 0) {
      throw new Error(
        `All ${packageNames.length} packages of the "${ORG_NAME}" organization are exempted by ` +
          '`PACKAGES_TO_SKIP`, so the validation would check nothing. Narrow the exemptions.'
      );
    }

    step.succeed(`${validated.length} packages found: ${chalk.dim(validated.join(', '))}`);

    if (exempt.length > 0) {
      logger.log(chalk.dim(`Skipping ${pluralize(exempt.length, 'package')}:`));
      for (const { pattern, reason, count } of matched) {
        logger.log(chalk.dim(`  ${pattern} (${pluralize(count, 'package')}) — ${reason}`));
      }
      logger.log();
    }
    return validated;
  });

  const skippedOwners = Object.entries(USERS_TO_SKIP);
  if (skippedOwners.length > 0) {
    logger.log(
      chalk.dim(
        `Accepting ${pluralize(skippedOwners.length, 'user')} as valid owners of their listed packages:`
      )
    );
    for (const [owner, allowedPackages] of skippedOwners) {
      logger.log(chalk.dim(`  ${owner}: ${allowedPackages.join(', ')}`));
    }
    logger.log();
  }

  const packagesWithInvalidOwners = await runWithSpinner(
    'Validating package owners...',
    (step) => {
      return validatePackageOwnersAsync(orgMembers, packages, (completed) => {
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

  if (options.byPackage) {
    printInvalidOwnersByPackage(packagesWithInvalidOwners);
    process.exitCode = 1;
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
 * Replaces npm's opaque non-zero exit with an explanation of which credentials
 * were rejected. Rethrows anything that is not an authentication failure.
 */
function rethrowNpmAuthError(error: unknown): never {
  if (isNpmAuthError(error)) {
    throw new Error(
      'npm rejected the credentials used to read the organization. ' +
        npmCredentialsHelp(!!API_TOKEN)
    );
  }
  throw error;
}

/**
 * Splits the organization packages into the ones to validate and the ones
 * exempted by `PACKAGES_TO_SKIP`, preserving the original order of both.
 */
export function partitionExemptPackages(packageNames: string[]): {
  validated: string[];
  exempt: string[];
  matched: { pattern: string; reason: string; count: number }[];
} {
  const matches = (packageName: string, pattern: string) =>
    pattern.endsWith('/') ? packageName.startsWith(pattern) : packageName === pattern;

  const validated: string[] = [];
  const exempt: string[] = [];

  for (const packageName of packageNames) {
    const isExempt = PACKAGES_TO_SKIP.some(({ pattern }) => matches(packageName, pattern));
    (isExempt ? exempt : validated).push(packageName);
  }

  // Only report exemptions that did something, so a stale entry stays quiet
  // instead of claiming to have skipped packages that no longer exist.
  const matched = PACKAGES_TO_SKIP.map(({ pattern, reason }) => ({
    pattern,
    reason,
    count: exempt.filter((packageName) => matches(packageName, pattern)).length,
  })).filter(({ count }) => count > 0);

  return { validated, exempt, matched };
}

type RemovalFailure = { owner: string; packageName: string; reason: string };

type RemovalFailureCategory = { key: string; title: string; hint: string };

/**
 * The failures that npm reports for `npm owner rm`, in the order we check them.
 * The permission-to-publish message is also a 403, so it has to be matched
 * before the generic refusal.
 */
const REMOVAL_FAILURE_CATEGORIES: (RemovalFailureCategory & { test: RegExp })[] = [
  {
    key: 'other-org',
    test: /Team not found/i,
    title: 'The package belongs to another npm organization',
    hint: 'Only a member of the owning organization can change these owners. Add them to `PACKAGES_TO_SKIP` if the organization is not ours to govern.',
  },
  {
    key: 'not-maintainer',
    test: /do not have permission to publish/i,
    title: 'You are not a maintainer of the package',
    hint: 'Ask a current maintainer to run the removal. `npm owner ls <package>` lists who can.',
  },
  {
    key: 'refused',
    test: /\b403\b|Forbidden/i,
    title: 'npm refused the owner change',
    hint: 'Access to these packages comes from the organization grant rather than from being a package maintainer, so `npm owner rm` cannot change them. A maintainer of the package has to do it.',
  },
];

const UNKNOWN_REMOVAL_FAILURE: RemovalFailureCategory = {
  key: 'unknown',
  title: 'npm failed for another reason',
  hint: 'Read the messages above and re-run the command if they look temporary.',
};

/**
 * Maps a failure reason to the category that explains what to do about it.
 * Resolves to `null` when no category matches.
 */
export function classifyRemovalFailure(reason: string): RemovalFailureCategory | null {
  const matched = REMOVAL_FAILURE_CATEGORIES.find(({ test }) => test.test(reason));
  return matched ? { key: matched.key, title: matched.title, hint: matched.hint } : null;
}

/**
 * Groups removal failures by category so that the report explains each kind of
 * failure once instead of repeating it for every package. Categories keep the
 * order of `REMOVAL_FAILURE_CATEGORIES`, with the unknown ones last. Empty
 * categories are left out.
 */
export function groupFailuresByCategory(
  failures: RemovalFailure[]
): { category: RemovalFailureCategory; failures: RemovalFailure[] }[] {
  const categories = [...REMOVAL_FAILURE_CATEGORIES, UNKNOWN_REMOVAL_FAILURE];

  return categories
    .map((category) => ({
      category: { key: category.key, title: category.title, hint: category.hint },
      failures: failures.filter(
        (failure) =>
          (classifyRemovalFailure(failure.reason) ?? UNKNOWN_REMOVAL_FAILURE).key === category.key
      ),
    }))
    .filter(({ failures }) => failures.length > 0);
}

/**
 * Formats why a removal failed. `npm owner rm` wraps every failure in a generic
 * `EOWNERMUTATE` code and prints the actual cause on the next line, so keeping
 * only the first line would hide the reason.
 */
export function removalFailureReason(error: unknown): string {
  const output = spawnErrorOutput(error) || String((error as any)?.message ?? '');

  const lines = output
    .split('\n')
    .map((line) => line.replace(/^npm error\s*/, '').trim())
    .filter((line) => line.length > 0 && !line.startsWith('A complete log of this run'));

  return lines.join(' — ') || 'Unknown error';
}

/**
 * Whether the spawned npm command failed to authenticate. npm reports this as
 * an `E401` code, both in stderr and in the JSON error object on stdout.
 */
export function isNpmAuthError(error: unknown): boolean {
  return /\bE401\b/.test(spawnErrorOutput(error));
}

/**
 * Explains which credentials npm used and how to replace them. The token from
 * the environment takes precedence over the local `.npmrc`, which is easy to
 * miss when the token expires but plain `npm` commands still work.
 */
export function npmCredentialsHelp(hasApiToken: boolean): string {
  if (hasApiToken) {
    return (
      'npm used the token from the `NPM_TOKEN_READ_ONLY` environment variable, which overrides ' +
      'the credentials in your local `.npmrc`. The token is most likely expired or revoked. ' +
      'Set the variable to a valid read-only token of an organization member, or unset it to use ' +
      'the credentials from `npm login`.'
    );
  }
  return (
    'npm used the credentials from your local `.npmrc`. Run `npm login` as a member of the ' +
    `"${ORG_NAME}" organization, or set the \`NPM_TOKEN_READ_ONLY\` environment variable to a ` +
    'read-only token of an organization member.'
  );
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
        name: `${owner} ${chalk.dim(`(${pluralize(ownedPackages.length, 'package')})`)}`,
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
        // npm requires a one-time password for owner mutations when the account
        // has two-factor auth enabled for writes. A code expires long before
        // hundreds of removals finish, so re-prompt whenever npm rejects it.
        // The spinner has to stop first, otherwise it redraws over the prompt.
        await withOtpRetry(
          () => removeOwnerAsync(packageName, owner),
          async () => {
            step.stop();
            const otp = await promptOtp();
            step.start();
            return otp;
          }
        );
      } catch (error) {
        failures.push({ owner, packageName, reason: removalFailureReason(error) });
      }
    }

    if (failures.length === 0) {
      step.succeed(`Removed ${removals.length} owners`);
    } else {
      step.fail(`Failed to remove ${failures.length} of ${removals.length} owners`);
    }
  });

  for (const { category, failures: categoryFailures } of groupFailuresByCategory(failures)) {
    logger.log(`\n${chalk.yellow.bold(category.title)} ${chalk.dim(`(${category.key})`)}`);

    for (const { owner, packageName, reason } of categoryFailures) {
      logger.log(`- ${chalk.red(owner)} from ${chalk.green(packageName)}: ${chalk.dim(reason)}`);
    }
    logger.log(`  ${category.hint}`);
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
        npmCredentialsHelp(!!API_TOKEN)
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

/**
 * Whether `USERS_TO_SKIP` allows the owner to keep the package. The list is
 * injectable for tests.
 */
export function isOwnerExempt(
  owner: string,
  packageName: string,
  usersToSkip: { [owner: string]: string[] } = USERS_TO_SKIP
): boolean {
  return usersToSkip[owner]?.includes(packageName) ?? false;
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
      const packageName = pkg;
      const owners = await getPackageOwnersAsync(packageName);
      const invalidOwners = owners.filter(
        (owner) => !orgMembers.includes(owner) && !isOwnerExempt(owner, packageName)
      );

      if (invalidOwners.length > 0) {
        packagesWithInvalidOwners[packageName] = invalidOwners;
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
 * The inverse of {@link groupPackagesByInvalidOwner}. Returns `[packageName,
 * owners]` pairs sorted by the number of invalid owners in descending order,
 * then by the package name. Owners of each package are sorted alphabetically.
 */
export function groupInvalidOwnersByPackage(packagesWithInvalidOwners: {
  [key: string]: string[];
}): [string, string[]][] {
  return Object.entries(packagesWithInvalidOwners)
    .map(([packageName, owners]): [string, string[]] => [packageName, [...owners].sort()])
    .sort(([nameA, ownersA], [nameB, ownersB]) => {
      return ownersB.length - ownersA.length || nameA.localeCompare(nameB);
    });
}

/**
 * Prints the invalid owners of each package. Removing owners one package at a
 * time is the safer order, because npm rewrites the whole maintainer list on
 * every removal and loses writes when the same package is changed repeatedly.
 */
function printInvalidOwnersByPackage(packagesWithInvalidOwners: { [key: string]: string[] }) {
  const groupedByPackage = groupInvalidOwnersByPackage(packagesWithInvalidOwners);

  for (const [packageName, owners] of groupedByPackage) {
    logger.log(
      `${chalk.green.bold(packageName)} has ${pluralize(owners.length, 'invalid owner')}:`
    );
    logger.log(`  ${chalk.dim(owners.join(', '))}\n`);
  }
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
    logger.log(`${chalk.red.bold(owner)} owns ${pluralize(ownedPackages.length, 'package')}:`);
    logger.log(`  ${chalk.dim(ownedPackages.join(', '))}\n`);
  }
}

function pluralize(count: number, noun: string): string {
  return `${count} ${count === 1 ? noun : `${noun}s`}`;
}
