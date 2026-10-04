#!/usr/bin/env node
import type { SpawnResult } from '@expo/spawn-async';
import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

import type { ExamplesMetadata } from './Examples';
import {
  downloadAndExtractExampleAsync,
  ensureExampleExists,
  fetchMetadataAsync,
  promptExamplesAsync,
} from './Examples';
import * as Template from './Template';
import { configureWorkspacesAsync } from './configureWorkspaces';
import { generateAgentFiles } from './generateAgentFiles';
import { promptTemplateAsync } from './legacyTemplates';
import { Log } from './log';
import { applySdkVersionToTemplateAsync } from './promptSdkVersion';
import type { PackageManagerName } from './resolvePackageManager';
import {
  configurePackageManager,
  installDependenciesAsync,
  resolvePackageManager,
} from './resolvePackageManager';
import { assertFolderEmpty, assertValidName, resolveProjectRootAsync } from './resolveProjectRoot';
import {
  AnalyticsEventPhases,
  AnalyticsEventTypes,
  identify,
  initializeAnalyticsIdentityAsync,
  track,
} from './telemetry';
import { env } from './utils/env';
import { initGitRepoAsync } from './utils/git';
import { withSectionLog } from './utils/log';
import { resolveSetupAppleSpmScript } from './utils/swiftpm';

export type Options = {
  install: boolean;
  template?: string | true;
  example?: string | true;
  yes: boolean;
  agentsMd: boolean;
  /** Set up iOS with Swift Package Manager instead of CocoaPods (preview). */
  swiftpm?: boolean;
};

type Command = [command: string, ...args: string[]];

type SwiftPMSetupStep = {
  title: string;
  success: string;
  formatNextStep: (projectRoot: string) => string;
  /** Throws an error that tells the user how to proceed when the step cannot run in this project. */
  resolveCommand: (projectRoot: string) => Command;
};

// The command the template Podfile passes to `use_native_modules!`. Without it, React Native
// falls back to `@react-native-community/cli config`, which Expo templates do not install.
const AUTOLINKING_CONFIG_COMMAND = JSON.stringify([
  'node',
  '--no-warnings',
  '--eval',
  "require('expo/bin/autolinking')",
  'expo-modules-autolinking',
  'react-native-config',
  '--json',
  '--platform',
  'ios',
]);

const debug = require('debug')('expo:init:create') as typeof console.log;

async function resolveProjectRootArgAsync(
  inputPath: string,
  { yes }: Pick<Options, 'yes'>
): Promise<string> {
  if (!inputPath && yes) {
    const projectRoot = path.resolve(process.cwd());
    const folderName = path.basename(projectRoot);
    assertValidName(folderName);
    assertFolderEmpty(projectRoot, folderName);
    return projectRoot;
  } else {
    return await resolveProjectRootAsync(inputPath);
  }
}

export async function setupDependenciesAsync(
  projectRoot: string,
  props: Pick<Options, 'install' | 'swiftpm'>
) {
  const shouldInstall = props.install;
  const packageManager = resolvePackageManager();

  // For monorepo templates: normalize workspace-package dependency specs to
  // the chosen package manager's convention, and write a `pnpm-workspace.yaml`
  // when pnpm is the resolved manager. No-op for single-app templates.
  await configureWorkspacesAsync(projectRoot, packageManager);

  // Configure package manager, which is unrelated to installing or not
  await configureNodeDependenciesAsync(projectRoot, packageManager);

  // Install dependencies
  let podsInstalled: boolean = false;
  let nodeModulesInstalled: boolean = false;
  const hasIosDirectory = await fs.existsSync(path.join(projectRoot, 'ios'));
  const needsPodsInstalled = hasIosDirectory && !props.swiftpm;
  let pendingSwiftPMSteps = props.swiftpm ? getSwiftPMSetupSteps(hasIosDirectory) : [];
  if (shouldInstall) {
    nodeModulesInstalled = await installNodeDependenciesAsync(projectRoot, packageManager);
    if (needsPodsInstalled) {
      podsInstalled = await installCocoaPodsAsync(projectRoot);
    }
    // Both steps resolve from the project's node modules, and SwiftPM needs Xcode (macOS only).
    if (nodeModulesInstalled && process.platform === 'darwin') {
      pendingSwiftPMSteps = await runSwiftPMSetupAsync(projectRoot, pendingSwiftPMSteps);
    }
  }
  const cdPath = getChangeDirectoryPath(projectRoot);
  console.log();
  Template.logProjectReady({ cdPath, packageManager });
  // The install can also fail without stopping the command, so check the result and not the flag.
  if (!nodeModulesInstalled) {
    logNodeInstallWarning(cdPath, packageManager, needsPodsInstalled && !podsInstalled);
  }
  if (props.swiftpm) {
    logSwiftPMWarning(projectRoot, cdPath, pendingSwiftPMSteps);
  }
}

