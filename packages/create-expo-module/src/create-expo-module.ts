import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';
import { Command, Option } from 'commander';
import fs from 'node:fs';
import path from 'node:path';
import prompts from 'prompts';
import validateNpmPackage from 'validate-npm-package-name';

import { addPlatformSupport } from './addPlatformSupport';
import { ensureSafeModuleName } from './appleFrameworks';
import { createExampleApp } from './createExampleApp';
import { ALL_FEATURES, resolveFeatures } from './features';
import {
  PACKAGE_MANAGERS,
  installDependencies,
  formatRunCommand,
  resolvePackageManager,
  type PackageManagerName,
} from './packageManager';
import {
  ALL_PLATFORMS,
  getFeaturesPrompt,
  getLocalFolderNamePrompt,
  getPackageManagerPrompt,
  getLocalSubstitutionDataPrompts,
  getPlatformPrompt,
  getSlugPrompt,
  getSubstitutionDataPrompts,
  type Platform,
} from './prompts';
import { copyFileSnippets } from './snippets';
import { eventCreateExpoModule, getTelemetryClient, logEventAsync } from './telemetry';
import {
  buildAugmentedData,
  copyTemplateFiles,
  downloadPackageAsync,
  handleSuffix,
  slugToAndroidPackage,
} from './templateUtils';
import type { CommandOptions, Feature, LocalSubstitutionData, SubstitutionData } from './types';
import { buildDefaultsWarning } from './utils/defaults';
import { isInteractive } from './utils/env';
import { findGitHubEmail, findMyName } from './utils/git';
import { findGitHubUserFromEmail, guessRepoUrl } from './utils/github';
import { newStep } from './utils/ora';

const debug = require('debug')('create-expo-module:main') as typeof console.log;
const packageJson = require('../package.json');

// `yarn run` may change the current working dir, then we should use `INIT_CWD` env.
const CWD = process.env.INIT_CWD || process.cwd();

// Url to the documentation on Expo Modules
const DOCS_URL = 'https://docs.expo.dev/modules';

const FYI_LOCAL_DIR = 'https://expo.fyi/expo-module-local-autolinking.md';

/**
 * Converts a slug to a native module name (PascalCase).
 */
function slugToModuleName(slug: string): string {
  return slug
    .replace(/^@/, '')
    .replace(/^./, (match) => match.toUpperCase())
    .replace(/\W+(\w)/g, (_, p1) => p1.toUpperCase());
}

/**
 * Resolves the target directory for a new local module given the project's `package.json` path.
 * Respects `expo.autolinking.nativeModulesDir` when present; falls back to `modules/`.
 * @internal Exported for testing.
 */
export function resolveLocalModuleDir(packageJsonPath: string, targetOrSlug: string): string {
  let packageJson: any = {};
  try {
    const fileContent = fs.readFileSync(packageJsonPath, 'utf8');
    packageJson = JSON.parse(fileContent);
  } catch {
    console.log(
      chalk.yellow(
        `⚠️ Could not parse package.json at ${packageJsonPath}. Using the \`modules\` directory in the root of the project as the module location.`
      )
    );
  }

  const { expo } = packageJson;
  const projectRoot = path.dirname(packageJsonPath);
  const nativeModulesDir = expo?.autolinking?.nativeModulesDir;

  if (nativeModulesDir) {
    return path.resolve(projectRoot, nativeModulesDir, targetOrSlug);
  }

  return path.join(projectRoot, 'modules', targetOrSlug);
}

async function getCorrectLocalDirectory(targetOrSlug: string) {
  let packageJsonPath: string | null = null;
  for (let dir = CWD; path.dirname(dir) !== dir; dir = path.dirname(dir)) {
    const file = path.resolve(dir, 'package.json');
    if (fs.existsSync(file)) {
      packageJsonPath = file;
      break;
    }
  }
  if (!packageJsonPath) {
    console.log(
      chalk.red.bold(
        '⚠️ This command should be run inside your Expo project when run with the --local flag.'
      )
    );
    console.log(
      chalk.red(
        'For native modules to autolink correctly, you need to place them in the directory specified in `expo.autolinking.nativeModulesDir` field in `package.json` which defaults to `modules` directory in the root of the project when unspecified.'
      )
    );
    return null;
  }

  return resolveLocalModuleDir(packageJsonPath, targetOrSlug);
}

