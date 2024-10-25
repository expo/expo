import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';
import { Command } from 'commander';
import downloadTarball from 'download-tarball';
import ejs from 'ejs';
import findUp from 'find-up';
import fs from 'fs-extra';
import { boolish } from 'getenv';
import path from 'path';
import prompts from 'prompts';

import { createExampleApp } from './createExampleApp';
import { installDependencies } from './packageManager';
import {
  getLocalFolderNamePrompt,
  getLocalSubstitutionDataPrompts,
  getSlugPrompt,
  getSubstitutionDataPrompts,
} from './prompts';
import {
  formatRunCommand,
  PackageManagerName,
  resolvePackageManager,
} from './resolvePackageManager';
import { eventCreateExpoModule, getTelemetryClient, logEventAsync } from './telemetry';
import { CommandOptions, LocalSubstitutionData, SubstitutionData } from './types';
import { newStep } from './utils/ora';

const debug = require('debug')('create-expo-module:main') as typeof console.log;
const packageJson = require('../package.json');

// Opt in to using beta versions
const EXPO_BETA = boolish('EXPO_BETA', false);

// `yarn run` may change the current working dir, then we should use `INIT_CWD` env.
const CWD = process.env.INIT_CWD || process.cwd();

// Ignore some paths. Especially `package.json` as it is rendered
// from `$package.json` file instead of the original one.
const IGNORES_PATHS = [
  '.DS_Store',
  'build',
  'node_modules',
  'package.json',
  '.npmignore',
  '.gitignore',
];

// Url to the documentation on Expo Modules
const DOCS_URL = 'https://docs.expo.dev/modules';

const FYI_LOCAL_DIR = 'https://expo.fyi/expo-module-local-autolinking.md';

async function getCorrectLocalDirectory(targetOrSlug: string) {
  const packageJsonPath = await findUp('package.json', { cwd: CWD });
  if (!packageJsonPath) {
    console.log(
      chalk.red.bold(
        '⚠️ This command should be run inside your Expo project when run with the --local flag.'
      )
    );
    console.log(
      chalk.red(
        'For native modules to autolink correctly, you need to place them in the `modules` directory in the root of the project.'
      )
    );
    return null;
  }
  return path.join(packageJsonPath, '..', 'modules', targetOrSlug);
}

/**
 * The main function of the command.
 *
 * @param target Path to the directory where to create the module. Defaults to current working dir.
 * @param command An object from `commander`.
 */
async function main(target: string | undefined, options: CommandOptions) {
  if (options.local) {
    console.log();
    console.log(
      `${chalk.gray('The local module will be created in the ')}${chalk.gray.bold.italic(
        'modules'
      )} ${chalk.gray('directory in the root of your project. Learn more: ')}${chalk.gray.bold(
        FYI_LOCAL_DIR
      )}`
    );
    console.log();
  }
  const slug = await askForPackageSlugAsync(target, options.local);
  const targetDir = options.local
    ? await getCorrectLocalDirectory(target || slug)
    : path.join(CWD, target || slug);

  if (!targetDir) {
    return;
  }
  await fs.ensureDir(targetDir);
  await confirmTargetDirAsync(targetDir);

  options.target = targetDir;

  const data = await askForSubstitutionDataAsync(slug, options.local);

  // Make one line break between prompts and progress logs
  console.log();

  const packageManager = await resolvePackageManager();
  const packagePath = options.source
    ? path.join(CWD, options.source)
    : await downloadPackageAsync(targetDir, options.local);

  logEventAsync(eventCreateExpoModule(packageManager, options));

  await newStep('Creating the module from template files', async (step) => {
    await createModuleFromTemplate(packagePath, targetDir, data);
    step.succeed('Created the module from template files');
  });
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
    await fs.remove(packagePath);
  }
  if (!options.local && data.type !== 'local') {
    if (!options.withReadme) {
      await fs.remove(path.join(targetDir, 'README.md'));
    }
    if (!options.withChangelog) {
      await fs.remove(path.join(targetDir, 'CHANGELOG.md'));
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
      } catch (e: any) {
        step.fail(e.toString());
      }
    });
  }

  console.log();
  if (options.local) {
    console.log(`✅ Successfully created Expo module in ${chalk.bold.italic(`modules/${slug}`)}`);
    printFurtherLocalInstructions(slug, data.project.moduleName);
  } else {
    console.log('✅ Successfully created Expo module');
    printFurtherInstructions(targetDir, packageManager, options.example);
  }
}

