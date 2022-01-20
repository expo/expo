import {
  AppJSONConfig,
  ExpoConfig,
  getConfig,
  getProjectConfigDescriptionWithPaths,
  ProjectConfig,
} from '@expo/config';
import * as PackageManager from '@expo/package-manager';
import chalk from 'chalk';
import program from 'commander';
import wrapAnsi from 'wrap-ansi';

import * as Log from '../../log';
import { EXPO_DEBUG, EXPO_NO_WEB_SETUP } from '../../utils/env';
import { CommandError } from '../../utils/errors';
import { logNewSection } from '../../utils/ora';
import { confirmAsync, pauseInteractions, resumeInteractions } from '../../utils/prompts';
import { getMissingPackagesAsync } from './getMissingPackages';

// Only check once per run.
let hasChecked = false;
let disabledReason = '';

export async function ensureWebSupportSetupAsync(
  projectRoot: string,
  { skipCache = false }: { skipCache?: boolean } = {}
): Promise<boolean> {
  if (!skipCache && hasChecked) {
    if (disabledReason) {
      Log.log(chalk.dim(disabledReason));
    }
    return false;
  }
  hasChecked = true;

  const result = await shouldSetupWebSupportAsync(projectRoot);

  if ('failureReason' in result) {
    disabledReason = result.failureReason;
    return ensureWebSupportSetupAsync(projectRoot);
  }

  // Ensure web packages are installed
  await ensureWebDependenciesInstalledAsync(projectRoot, { exp: result.exp });

  return true;
}

export function isWebPlatformExcluded(rootConfig: AppJSONConfig): boolean {
  // Detect if the 'web' string is purposefully missing from the platforms array.
  const isWebExcluded =
    Array.isArray(rootConfig.expo?.platforms) &&
    !!rootConfig.expo?.platforms.length &&
    !rootConfig.expo?.platforms.includes('web');
  return isWebExcluded;
}

export async function shouldSetupWebSupportAsync(
  projectRoot: string
): Promise<{ failureReason: string } | ProjectConfig> {
  if (EXPO_NO_WEB_SETUP) {
    return { failureReason: '\u203A Skipping web setup: EXPO_NO_WEB_SETUP is enabled.' };
  }

  const projectConfig = getConfig(projectRoot, { skipSDKVersionRequirement: true });

  // Detect if the 'web' string is purposefully missing from the platforms array.
  if (isWebPlatformExcluded(projectConfig.rootConfig)) {
    // Get exact config description with paths.
    const configName = getProjectConfigDescriptionWithPaths(projectRoot, projectConfig);
    return {
      failureReason: `\u203A Skipping web setup: ${chalk.bold`"web"`} is not included in the project ${configName} ${chalk.bold`"platforms"`} array.`,
    };
  }

  return projectConfig;
}

const requiredPackages = [
  // use react-native-web/package.json to skip node module cache issues when the user installs
  // the package and attempts to resolve the module in the same process.
  { file: 'react-native-web/package.json', pkg: 'react-native-web' },
  { file: 'react-dom/package.json', pkg: 'react-dom' },
];

async function ensureWebDependenciesInstalledAsync(
  projectRoot: string,
  {
    exp = getConfig(projectRoot, { skipSDKVersionRequirement: true }).exp,
    // Don't prompt in CI
    skipPrompt = program.nonInteractive,
  }: {
    exp?: ExpoConfig;
    skipPrompt?: boolean;
  } = {}
): Promise<boolean> {
  const { missing } = await getMissingPackagesAsync(projectRoot, { exp, requiredPackages });
  if (!missing.length) {
    return true;
  }

  // Prompt to install or bail out...
  const readableMissingPackages = missing.map((p) => p.pkg).join(', ');

  const isYarn = PackageManager.isUsingYarn(projectRoot);

  let title = `It looks like you're trying to use web support but don't have the required dependencies installed.`;

  if (skipPrompt) {
    title += '\n\n';
  } else {
    pauseInteractions();
    let confirm: boolean;
    try {
      confirm = await confirmAsync({
        message: wrapForTerminal(
          title + ` Would you like to install ${chalk.cyan(readableMissingPackages)}?`
        ),
        initial: true,
      });
    } finally {
      resumeInteractions();
    }

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
      return await ensureWebDependenciesInstalledAsync(projectRoot, {
        skipPrompt: true,
      });
    }

    // Reset the title so it doesn't print twice in interactive mode.
    title = '';
  }

  const installCommand = createInstallCommand({ isYarn, packages: missing });

  const disableMessage = `If you're not using web, please remove the ${chalk.bold(
    '"web"'
  )} string from the platforms array in the project Expo config.`;

  const solution = `Please install ${chalk.bold(
    readableMissingPackages
  )} by running:\n\n  ${chalk.reset.bold(installCommand)}\n\n`;

  // Reset the cached check so we can re-run the check if the user re-runs the command.
  hasChecked = false;
  // This prevents users from starting a misconfigured JS or TS project by default.
  throw new CommandError(wrapForTerminal(title + solution + disableMessage + '\n'));
}

// Wrap long messages to fit smaller terminals.
function wrapForTerminal(message: string): string {
  return wrapAnsi(message, process.stdout.columns || 80);
}

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

async function installPackagesAsync(
  projectRoot: string,
  { isYarn, packages }: { isYarn: boolean; packages: string[] }
) {
  const packageManager = PackageManager.createForProject(projectRoot, {
    yarn: isYarn,
    log: Log.log,
    silent: !EXPO_DEBUG,
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