function getSwiftPMSetupSteps(hasIosDirectory: boolean): SwiftPMSetupStep[] {
  const setupArgs = [
    'add',
    '--deintegrate',
    '--yes',
    '--config-command',
    AUTOLINKING_CONFIG_COMMAND,
  ];
  const addSwiftPM: SwiftPMSetupStep = {
    title: 'Setting up Swift Package Manager for iOS',
    success: 'Set up Swift Package Manager for iOS.',
    formatNextStep(projectRoot) {
      const script = resolveSetupAppleSpmScript(projectRoot);
      const displayedScript = script
        ? path.relative(projectRoot, script).split(path.sep).join('/')
        : 'node_modules/react-native/scripts/setup-apple-spm.js';
      return formatShellCommand(['node', displayedScript, ...setupArgs]);
    },
    resolveCommand(projectRoot) {
      const script = resolveSetupAppleSpmScript(projectRoot);
      if (!script) {
        throw new Error(
          `Could not set up Swift Package Manager because this project's React Native version does not include react-native/scripts/setup-apple-spm.js. Swift Package Manager requires React Native 0.88 or later. Upgrade react-native and run the remaining steps below, or create the project without --swiftpm to use CocoaPods.`
        );
      }
      return [process.execPath, script, ...setupArgs];
    },
  };
  const prebuild: Command = ['npx', 'expo', 'prebuild', '--platform', 'ios', '--no-install'];
  const generateIosProject: SwiftPMSetupStep = {
    title: 'Generating the native iOS project',
    success: 'Generated the native iOS project.',
    formatNextStep: () => formatShellCommand(prebuild),
    resolveCommand: () => prebuild,
  };
  return hasIosDirectory ? [addSwiftPM] : [generateIosProject, addSwiftPM];
}

async function runSwiftPMSetupAsync(
  projectRoot: string,
  steps: SwiftPMSetupStep[]
): Promise<SwiftPMSetupStep[]> {
  for (const [index, step] of steps.entries()) {
    try {
      const [command, ...args] = step.resolveCommand(projectRoot);
      await withSectionLog(
        async () => {
          await spawnAsync(command, args, {
            cwd: projectRoot,
            stdio: env.EXPO_DEBUG ? 'inherit' : 'pipe',
          });
        },
        {
          pending: chalk.bold(`${step.title}.`),
          success: step.success,
          error: () =>
            `${step.title} failed. Continuing to create the app, you can run the remaining steps afterwards.`,
        }
      );
    } catch (error) {
      debug(`Error in step "${step.title}": %O`, error);
      const { stderr } = error as Partial<SpawnResult>;
      Log.error(stderr || chalk.red((error as Error).message));
      return steps.slice(index);
    }
  }
  return [];
}

