import { ExpoConfig, getConfig } from '@expo/config';
import chalk from 'chalk';
import wrapAnsi from 'wrap-ansi';

import { installAsync } from '../../../install/installAsync';
import * as Log from '../../../log';
import { CommandError } from '../../../utils/errors';
import { getMissingPackagesAsync, ResolvedPackage } from './getMissingPackages';

export async function ensureDependenciesAsync(
  projectRoot: string,
  {
    exp = getConfig(projectRoot).exp,
    requiredPackages,
    warningMessage,
    installMessage,
    disableMessage,
  }: {
    exp?: ExpoConfig;
    installMessage: string;
    warningMessage: string;
    disableMessage?: string;
    requiredPackages: ResolvedPackage[];
  }
): Promise<boolean> {
  const { missing } = await getMissingPackagesAsync(projectRoot, {
    sdkVersion: exp.sdkVersion,
    requiredPackages,
  });
  if (!missing.length) {
    return true;
  }

  // Inform the user about what is wrong, and is currently being fixed
  Log.log(installMessage, '\n');
  if (disableMessage) {
    Log.warn(warningMessage);
    Log.log(chalk.dim(disableMessage), '\n');
  } else {
    Log.warn(warningMessage, '\n');
  }

  // Format with version if available.
  const packages = missing.map(({ pkg, version }) => (version ? [pkg, version].join('@') : pkg));

  // Install packages with versions
  await installPackagesAsync(projectRoot, {
    packages,
  });

  // Verify that the packages were installed correctly
  const { missing: missingAfterInstall } = await getMissingPackagesAsync(projectRoot, {
    sdkVersion: exp.sdkVersion,
    requiredPackages,
  });
  if (!missingAfterInstall.length) {
    return true;
  }

  // When failed, inform the user how to install the packages manually
  const installCommand = createInstallCommand({ packages: missing });
  const readableMissingPackages = missing
    .map(({ pkg, version }) => (version ? [pkg, version].join('@') : pkg))
    .join(', ');

  const solution = chalk`Please install {bold ${readableMissingPackages}} by running:\n\n  {reset.bold ${installCommand}}\n\n`;

  // This prevents users from starting a misconfigured JS or TS project by default.
  throw new CommandError(wrapForTerminal(installMessage + solution + warningMessage + '\n'));
}

/**  Wrap long messages to fit smaller terminals. */
function wrapForTerminal(message: string): string {
  return wrapAnsi(message, process.stdout.columns || 80);
}

/** Create the bash install command from a given set of packages and settings. */
export function createInstallCommand({
  packages,
}: {
  packages: {
    file: string;
    pkg: string;
    version?: string | undefined;
  }[];
}) {
  return (
    'npx expo install ' +
    packages
      .map(({ pkg, version }) => {
        if (version) {
          return [pkg, version].join('@');
        }
        return pkg;
      })
      .join(' ')
  );
}

/** Install packages in the project. */
async function installPackagesAsync(projectRoot: string, { packages }: { packages: string[] }) {
  const readablePackages = chalk.bold(packages.join(', '));

  try {
    await installAsync(packages, { projectRoot });
  } catch (e: any) {
    Log.error(chalk`Failed to install {bold ${readablePackages}} because of: ${e.message}`);
    throw e;
  }
}