/**
 * Reads `app.json` from the nearest project root (found by walking up from CWD)
 * and returns the `expo.platforms` list mapped to module platform names (`ios` → `apple`).
 * Returns `null` when `app.json` is absent or has no `expo.platforms` field.
 */
async function getLocalAppJsonPlatforms(): Promise<Platform[] | null> {
  let root: string | null = null;
  for (let dir = CWD; path.dirname(dir) !== dir; dir = path.dirname(dir)) {
    if (fs.existsSync(path.resolve(dir, 'package.json'))) {
      root = dir;
      break;
    }
  }
  if (!root) {
    return null;
  }
  const appJsonPath = path.resolve(root, 'app.json');
  if (!fs.existsSync(appJsonPath)) {
    return null;
  }
  try {
    const content = await fs.promises.readFile(appJsonPath, 'utf8');
    const appJson = JSON.parse(content);
    const raw: string[] | undefined = appJson?.expo?.platforms;
    if (!Array.isArray(raw) || raw.length === 0) {
      return null;
    }
    // app.json uses 'ios', expo-module.config.json uses 'apple'
    const platformMap: Record<string, string> = { ios: 'apple', android: 'android', web: 'web' };
    const mapped = raw
      .map((p) => platformMap[p] ?? p)
      .filter((p): p is Platform => (ALL_PLATFORMS as readonly string[]).includes(p));
    return mapped.length > 0 ? mapped : null;
  } catch {
    debug('Failed to read or parse app.json for platform defaults');
    return null;
  }
}

/**
 * Determines the target platforms for the module.
 *
 * Priority:
 *   1. `--platform` CLI flag
 *   2. Non-interactive mode → all platforms
 *   3. Interactive + local module → pre-select from app.json, then prompt
 *   4. Interactive + non-local → prompt with all platforms pre-selected
 */
async function resolvePlatformsAsync(
  isLocal: boolean,
  interactive: boolean,
  options: CommandOptions
): Promise<Platform[]> {
  if (options.platform && options.platform.length > 0) {
    const valid = options.platform.filter((p): p is Platform =>
      (ALL_PLATFORMS as readonly string[]).includes(p)
    );
    const invalid = options.platform.filter(
      (p) => !(ALL_PLATFORMS as readonly string[]).includes(p)
    );
    if (invalid.length > 0) {
      console.warn(
        chalk.yellow(
          `⚠️  Unknown platform(s) ignored: ${invalid.join(', ')}. Valid values: ${ALL_PLATFORMS.join(', ')}`
        )
      );
    }
    if (valid.length === 0) {
      console.warn(chalk.yellow(`⚠️  No valid platforms specified. Defaulting to all platforms.`));
      return [...ALL_PLATFORMS];
    }
    return valid;
  }

  if (!interactive) {
    return [...ALL_PLATFORMS];
  }

  const appJsonPlatforms = isLocal ? await getLocalAppJsonPlatforms() : null;
  const preSelected: readonly string[] = appJsonPlatforms ?? ALL_PLATFORMS;

  if (appJsonPlatforms) {
    debug(`Using app.json platforms as defaults: ${appJsonPlatforms.join(', ')}`);
  }

  const { platforms } = await prompts(getPlatformPrompt(preSelected), {
    onCancel: () => process.exit(0),
  });

  return platforms as Platform[];
}

export { resolveFeatures };

function warnIfViewAutoIncluded(rawFeatures: Feature[]): void {
  if (rawFeatures.includes('ViewEvent') && !rawFeatures.includes('View')) {
    console.log(chalk.yellow('⚠️  ViewEvent requires View — adding View automatically.'));
  }
}

/**
 * Priority: --full-example flag → --features all → --features flag → interactive prompt → empty.
 */
async function resolveFeaturesAsync(
  interactive: boolean,
  options: CommandOptions
): Promise<Feature[]> {
  if (options.fullExample) {
    return resolveFeatures([], true);
  }

  if (options.features && options.features.length > 0) {
    if (options.features.includes('all' as Feature)) {
      return resolveFeatures([], true);
    }
    const rawFeatures = options.features;
    warnIfViewAutoIncluded(rawFeatures);
    return resolveFeatures(rawFeatures);
  }

  if (!interactive) {
    return [];
  }

  const { features } = await prompts(getFeaturesPrompt(), {
    onCancel: () => process.exit(0),
  });
  const rawFeatures: Feature[] = features ?? [];
  warnIfViewAutoIncluded(rawFeatures);
  return resolveFeatures(rawFeatures);
}