function formatShellCommand(argv: string[]): string {
  return argv
    .map((arg) => (/^[\w@%+=:,./-]+$/.test(arg) ? arg : `'${arg.replace(/'/g, `'\\''`)}'`))
    .join(' ');
}

export async function createAsync(inputPath: string, options: Options): Promise<void> {
  if (options.example && options.template) {
    throw new Error('Cannot use both --example and --template');
  }

  if (options.example) {
    return await createExampleAsync(inputPath, options);
  }

  return await createTemplateAsync(inputPath, options);
}

async function createTemplateAsync(inputPath: string, props: Options): Promise<void> {
  let resolvedTemplate: string | null = null;
  // @ts-ignore: This guards against someone passing --template without a name after it.
  if (props.template === true) {
    resolvedTemplate = await promptTemplateAsync();
  } else {
    resolvedTemplate = props.template ?? null;
  }

  const projectRoot = await resolveProjectRootArgAsync(inputPath, props);

  resolvedTemplate = await applySdkVersionToTemplateAsync(
    resolvedTemplate ?? 'expo-template-default',
    {
      yes: props.yes,
      showAlternatives: !props.template,
      projectName: path.basename(projectRoot),
    }
  );

  await fs.promises.mkdir(projectRoot, { recursive: true });

  // Setup telemetry attempt after a reasonable point.
  // Telemetry is used to ensure safe feature deprecation since the command is unversioned.
  // All telemetry can be disabled across Expo tooling by using the env var $EXPO_NO_TELEMETRY.
  await initializeAnalyticsIdentityAsync();
  identify();
  track({
    event: AnalyticsEventTypes.CREATE_EXPO_APP,
    properties: { phase: AnalyticsEventPhases.ATTEMPT, template: resolvedTemplate },
  });

  await withSectionLog(
    async () => {
      await Template.extractAndPrepareTemplateAppAsync(projectRoot, {
        npmPackage: resolvedTemplate,
      });
    },
    {
      pending: chalk.bold('Locating project files.'),
      success: 'Downloaded and extracted project files.',
      error: (error) =>
        `Something went wrong in downloading and extracting the project files: ${error.message}`,
    }
  );

  await setupDependenciesAsync(projectRoot, props);

  if (props.agentsMd) {
    await generateAgentFiles(projectRoot);
  }

  // for now, we will just init a git repo if they have git installed and the
  // project is not inside an existing git tree, and do it silently. we should
  // at some point check if git is installed and actually bail out if not, because
  // npm install will fail with a confusing error if so.
  try {
    // check if git is installed
    // check if inside git repo
    await initGitRepoAsync(projectRoot);
  } catch (error) {
    debug(`Error initializing git: %O`, error);
    // todo: check if git is installed, bail out
  }
}

async function createExampleAsync(inputPath: string, props: Options): Promise<void> {
  let resolvedExample = '';
  if (props.example === true) {
    resolvedExample = await promptExamplesAsync();
  } else if (props.example) {
    resolvedExample = props.example;
  }

  // Handle remapping aliases and throwing for deprecated examples. If we are
  // unable to fetch metadata, for any reason, just proceed without it. This protects
  // against a broken metadata endpoint from bringing down the entire command.
  let metadata: ExamplesMetadata | null = null;
  try {
    metadata = await fetchMetadataAsync();

    if (!metadata || !metadata.aliases || !metadata.deprecated) {
      throw new Error('No metadata found.');
    }
  } catch (error: any) {
    debug(`Error fetching metadata: %O`, error);
    Log.error(`Error fetching metadata, proceeding without alias or deprecation data.`);
  }

  if (metadata && metadata.aliases[resolvedExample]) {
    const alias = metadata.aliases[resolvedExample];
    const destination = typeof alias === 'string' ? alias : alias?.destination;

    if (destination != null) {
      console.log(
        chalk`{gray The {cyan ${resolvedExample}} example has been renamed to {cyan ${destination}}.}`
      );

      resolvedExample = destination;
    }

    // Optional message to show when an example is aliased, in case additional context is required
    if (typeof alias === 'object' && alias.message) {
      console.log(chalk`{gray ${alias.message}}`);
    }
  } else if (metadata && metadata.deprecated[resolvedExample]) {
    throw new Error(getDeprecatedExampleErrorMessage(resolvedExample, metadata));
  }

  // Ensure the example exists after performing remapping and deprecation checks.
  await ensureExampleExists(resolvedExample);

  const projectRoot = await resolveProjectRootArgAsync(inputPath, props);
  console.log(
    chalk`Creating {cyan ${path.basename(projectRoot)}} using the {cyan ${resolvedExample}} example.\n`
  );
  await fs.promises.mkdir(projectRoot, { recursive: true });

  // Setup telemetry attempt after a reasonable point.
  // Telemetry is used to ensure safe feature deprecation since the command is unversioned.
  // All telemetry can be disabled across Expo tooling by using the env var $EXPO_NO_TELEMETRY.
  await initializeAnalyticsIdentityAsync();
  identify();
  track({
    event: AnalyticsEventTypes.CREATE_EXPO_APP,
    properties: { phase: AnalyticsEventPhases.ATTEMPT, example: resolvedExample },
  });

  await withSectionLog(
    async () => {
      await downloadAndExtractExampleAsync(projectRoot, resolvedExample);
    },
    {
      pending: chalk.bold('Locating example files...'),
      success: 'Downloaded and extracted example files.',
      error: (error) =>
        `Something went wrong in downloading and extracting the example files: ${error.message}`,
    }
  );

  await setupDependenciesAsync(projectRoot, props);

  if (props.agentsMd) {
    await generateAgentFiles(projectRoot);
  }

  // for now, we will just init a git repo if they have git installed and the
  // project is not inside an existing git tree, and do it silently. we should
  // at some point check if git is installed and actually bail out if not, because
  // npm install will fail with a confusing error if so.
  try {
    // check if git is installed
    // check if inside git repo
    await initGitRepoAsync(projectRoot);
  } catch (error) {
    debug(`Error initializing git: %O`, error);
    // todo: check if git is installed, bail out
  }
}

function getChangeDirectoryPath(projectRoot: string): string {
  const cdPath = path.relative(process.cwd(), projectRoot);
  if (cdPath.length <= projectRoot.length) {
    return cdPath;
  }
  return projectRoot;
}

async function configureNodeDependenciesAsync(
  projectRoot: string,
  packageManager: PackageManagerName
): Promise<void> {
  try {
    await configurePackageManager(projectRoot, packageManager, { silent: false });
  } catch (error: any) {
    debug(`Error configuring package manager: %O`, error);
    Log.error(
      `Something went wrong configuring the package manager. Check your ${packageManager} logs. Continuing to create the app.`
    );
    Log.exception(error);
  }
}

/** Install the node modules. Returns `false` when the package manager failed. */
async function installNodeDependenciesAsync(
  projectRoot: string,
  packageManager: PackageManagerName
): Promise<boolean> {
  try {
    await installDependenciesAsync(projectRoot, packageManager, { silent: false });
    return true;
  } catch (error: any) {
    debug(`Error installing node modules: %O`, error);
    Log.error(
      `Something went wrong installing JavaScript dependencies. Check your ${packageManager} logs. Continuing to create the app.`
    );
    Log.exception(error);
    return false;
  }
}

async function installCocoaPodsAsync(projectRoot: string): Promise<boolean> {
  let podsInstalled = false;
  try {
    podsInstalled = await Template.installPodsAsync(projectRoot);
  } catch (error) {
    debug(`Error installing CocoaPods: %O`, error);
  }

  return podsInstalled;
}

export function logNodeInstallWarning(
  cdPath: string,
  packageManager: PackageManagerName,
  needsPods: boolean
): void {
  console.log(`\n⚠️  Before running your app, make sure you have modules installed:\n`);
  console.log(`  cd ${cdPath || '.'}${path.sep}`);
  console.log(`  ${packageManager} install`);
  if (needsPods && process.platform === 'darwin') {
    console.log(`  npx pod-install`);
  }
  console.log();
}

function logSwiftPMWarning(
  projectRoot: string,
  cdPath: string,
  pendingSteps: SwiftPMSetupStep[]
): void {
  console.log(
    `\n⚠️  This project uses Swift Package Manager for iOS instead of CocoaPods. This is a preview. Do not run \`pod install\` in this project.\n`
  );
  if (pendingSteps.length) {
    console.log(`To finish setting up iOS, run:\n`);
    console.log(`  cd ${cdPath || '.'}${path.sep}`);
    for (const step of pendingSteps) {
      console.log(`  ${step.formatNextStep(projectRoot)}`);
    }
    console.log();
  }
}

function getDeprecatedExampleErrorMessage(example: string, metadata: ExamplesMetadata) {
  const { message, outdatedExampleHref } = metadata.deprecated[example] ?? {};
  let output = `${example} is no longer available.`;

  if (message) {
    output += ` ${message}`;
  }

  if (outdatedExampleHref) {
    output += `\n\nYou can also refer to the outdated example code in examples git repository history, if it is useful: ${outdatedExampleHref}`;
  }

  return output;
}
