import { getConfig } from '@expo/config';
import * as PackageManager from '@expo/package-manager';
import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import wrapAnsi from 'wrap-ansi';

import { getReleasedVersionsAsync, SDKVersion } from '../../../api/getVersions';
import * as Log from '../../../log';
import { CI, EXPO_DEBUG, EXPO_NO_TYPESCRIPT_SETUP } from '../../../utils/env';
import { CommandError } from '../../../utils/errors';
import { logNewSection } from '../../../utils/ora';
import { profile } from '../../../utils/profile';
import { confirmAsync } from '../../../utils/prompts';
import {
  collectMissingPackages,
  hasTSConfig,
  queryFirstProjectTypeScriptFileAsync,
} from './resolveModules';
import { updateTSConfigAsync } from './updateTSConfig';

export async function ensureTypeScriptSetupAsync(projectRoot: string): Promise<void> {
  if (EXPO_NO_TYPESCRIPT_SETUP()) {
    Log.log(chalk.dim('\u203A Skipping TypeScript verification'));
    return;
  }

  const tsConfigPath = path.join(projectRoot, 'tsconfig.json');

  // Ensure the project is TypeScript before continuing.
  const intent = await shouldSetupTypeScriptAsync(projectRoot);
  if (!intent) {
    return;
  }

  // Ensure TypeScript packages are installed
  await ensureRequiredDependenciesAsync(
    projectRoot,
    // Don't prompt in CI
    CI
  );

  // Update the config
  await updateTSConfigAsync({ projectRoot, tsConfigPath, isBootstrapping: intent.isBootstrapping });
}

export async function shouldSetupTypeScriptAsync(
  projectRoot: string
): Promise<{ isBootstrapping: boolean } | null> {
  const tsConfigPath = await hasTSConfig(projectRoot);

  // Enable TS setup if the project has a `tsconfig.json`
  if (tsConfigPath) {
    const content = await fs.readFile(tsConfigPath, { encoding: 'utf8' }).then(
      (txt) => txt.trim(),
      () => null
    );
    const isBlankConfig = content === '' || content === '{}';
    return { isBootstrapping: isBlankConfig };
  }
  // This is a somewhat heavy check in larger projects.
  // Test that this is reasonably paced by running expo start in `expo/apps/native-component-list`
  const typescriptFile = await profile(queryFirstProjectTypeScriptFileAsync)(projectRoot);
  if (typescriptFile) {
    return { isBootstrapping: true };
  }

  return null;
}

async function getSDKVersionsAsync(projectRoot: string): Promise<SDKVersion | null> {
  try {
    const { exp } = getConfig(projectRoot, { skipSDKVersionRequirement: true });
    if (exp.sdkVersion) {
      const sdkVersions = await getReleasedVersionsAsync();
      return sdkVersions[exp.sdkVersion] ?? null;
    }
  } catch {
    // This is a convenience method and we should avoid making this halt the process.
  }
  return null;
}

async function ensureRequiredDependenciesAsync(
  projectRoot: string,
  skipPrompt: boolean = false
): Promise<string> {
  const { resolutions, missing } = collectMissingPackages(projectRoot);
  if (!missing.length) {
    return resolutions.typescript!;
  }

  // Ensure the versions are right for the SDK that the project is currently using.
  const versions = await getSDKVersionsAsync(projectRoot);
  if (versions?.relatedPackages) {
    for (const pkg of missing) {
      if (pkg.pkg in versions.relatedPackages) {
        pkg.version = versions.relatedPackages[pkg.pkg];
      }
    }
  }

  // Prompt to install or bail out...
  const readableMissingPackages = missing.map((p) => p.pkg).join(', ');

  const isYarn = PackageManager.isUsingYarn(projectRoot);

  let title = `It looks like you're trying to use TypeScript but don't have the required dependencies installed.`;

  if (!skipPrompt) {
    if (
      await confirmAsync({
        message: wrapAnsi(
          title + ` Would you like to install ${chalk.cyan(readableMissingPackages)}?`,
          // This message is a bit too long, so wrap it to fit smaller terminals
          process.stdout.columns || 80
        ),
        initial: true,
      })
    ) {
      await installPackagesAsync(projectRoot, {
        isYarn,
        devPackages: missing.map(({ pkg, version }) => {
          if (version) {
            return [pkg, version].join('@');
          }
          return pkg;
        }),
      });
      // Try again but skip prompting twice.
      return await ensureRequiredDependenciesAsync(projectRoot, true);
    }

    // Reset the title so it doesn't print twice in interactive mode.
    title = '';
  } else {
    title += '\n\n';
  }

  const col = process.stdout.columns || 80;

  const installCommand =
    (isYarn ? 'yarn add --dev' : 'npm install --save-dev') +
    ' ' +
    missing
      .map(({ pkg, version }) => {
        if (version) {
          return [pkg, version].join('@');
        }
        return pkg;
      })
      .join(' ');

  let disableMessage =
    "If you're not using TypeScript, please remove the TypeScript files from your project";

  if (await hasTSConfig(projectRoot)) {
    disableMessage += ` and delete the tsconfig.json.`;
  } else {
    disableMessage += '.';
  }

  const solution = `Please install ${chalk.bold(
    readableMissingPackages
  )} by running:\n\n  ${chalk.reset.bold(installCommand)}\n\n`;

  // This prevents users from starting a misconfigured JS or TS project by default.
  throw new CommandError(wrapAnsi(title + solution + disableMessage + '\n', col));
}

async function installPackagesAsync(
  projectRoot: string,
  { isYarn, devPackages }: { isYarn: boolean; devPackages: string[] }
) {
  const packageManager = PackageManager.createForProject(projectRoot, {
    yarn: isYarn,
    log: Log.log,
    silent: !EXPO_DEBUG,
  });

  const packagesStr = chalk.bold(devPackages.join(', '));
  Log.log();
  const installingPackageStep = logNewSection(`Installing ${packagesStr}`);
  try {
    await packageManager.addDevAsync(...devPackages);
  } catch (e) {
    installingPackageStep.fail(`Failed to install ${packagesStr} with error: ${e.message}`);
    throw e;
  }
  installingPackageStep.succeed(`Installed ${packagesStr}`);
}