/**
 * Recursively scans for the files within the directory. Returned paths are relative to the `root` path.
 */
async function getFilesAsync(root: string, dir: string | null = null): Promise<string[]> {
  const files: string[] = [];
  const baseDir = dir ? path.join(root, dir) : root;

  for (const file of await fs.readdir(baseDir)) {
    const relativePath = dir ? path.join(dir, file) : file;

    if (IGNORES_PATHS.includes(relativePath) || IGNORES_PATHS.includes(file)) {
      continue;
    }

    const fullPath = path.join(baseDir, file);
    const stat = await fs.lstat(fullPath);

    if (stat.isDirectory()) {
      files.push(...(await getFilesAsync(root, relativePath)));
    } else {
      files.push(relativePath);
    }
  }
  return files;
}

/**
 * Asks NPM registry for the url to the tarball.
 */
async function getNpmTarballUrl(packageName: string, version: string = 'latest'): Promise<string> {
  debug(`Using module template ${chalk.bold(packageName)}@${chalk.bold(version)}`);
  const { stdout } = await spawnAsync('npm', ['view', `${packageName}@${version}`, 'dist.tarball']);
  return stdout.trim();
}

/**
 * Gets expo SDK version major from the local package.json.
 */
async function getLocalSdkMajorVersion(): Promise<string | null> {
  const path = require.resolve('expo/package.json', { paths: [process.cwd()] });
  if (!path) {
    return null;
  }
  const { version } = require(path) ?? {};
  return version?.split('.')[0] ?? null;
}

/**
 * Selects correct version of the template based on the SDK version for local modules and EXPO_BETA flag.
 */
async function getTemplateVersion(isLocal: boolean) {
  if (EXPO_BETA) {
    return 'next';
  }
  if (!isLocal) {
    return 'latest';
  }
  try {
    const sdkVersionMajor = await getLocalSdkMajorVersion();
    return sdkVersionMajor ? `sdk-${sdkVersionMajor}` : 'latest';
  } catch {
    console.log();
    console.warn(
      chalk.yellow(
        "Couldn't determine the SDK version from the local project, using `latest` as the template version."
      )
    );
    return 'latest';
  }
}

/**
 * Downloads the template from NPM registry.
 */
async function downloadPackageAsync(targetDir: string, isLocal = false): Promise<string> {
  return await newStep('Downloading module template from npm', async (step) => {
    const templateVersion = await getTemplateVersion(isLocal);
    let tarballUrl: string | null = null;
    try {
      tarballUrl = await getNpmTarballUrl(
        isLocal ? 'expo-module-template-local' : 'expo-module-template',
        templateVersion
      );
    } catch {
      console.log();
      console.warn(
        chalk.yellow(
          "Couldn't download the versioned template from npm, falling back to the latest version."
        )
      );
      tarballUrl = await getNpmTarballUrl(
        isLocal ? 'expo-module-template-local' : 'expo-module-template',
        'latest'
      );
    }

    await downloadTarball({
      url: tarballUrl,
      dir: targetDir,
    });

    step.succeed('Downloaded module template from npm');

    return path.join(targetDir, 'package');
  });
}

function handleSuffix(name: string, suffix: string): string {
  if (name.endsWith(suffix)) {
    return name;
  }
  return `${name}${suffix}`;
}