/**
 * Returns a safe, capitalized module name and logs a warning if it was renamed
 * to avoid conflicting with an Apple framework.
 */
function resolveModuleName(rawName: string): string {
  const { name: safeName, wasRenamed } = ensureSafeModuleName(rawName);
  const name = safeName.charAt(0).toUpperCase() + safeName.slice(1);
  if (wasRenamed) {
    console.log();
    console.log(
      chalk.yellow(
        `⚠️  Module name "${rawName}" conflicts with an Apple framework. Renamed to "${name}" to avoid build errors.`
      )
    );
  }
  return name;
}

/**
 * The main function of the command.
 *
 * @param target Path to the directory where to create the module. Defaults to current working dir.
 * @param options An options object for `commander`.
 */
async function main(target: string | undefined, options: CommandOptions) {
  const interactive = isInteractive();
  if (!interactive) {
    debug('Running in non-interactive mode');
  }

  const slug = await askForPackageSlugAsync(target, options.local, options);
  const targetDir = options.local
    ? await getCorrectLocalDirectory(target || slug)
    : path.join(CWD, target || slug);

  if (!targetDir) {
    return;
  }

  const relativePath = path.relative(CWD, targetDir);

  if (options.local) {
    console.log();
    console.log(
      `${chalk.gray('The local module will be created in ')}${chalk.gray.bold.italic(
        relativePath
      )} ${chalk.gray('directory. Learn more: ')}${chalk.gray.bold(FYI_LOCAL_DIR)}`
    );
    console.log();
  }

  await fs.promises.mkdir(targetDir, { recursive: true });
  await confirmTargetDirAsync(targetDir, options);

  options.target = targetDir;

  const data = await askForSubstitutionDataAsync(slug, options.local, options);
  const packageManager = await resolvePackageManagerAsync(interactive, options.local, options);

  // Make one line break between prompts and progress logs
  console.log();

  const packagePath = options.source
    ? path.resolve(CWD, options.source)
    : await downloadPackageAsync(targetDir, options.local);

  await logEventAsync(eventCreateExpoModule(packageManager, options));

  await newStep('Creating the module from template files', async (step) => {
    await createModuleFromTemplate(packagePath, targetDir, data);
    step.succeed('Created the module from template files');
  });
  if (options.local && options.barrel) {
    await newStep('Generating barrel file', async (step) => {
      await generateBarrelFileAsync(targetDir, data as LocalSubstitutionData);
      step.succeed('Generated barrel file (index.ts)');
    });
  } else if (!options.local && options.barrel) {
    console.warn(
      chalk.yellow(
        'Warning: The --barrel flag only applies to local modules (--local). It will be ignored.'
      )
    );
  }
  if (!options.local) {
    await newStep('Installing module dependencies', async (step) => {
      await installDependencies(packageManager, targetDir);
      step.succeed('Installed module dependencies');
    });
    await newStep('Compiling TypeScript files', async (step) => {
      await spawnAsync(packageManager, ['run', 'build'], {
        cwd: targetDir,
        stdio: 'ignore',
      });
      step.succeed('Compiled TypeScript files');
    });
  }

  if (!options.source) {
    // Files in the downloaded tarball are wrapped in `package` dir.
    // We should remove it after all.
    await fs.promises.rm(packagePath, { recursive: true, force: true });
  }
  if (!options.local && data.type !== 'local') {
    if (!options.withReadme) {
      await fs.promises.rm(path.join(targetDir, 'README.md'), { force: true });
    }
    if (!options.withChangelog) {
      await fs.promises.rm(path.join(targetDir, 'CHANGELOG.md'), { force: true });
    }
    if (options.example) {
      // Create "example" folder
      await createExampleApp(data, targetDir, packageManager);
    }

    await newStep('Creating an empty Git repository', async (step) => {
      try {
        const result = await createGitRepositoryAsync(targetDir);
        if (result) {
          step.succeed('Created an empty Git repository');
        } else if (result === null) {
          step.succeed('Skipped creating an empty Git repository, already within a Git repository');
        } else if (result === false) {
          step.warn(
            'Could not create an empty Git repository, see debug logs with EXPO_DEBUG=true'
          );
        }
      } catch (error: any) {
        step.fail(error.toString());
      }
    });
  }

  console.log();
  if (options.local) {
    console.log(`✅ Successfully created Expo module in ${chalk.bold.italic(relativePath)}`);
    const importPath = relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
    printFurtherLocalInstructions(
      data.project.moduleName,
      data.project.viewName,
      data.project.name,
      options.barrel,
      importPath
    );
  } else {
    console.log('✅ Successfully created Expo module');
    printFurtherInstructions(targetDir, packageManager, options.example);
  }
}

