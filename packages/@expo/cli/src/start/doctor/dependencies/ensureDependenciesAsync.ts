import { ExpoConfig, getConfig } from '@expo/config';
import * as PackageManager from '@expo/package-manager';
import chalk from 'chalk';
import wrapAnsi from 'wrap-ansi';

import * as Log from '../../../log';
import { env } from '../../../utils/env';
import { CommandError } from '../../../utils/errors';
import { logNewSection } from '../../../utils/ora';
import { confirmAsync } from '../../../utils/prompts';
import { getMissingPackagesAsync, ResolvedPackage } from './getMissingPackages';

export async function ensureDependenciesAsync(
  projectRoot: string,
  {
    exp = getConfig(projectRoot).exp,
    requiredPackages,
    warningMessage,
    installMessage,
    // Don't prompt in CI
    skipPrompt = env.CI,
  }: {
    exp?: ExpoConfig;
    installMessage: string;
    warningMessage: string;
    requiredPackages: ResolvedPackage[];
    skipPrompt?: boolean;
  }
): Promise<boolean> {
  const { missing } = await getMissingPackagesAsync(projectRoot, {
    sdkVersion: exp.sdkVersion,
    requiredPackages,
  });
  if (!missing.length) {
    return true;
  }

  // Prompt to install or bail out...
  const readableMissingPackages = missing
    .map(({ pkg, version }) => (version ? [pkg, version].join('@') : pkg))
    .join(', ');

  const isYarn = PackageManager.isUsingYarn(projectRoot);

  let title = installMessage;

  if (skipPrompt) {
    title += '\n\n';
  } else {
    const confirm = await confirmAsync({
      message: wrapForTerminal(
        title + ` Would you like to install ${chalk.cyan(readableMissingPackages)}?`
      ),
      initial: true,
    });

    if (confirm) {
      // Format with version if available.
      const packages = missing.map(({ pkg, version }) =>
        version ? [pkg, version].join('@') : pkg
      );
      // Install packages with versions
      await installPackagesAsync(projectRoot, {
        isYarn,
        packages,
      });
      // Try again but skip prompting twice, simply fail if the packages didn't install correctly.
      return await ensureDependenciesAsync(projectRoot, {
        skipPrompt: true,
        installMessage,
        warningMessage,
        requiredPackages,
      });
    }

    // Reset the title so it doesn't print twice in interactive mode.
    title = '';
  }

  const installCommand = createInstallCommand({ isYarn, packages: missing });

  const disableMessage = warningMessage;

  const solution = `Please install ${chalk.bold(
    readableMissingPackages
  )} by running:\n\n  ${chalk.reset.bold(installCommand)}\n\n`;

  // This prevents users from starting a misconfigured JS or TS project by default.
  throw new CommandError(wrapForTerminal(title + solution + disableMessage + '\n'));
}

/**  Wrap long messages to fit smaller terminals. */
function wrapForTerminal(message: string): string {
  return wrapAnsi(message, process.stdout.columns || 80);
}

/** Create the bash install command from a given set of packages and settings. */
export function createInstallCommand({
  isYarn,
  packages,
}: {
  isYarn: boolean;
  packages: {
    file: string;
    pkg: string;
    version?: string | undefined;
  }[];
}) {
  return (
    (isYarn ? 'yarn add' : 'npm install') +
    ' ' +
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
async function installPackagesAsync(
  projectRoot: string,
  { isYarn, packages }: { isYarn: boolean; packages: string[] }
) {
  const packageManager = PackageManager.createForProject(projectRoot, {
    yarn: isYarn,
    log: Log.log,
    silent: !env.EXPO_DEBUG,
  });

  const packagesStr = chalk.bold(packages.join(', '));
  Log.log();
  const installingPackageStep = logNewSection(`Installing ${packagesStr}`);
  try {
    await packageManager.addAsync(...packages);
  } catch (e: any) {
    installingPackageStep.fail(`Failed to install ${packagesStr} with error: ${e.message}`);
    throw e;
  }
  installingPackageStep.succeed(`Installed ${packagesStr}`);
}