/**
 * Creates the module based on the `ejs` template (e.g. `expo-module-template` package).
 */
async function createModuleFromTemplate(
  templatePath: string,
  targetPath: string,
  data: SubstitutionData | LocalSubstitutionData
) {
  const files = await getFilesAsync(templatePath);

  // Iterate through all template files.
  for (const file of files) {
    const renderedRelativePath = ejs.render(file.replace(/^\$/, ''), data, {
      openDelimiter: '{',
      closeDelimiter: '}',
      escape: (value: string) => value.replace(/\./g, path.sep),
    });
    const fromPath = path.join(templatePath, file);
    const toPath = path.join(targetPath, renderedRelativePath);
    const template = await fs.readFile(fromPath, { encoding: 'utf8' });
    const renderedContent = ejs.render(template, data);

    await fs.outputFile(toPath, renderedContent, { encoding: 'utf8' });
  }
}

async function createGitRepositoryAsync(targetDir: string) {
  // Check if we are inside a git repository already
  try {
    await spawnAsync('git', ['rev-parse', '--is-inside-work-tree'], {
      stdio: 'ignore',
      cwd: targetDir,
    });
    debug(chalk.dim('New project is already inside of a Git repo, skipping git init.'));
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
 */
async function askForPackageSlugAsync(customTargetPath?: string, isLocal = false): Promise<string> {
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
 */
async function askForSubstitutionDataAsync(
  slug: string,
  isLocal = false
): Promise<SubstitutionData | LocalSubstitutionData> {
  const promptQueries = await (
    isLocal ? getLocalSubstitutionDataPrompts : getSubstitutionDataPrompts
  )(slug);

  // Stop the process when the user cancels/exits the prompt.
  const onCancel = () => {
    process.exit(0);
  };

  const {
    name,
    description,
    package: projectPackage,
    authorName,
    authorEmail,
    authorUrl,
    repo,
  } = await prompts(promptQueries, { onCancel });

  if (isLocal) {
    return {
      project: {
        slug,
        name,
        package: projectPackage,
        moduleName: handleSuffix(name, 'Module'),
        viewName: handleSuffix(name, 'View'),
      },
      type: 'local',
    };
  }

  return {
    project: {
      slug,
      name,
      version: '0.1.0',
      description,
      package: projectPackage,
      moduleName: handleSuffix(name, 'Module'),
      viewName: handleSuffix(name, 'View'),
    },
    author: `${authorName} <${authorEmail}> (${authorUrl})`,
    license: 'MIT',
    repo,
    type: 'remote',
  };
}

/**
 * Checks whether the target directory is empty and if not, asks the user to confirm if he wants to continue.
 */
async function confirmTargetDirAsync(targetDir: string): Promise<void> {
  const files = await fs.readdir(targetDir);

  if (files.length === 0) {
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
      'To start developing your module, navigate to the directory and open iOS and Android projects of the example app'
    );
    commands.forEach((command) => console.log(chalk.gray('>'), chalk.bold(command)));
    console.log();
  }
  console.log(`Learn more on Expo Modules APIs: ${chalk.blue.bold(DOCS_URL)}`);
}

function printFurtherLocalInstructions(slug: string, name: string) {
  console.log();
  console.log(`You can now import this module inside your application.`);
  console.log(`For example, you can add this line to your App.js or App.tsx file:`);
  console.log(`${chalk.gray.italic(`import ${name} './modules/${slug}';`)}`);
  console.log();
  console.log(`Learn more on Expo Modules APIs: ${chalk.blue.bold(DOCS_URL)}`);
  console.log(
    chalk.yellow(
      `Remember you need to rebuild your development client or reinstall pods to see the changes.`
    )
  );
}

const program = new Command();

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
  .action(main);

program
  .hook('postAction', async () => {
    await getTelemetryClient().flush?.();
  })
  .parse(process.argv);