async function resolvePackageManagerAsync(
  interactive: boolean,
  isLocal: boolean,
  options: CommandOptions
): Promise<PackageManagerName> {
  const defaultPackageManager = resolvePackageManager();

  if (options.packageManager) {
    return options.packageManager;
  }

  if (!interactive || isLocal) {
    return defaultPackageManager;
  }

  const { packageManager } = await prompts(getPackageManagerPrompt(defaultPackageManager), {
    onCancel: () => process.exit(0),
  });

  return packageManager ?? defaultPackageManager;
}

/**
 * Creates the module based on the `ejs` template (e.g. `expo-module-template` package).
 */
async function createModuleFromTemplate(
  templatePath: string,
  targetPath: string,
  data: SubstitutionData | LocalSubstitutionData
) {
  const snippetsDir = path.join(templatePath, 'snippets');
  const augmentedData = await buildAugmentedData(snippetsDir, data);
  await copyTemplateFiles(templatePath, targetPath, augmentedData, {
    platforms: data.project.platforms,
    platformsOnly: false,
    moduleType: data.type,
  });
  await copyFileSnippets(snippetsDir, data.project.features, data, targetPath);
}

async function createGitRepositoryAsync(targetDir: string) {
  // Check if we are inside a git repository already
  try {
    await spawnAsync('git', ['rev-parse', '--is-inside-work-tree'], {
      stdio: 'ignore',
      cwd: targetDir,
    });
    debug(chalk.dim('New project is already inside of a Git repository, skipping `git init`.'));
    return null;
  } catch (e: any) {
    if (e.errno === 'ENOENT') {
      debug(chalk.dim('Unable to initialize Git repo. `git` not in $PATH.'));
      return false;
    }
  }

  // Create a new git repository
  await spawnAsync('git', ['init'], { stdio: 'ignore', cwd: targetDir });
  await spawnAsync('git', ['add', '-A'], { stdio: 'ignore', cwd: targetDir });

  const commitMsg = `Initial commit\n\nGenerated by ${packageJson.name} ${packageJson.version}.`;
  await spawnAsync('git', ['commit', '-m', commitMsg], {
    stdio: 'ignore',
    cwd: targetDir,
  });

  debug(chalk.dim('Initialized a Git repository.'));
  return true;
}

/**
 * Asks the user for the package slug (npm package name).
 * In non-interactive mode, uses the target path or 'my-module' as default.
 */
async function askForPackageSlugAsync(
  customTargetPath: string | undefined,
  isLocal: boolean,
  options: CommandOptions
): Promise<string> {
  const interactive = isInteractive();

  // In non-interactive mode, derive slug from target path or use default
  if (!interactive) {
    const targetBasename = customTargetPath && path.basename(customTargetPath);
    const slug =
      targetBasename && validateNpmPackage(targetBasename).validForNewPackages
        ? targetBasename
        : 'my-module';
    debug(`Non-interactive mode: using slug "${slug}"`);
    return slug;
  }

  const { slug } = await prompts(
    (isLocal ? getLocalFolderNamePrompt : getSlugPrompt)(customTargetPath),
    {
      onCancel: () => process.exit(0),
    }
  );
  return slug;
}

/**
 * Asks the user for some data necessary to render the template.
 * Some values may already be provided by command options, the prompt is skipped in that case.
 * In non-interactive mode, uses defaults or CLI-provided values.
 */
