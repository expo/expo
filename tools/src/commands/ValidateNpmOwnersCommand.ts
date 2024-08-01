import { Command } from '@expo/commander';
import chalk from 'chalk';
import fetch from 'npm-registry-fetch';

import logger from '../Logger';

type ActionOptions = object;

const API_TOKEN = process.env.NPM_TOKEN_READ_ONLY;
const ORG_NAME = 'expo';

// If we want to add any exemptions for particular users, add them here.
const USERS_TO_SKIP = [];

export default (program: Command) => {
  program
    .command('validate-npm-owners')
    .alias('vnpmo')
    .description('Ensures that owners of npm packages are all members of the expo organization.')
    .asyncAction(action);
};

async function action(_options: ActionOptions) {
  if (!process.env.NPM_TOKEN_READ_ONLY) {
    throw new Error('Environment variable `NPM_TOKEN_READ_ONLY` is required for this command.');
  }

  logger.log('Fetching organization members...');
  const orgMembers = await getOrgMembersAsync();
  logger.log(`${orgMembers.length} members found: ${chalk.dim(orgMembers.join(', '))}\n`);

  logger.log('Fetching organization packages...');
  const packages = await getOrgPackagesAsync();
  logger.log(`${packages.length} packages found: ${chalk.dim(packages.join(', '))}\n`);

  logger.log('Validating package owners...');
  const packagesWithInvalidOwners = await validatePackageOwnersAsync(
    [...orgMembers, ...USERS_TO_SKIP],
    packages
  );
  logger.log('\n\n');

  if (Object.keys(packagesWithInvalidOwners).length === 0) {
    logger.log('✅ All packages have valid owners');
    process.exit(0);
  } else {
    logger.log('❌ Invalid owners found');
    printPackagesWithInvalidOwners(packagesWithInvalidOwners);
    printNpmOwnerRemoveCommands(packagesWithInvalidOwners);
    process.exit(1);
  }
}

async function getOrgMembersAsync() {
  const response = await fetch.json(`https://registry.npmjs.org/-/org/${ORG_NAME}/user`, {
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
    },
  });

  return Object.keys(response);
}

async function getOrgPackagesAsync() {
  const response = await fetch.json(
    `https://registry.npmjs.org/-/v1/search?text=scope:${ORG_NAME}&size=1000`,
    {
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
      },
    }
  );

  if (!response || typeof response !== 'object' || !Array.isArray(response.objects)) {
    throw new Error('Invalid response structure or data type: ${JSON.stringify(response)}');
  }

  return response.objects.map((pkg) => pkg.package.name);
}

async function getPackageOwnersAsync(packageName) {
  const response = await fetch.json(`https://registry.npmjs.org/${packageName}`, {
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
    },
  });

  if (!response || typeof response !== 'object' || !Array.isArray(response.maintainers)) {
    throw new Error('Invalid response structure or data type: ${JSON.stringify(response)}');
  }

  return response.maintainers.map((owner) => owner.name);
}

async function validatePackageOwnersAsync(orgMembers, packages) {
  const packagesWithInvalidOwners = {};

  for (const pkg of packages) {
    const owners = await getPackageOwnersAsync(pkg);
    for (const owner of owners) {
      if (!orgMembers.includes(owner)) {
        packagesWithInvalidOwners[pkg] = [...(packagesWithInvalidOwners[pkg] || []), owner];
      }
    }

    if (packagesWithInvalidOwners[pkg]) {
      process.stdout.write(chalk.dim('x'));
    } else {
      process.stdout.write(chalk.dim('.'));
    }
  }

  return packagesWithInvalidOwners;
}

/**
 * Print the packages with invalid owners and their owners to summarize the validation.
 */
function printPackagesWithInvalidOwners(packagesWithInvalidOwners) {
  for (const pkg of Object.keys(packagesWithInvalidOwners)) {
    logger.log(`- ${pkg}: ${packagesWithInvalidOwners[pkg].join(', ')}`);
  }
}

/**
 * Prints the commands to remove invalid owners. eg: `npm owner rm owner1 package1`
 * Only one owner can be removed at a time, so we need to print a command for each owner and package.
 */
function printNpmOwnerRemoveCommands(packagesWithInvalidOwners: { [key: string]: string[] }) {
  const npmOwnerRemoveCommands: string[] = [];

  for (const pkg of Object.keys(packagesWithInvalidOwners)) {
    for (const owner of packagesWithInvalidOwners[pkg]) {
      npmOwnerRemoveCommands.push(`npm owner rm ${owner} ${pkg}`);
    }
  }

  if (npmOwnerRemoveCommands.length) {
    logger.log('\n\nThe following commands can be used to remove invalid owners:');
    logger.log(npmOwnerRemoveCommands.join('\n'));
  }
}