async function askForSubstitutionDataAsync(
  slug: string,
  isLocal: boolean,
  options: CommandOptions
): Promise<SubstitutionData | LocalSubstitutionData> {
  const interactive = isInteractive();

  const platforms = await resolvePlatformsAsync(isLocal, interactive, options);
  const features = await resolveFeaturesAsync(interactive, options);

  if (!interactive) {
    return getSubstitutionDataFromOptions(slug, isLocal, options, platforms, features);
  }

  // Interactive mode: prompt for values, but skip prompts for CLI-provided values
  const promptQueries = await (
    isLocal ? getLocalSubstitutionDataPrompts : getSubstitutionDataPrompts
  )(slug);

  // Filter out prompts for values already provided via CLI
  const filteredPrompts = promptQueries.filter((prompt) => {
    const name = prompt.name as string;
    const cliValue = getCliValueForPrompt(name, options);
    return cliValue === undefined;
  });

  // Stop the process when the user cancels/exits the prompt.
  const onCancel = () => {
    process.exit(0);
  };

  // Get values from prompts
  const promptedValues =
    filteredPrompts.length > 0 ? await prompts(filteredPrompts, { onCancel }) : {};

  // Merge CLI-provided values with prompted values
  const rawName = options.name ?? promptedValues.name ?? slugToModuleName(slug);
  const name = resolveModuleName(rawName);
  const projectPackage = options.package ?? promptedValues.package ?? slugToAndroidPackage(slug);

  if (isLocal) {
    return {
      project: {
        slug,
        name,
        package: projectPackage,
        moduleName: handleSuffix(name, 'Module'),
        viewName: handleSuffix(name, 'View'),
        sharedObjectName: handleSuffix(name, 'Module') + 'SharedObject',
        platforms,
        features,
      },
      type: 'local',
    };
  }

  const description = options.description ?? promptedValues.description ?? 'My new module';
  const authorName = options.authorName ?? promptedValues.authorName ?? (await findMyName()) ?? '';
  const authorEmail =
    options.authorEmail ?? promptedValues.authorEmail ?? (await findGitHubEmail()) ?? '';
  const authorUrl =
    options.authorUrl ??
    promptedValues.authorUrl ??
    (authorEmail ? ((await findGitHubUserFromEmail(authorEmail)) ?? '') : '');
  const repo = options.repo ?? promptedValues.repo ?? (await guessRepoUrl(authorUrl, slug)) ?? '';
  const license = options.license ?? promptedValues.license ?? 'MIT';
  const version = options.moduleVersion ?? promptedValues.version ?? '0.1.0';

  return {
    project: {
      slug,
      name,
      version,
      description,
      package: projectPackage,
      moduleName: handleSuffix(name, 'Module'),
      viewName: handleSuffix(name, 'View'),
      sharedObjectName: handleSuffix(name, 'Module') + 'SharedObject',
      platforms,
      features,
    },
    author: `${authorName} <${authorEmail}> (${authorUrl})`,
    license,
    repo,
    type: 'standalone',
  };
}

/**
 * Gets the CLI value for a given prompt name.
 */
function getCliValueForPrompt(promptName: string, options: CommandOptions): string | undefined {
  switch (promptName) {
    case 'name':
      return options.name;
    case 'description':
      return options.description;
    case 'package':
      return options.package;
    case 'authorName':
      return options.authorName;
    case 'authorEmail':
      return options.authorEmail;
    case 'authorUrl':
      return options.authorUrl;
    case 'repo':
      return options.repo;
    case 'license':
      return options.license;
    case 'version':
      return options.moduleVersion;
    default:
      return undefined;
  }
}

/**
 * Gets substitution data from CLI options and defaults (for non-interactive mode).
 */
async function getSubstitutionDataFromOptions(
  slug: string,
  isLocal: boolean,
  options: CommandOptions,
  platforms: Platform[],
  features: Feature[]
): Promise<SubstitutionData | LocalSubstitutionData> {
  const defaults: { field: string; value: string }[] = [];

  const rawName = options.name ?? slugToModuleName(slug);
  const name = resolveModuleName(rawName);
  if (options.name === undefined) defaults.push({ field: 'name', value: name });

  const projectPackage = options.package ?? slugToAndroidPackage(slug);
  if (options.package === undefined) defaults.push({ field: 'package', value: projectPackage });

  debug(`Non-interactive mode: name="${name}", package="${projectPackage}"`);

  if (isLocal) {
    const warning = buildDefaultsWarning(defaults);
    if (warning) process.stderr.write(chalk.yellow(warning) + '\n');

    return {
      project: {
        slug,
        name,
        package: projectPackage,
        moduleName: handleSuffix(name, 'Module'),
        viewName: handleSuffix(name, 'View'),
        sharedObjectName: handleSuffix(name, 'Module') + 'SharedObject',
        platforms,
        features,
      },
      type: 'local',
    };
  }

  const description = options.description ?? 'My new module';
  const authorName = options.authorName ?? (await findMyName()) ?? '';
  const authorEmail = options.authorEmail ?? (await findGitHubEmail()) ?? '';
  const authorUrl =
    options.authorUrl ?? (authorEmail ? ((await findGitHubUserFromEmail(authorEmail)) ?? '') : '');
  const repo = options.repo ?? (await guessRepoUrl(authorUrl, slug)) ?? '';
  const license = options.license ?? 'MIT';
  const version = options.moduleVersion ?? '0.1.0';

  if (options.description === undefined)
    defaults.push({ field: 'description', value: description });
  if (options.authorName === undefined) defaults.push({ field: 'authorName', value: authorName });
  if (options.authorEmail === undefined)
    defaults.push({ field: 'authorEmail', value: authorEmail });
  if (options.authorUrl === undefined) defaults.push({ field: 'authorUrl', value: authorUrl });
  if (options.repo === undefined) defaults.push({ field: 'repo', value: repo });
  if (options.license === undefined) defaults.push({ field: 'license', value: license });
  if (options.moduleVersion === undefined) defaults.push({ field: 'version', value: version });

  debug(
    `Non-interactive mode: description="${description}", authorName="${authorName}", authorEmail="${authorEmail}", authorUrl="${authorUrl}", repo="${repo}", license="${license}", version="${version}"`
  );

  const warning = buildDefaultsWarning(defaults);
  if (warning) {
    process.stderr.write(chalk.yellow(warning) + '\n');
  }

  return {
    project: {
      slug,
      name,
      version,
      description,
      package: projectPackage,
      moduleName: handleSuffix(name, 'Module'),
      viewName: handleSuffix(name, 'View'),
      sharedObjectName: handleSuffix(name, 'Module') + 'SharedObject',
      platforms,
      features,
    },
    author: `${authorName} <${authorEmail}> (${authorUrl})`,
    license,
    repo,
    type: 'standalone',
  };
}

/**
 * Checks whether the target directory is empty and if not, asks the user to confirm if he wants to continue.
 * In non-interactive mode, automatically continues (assumes intent to overwrite).
 */
async function confirmTargetDirAsync(targetDir: string, options: CommandOptions): Promise<void> {
  const files = await fs.promises.readdir(targetDir);
  if (files.length === 0) {
    return;
  }

  // In non-interactive mode, proceed automatically
  if (!isInteractive()) {
    debug(`Non-interactive mode: target directory "${targetDir}" is not empty, continuing anyway`);
    console.log(
      chalk.yellow(
        `Warning: Target directory ${chalk.magenta(targetDir)} is not empty, continuing anyway.`
      )
    );
    return;
  }

  const { shouldContinue } = await prompts(
    {
      type: 'confirm',
      name: 'shouldContinue',
      message: `The target directory ${chalk.magenta(
        targetDir
      )} is not empty, do you want to continue anyway?`,
      initial: true,
    },
    {
      onCancel: () => false,
    }
  );
  if (!shouldContinue) {
    process.exit(0);
  }
}

/**
 * Generates an `index.ts` barrel file that re-exports the module and view for local modules.
 */
async function generateBarrelFileAsync(
  targetPath: string,
  data: LocalSubstitutionData
): Promise<void> {
  const { moduleName, viewName, sharedObjectName, name, features } = data.project;
  const lines = [
    `// Re-export the native module. On web, it will be resolved to ${moduleName}.web.ts`,
    `// and on native platforms to ${moduleName}.ts`,
    `export { default } from './src/${moduleName}';`,
  ];
  if (features.includes('View')) {
    lines.push(`export { default as ${viewName} } from './src/${viewName}';`);
  }
  if (features.includes('SharedObject')) {
    lines.push(
      `export { create${sharedObjectName}, use${sharedObjectName} } from './src/${sharedObjectName}';`
    );
  }
  lines.push(`export * from './src/${name}.types';`, '');
  await fs.promises.writeFile(path.join(targetPath, 'index.ts'), lines.join('\n'), 'utf8');
}

/**
 * Prints how the user can follow up once the script finishes creating the module.
 */
function printFurtherInstructions(
  targetDir: string,
  packageManager: PackageManagerName,
  includesExample: boolean
) {
  if (includesExample) {
    const commands = [
      `cd ${path.relative(CWD, targetDir)}`,
      formatRunCommand(packageManager, 'open:ios'),
      formatRunCommand(packageManager, 'open:android'),
    ];

    console.log();
    console.log(
      'To start developing your module, navigate to the directory and open Android and iOS projects of the example app'
    );
    commands.forEach((command) => console.log(chalk.gray('>'), chalk.bold(command)));
    console.log();
  }
  console.log(`Learn more on Expo Modules APIs: ${chalk.blue.bold(DOCS_URL)}`);
}

function printFurtherLocalInstructions(
  moduleName: string,
  viewName: string,
  name: string,
  barrel: boolean,
  relativePath: string
) {
  console.log();
  console.log(`You can now import this module inside your application.`);
  console.log(`For example, you can add these lines to your App.tsx or App.js file:`);
  if (barrel) {
    console.log(chalk.gray.italic(`import ${moduleName}, { ${viewName} } from '${relativePath}';`));
  } else {
    console.log(
      chalk.gray.italic(`import ${moduleName} from '${relativePath}/src/${moduleName}';`)
    );
    console.log(
      chalk.gray.italic(`import { default as ${viewName} } from '${relativePath}/src/${viewName}';`)
    );
    console.log(chalk.gray.italic(`import type { } from '${relativePath}/src/${name}.types';`));
  }
  console.log();
  console.log(`Learn more on Expo Modules APIs: ${chalk.blue.bold(DOCS_URL)}`);
  console.log(
    chalk.yellow(
      `Remember to re-build your native app (for example, with ${chalk.bold('npx expo run')}) when you make changes to the module. Native code changes are not reloaded with Fast Refresh.`
    )
  );
}

const program = new Command();

program.enablePositionalOptions();

program
  .name(packageJson.name)
  .version(packageJson.version)
  .description(packageJson.description)
  .arguments('[path]')
  .option(
    '-s, --source <source_dir>',
    'Local path to the template. By default it downloads `expo-module-template` from NPM.'
  )
  .option('--with-readme', 'Whether to include README.md file.', false)
  .option('--with-changelog', 'Whether to include CHANGELOG.md file.', false)
  .option('--no-example', 'Whether to skip creating the example app.', false)
  .option(
    '--local',
    'Whether to create a local module in the current project, skipping installing node_modules and creating the example directory.',
    false
  )
  .option(
    '--barrel',
    'Whether to generate an index.ts barrel file for the local module. Only applies to local modules',
    false
  )
  // Module configuration options (skip prompts when provided)
  .option('--name <name>', 'Native module name (e.g., MyModule).')
  .option('--description <description>', 'Module description.')
  .option('--package <package>', 'Android package name (e.g., expo.modules.mymodule).')
  .option('--author-name <name>', 'Author name for package.json.')
  .option('--author-email <email>', 'Author email for package.json.')
  .option('--author-url <url>', "URL to the author's profile (e.g., GitHub profile).")
  .option('--repo <url>', 'URL of the repository.')
  .option('--license <license>', 'License identifier for package.json (e.g., MIT).')
  .option('--module-version <version>', 'Initial version for package.json (e.g., 0.1.0).')
  .option(
    '-p, --platform <platforms...>',
    `Target platforms for the module. Available values: ${ALL_PLATFORMS.join(', ')}.`
  )
  .option(
    '--features <features...>',
    `Feature examples to include in the module. Use "all" to include all features, or specify any of: ${ALL_FEATURES.join(', ')}.`
  )
  .option('--full-example', 'Include all available feature examples.', false)
  .addOption(
    new Option(
      '--package-manager <manager>',
      `Package manager to use. Available values: ${PACKAGE_MANAGERS.join(', ')}.`
    ).choices([...PACKAGE_MANAGERS])
  )
  .action(main);

program
  .command('add-platform-support [path]')
  .description(
    'Add platform support to an existing Expo module. ' +
      'For example, add Android to an iOS-only module. ' +
      'Run from the module root, or pass the path as the first argument.'
  )
  .option(
    '-p, --platform <platforms...>',
    `Platforms to add. Available values: ${ALL_PLATFORMS.join(', ')}.`
  )
  .option(
    '--features <features...>',
    `Override best-effort feature detection. Values: ${ALL_FEATURES.join(', ')}.`
  )
  .option(
    '-s, --source <source_dir>',
    'Local path to the template. By default it downloads `expo-module-template` from NPM.'
  )
  .action(addPlatformSupport);

program.hook('postAction', async () => {
  await getTelemetryClient().flush?.();
});

const isInProcessUnitTest =
  !!process.env.JEST_WORKER_ID && !process.argv[1]?.includes('create-expo-module');
if (!isInProcessUnitTest) {
  program.parse(process.argv);
}
