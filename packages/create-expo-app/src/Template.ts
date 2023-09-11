import JsonFile from '@expo/json-file';
import * as PackageManager from '@expo/package-manager';
import chalk from 'chalk';
import fs from 'fs';
import ora from 'ora';
import path from 'path';

import { Log } from './log';
import { formatRunCommand, PackageManagerName } from './resolvePackageManager';
import { env } from './utils/env';
import {
  applyBetaTag,
  applyKnownNpmPackageNameRules,
  downloadAndExtractNpmModuleAsync,
  getResolvedTemplateName,
} from './utils/npm';

const debug = require('debug')('expo:init:template') as typeof console.log;

const isMacOS = process.platform === 'darwin';

const FORBIDDEN_NAMES = [
  'react-native',
  'react',
  'react-dom',
  'react-native-web',
  'expo',
  'expo-router',
];

export function isFolderNameForbidden(folderName: string): boolean {
  return FORBIDDEN_NAMES.includes(folderName);
}

function deepMerge(target: any, source: any) {
  if (typeof target !== 'object') {
    return source;
  }
  if (Array.isArray(target) && Array.isArray(source)) {
    return target.concat(source);
  }
  Object.keys(source).forEach(key => {
    if (typeof source[key] === 'object' && source[key] !== null) {
      target[key] = deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  });
  return target;
}

export function resolvePackageModuleId(moduleId: string) {
  if (
    // Supports `file:./path/to/template.tgz`
    moduleId?.startsWith('file:') ||
    // Supports `../path/to/template.tgz`
    moduleId?.startsWith('.') ||
    // Supports `\\path\\to\\template.tgz`
    moduleId?.startsWith(path.sep)
  ) {
    if (moduleId?.startsWith('file:')) {
      moduleId = moduleId.substring(5);
    }
    debug(`Resolved moduleId to file path:`, moduleId);
    return { type: 'file', uri: path.resolve(moduleId) };
  } else {
    debug(`Resolved moduleId to NPM package:`, moduleId);
    return { type: 'npm', uri: moduleId };
  }
}

/**
 * Extract a template app to a given file path and clean up any properties left over from npm to
 * prepare it for usage.
 */
export async function extractAndPrepareTemplateAppAsync(
  projectRoot: string,
  { npmPackage }: { npmPackage?: string | null }
) {
  const projectName = path.basename(projectRoot);

  debug(`Extracting template app (pkg: ${npmPackage}, projectName: ${projectName})`);

  const { type, uri } = resolvePackageModuleId(npmPackage || 'expo-template-blank');

  const resolvedUri = type === 'file' ? uri : getResolvedTemplateName(applyBetaTag(uri));

  await downloadAndExtractNpmModuleAsync(resolvedUri, {
    cwd: projectRoot,
    name: projectName,
    disableCache: type === 'file',
  });

  await sanitizeTemplateAsync(projectRoot);

  return projectRoot;
}

/**
 * Sanitize a template (or example) with expected `package.json` properties and files.
 */
export async function sanitizeTemplateAsync(projectRoot: string) {
  const projectName = path.basename(projectRoot);

  debug(`Sanitizing template or example app (projectName: ${projectName})`);

  const templatePath = path.join(__dirname, '../template/gitignore');
  const ignorePath = path.join(projectRoot, '.gitignore');
  if (!fs.existsSync(ignorePath)) {
    await fs.promises.copyFile(templatePath, ignorePath);
  }

  const config: Record<string, any> = {
    expo: {
      name: projectName,
      slug: projectName,
    },
  };

  const appFile = new JsonFile(path.join(projectRoot, 'app.json'), {
    default: { expo: {} },
  });
  const appJson = deepMerge(await appFile.readAsync(), config);
  await appFile.writeAsync(appJson);

  debug(`Created app.json:\n%O`, appJson);

  const packageFile = new JsonFile(path.join(projectRoot, 'package.json'));
  const packageJson = await packageFile.readAsync();
  // name and version are required for yarn workspaces (monorepos)
  const inputName = 'name' in config ? config.name : config.expo.name;
  packageJson.name = applyKnownNpmPackageNameRules(inputName) || 'app';
  // These are metadata fields related to the template package, let's remove them from the package.json.
  // A good place to start
  packageJson.version = '1.0.0';
  packageJson.private = true;
  delete packageJson.description;
  delete packageJson.tags;
  delete packageJson.repository;

  await packageFile.writeAsync(packageJson);
}

export function validateName(name?: string): string | true {
  if (typeof name !== 'string' || name === '') {
    return 'The project name can not be empty.';
  }
  if (!/^[a-z0-9@.\-_]+$/i.test(name)) {
    return 'The project name can only contain URL-friendly characters.';
  }
  return true;
}

export function logProjectReady({
  cdPath,
  packageManager,
}: {
  cdPath: string;
  packageManager: PackageManagerName;
}) {
  console.log(chalk.bold(`✅ Your project is ready!`));
  console.log();

  // empty string if project was created in current directory
  if (cdPath) {
    console.log(
      `To run your project, navigate to the directory and run one of the following ${packageManager} commands.`
    );
    console.log();
    console.log(`- ${chalk.bold('cd ' + cdPath)}`);
  } else {
    console.log(`To run your project, run one of the following ${packageManager} commands.`);
    console.log();
  }

  console.log(`- ${chalk.bold(formatRunCommand(packageManager, 'android'))}`);

  let macOSComment = '';
  if (!isMacOS) {
    macOSComment =
      ' # you need to use macOS to build the iOS project - use the Expo app if you need to do iOS development without a Mac';
  }
  console.log(`- ${chalk.bold(formatRunCommand(packageManager, 'ios'))}${macOSComment}`);

  console.log(`- ${chalk.bold(formatRunCommand(packageManager, 'web'))}`);
}

export async function installPodsAsync(projectRoot: string) {
  let step = logNewSection('Installing CocoaPods.');
  if (process.platform !== 'darwin') {
    step.succeed('Skipped installing CocoaPods because operating system is not macOS.');
    return false;
  }
  const packageManager = new PackageManager.CocoaPodsPackageManager({
    cwd: path.join(projectRoot, 'ios'),
    silent: !env.EXPO_DEBUG,
  });

  if (!(await packageManager.isCLIInstalledAsync())) {
    try {
      step.text = 'CocoaPods CLI not found in your $PATH, installing it now.';
      step.render();
      await packageManager.installCLIAsync();
      step.succeed('Installed CocoaPods CLI');
      step = logNewSection('Running `pod install` in the `ios` directory.');
    } catch (e: any) {
      step.stopAndPersist({
        symbol: '⚠️ ',
        text: chalk.red(
          'Unable to install the CocoaPods CLI. Continuing with initializing the project, you can install CocoaPods afterwards.'
        ),
      });
      if (e.message) {
        Log.error(`- ${e.message}`);
      }
      return false;
    }
  }

  try {
    await packageManager.installAsync();
    step.succeed('Installed pods and initialized Xcode workspace.');
    return true;
  } catch (e: any) {
    step.stopAndPersist({
      symbol: '⚠️ ',
      text: chalk.red(
        'Something went wrong running `pod install` in the `ios` directory. Continuing with initializing the project, you can debug this afterwards.'
      ),
    });
    if (e.message) {
      Log.error(`- ${e.message}`);
    }
    return false;
  }
}

export function logNewSection(title: string) {
  const disabled = env.CI || env.EXPO_DEBUG;
  const spinner = ora({
    text: chalk.bold(title),
    // Ensure our non-interactive mode emulates CI mode.
    isEnabled: !disabled,
    // In non-interactive mode, send the stream to stdout so it prevents looking like an error.
    stream: disabled ? process.stdout : process.stderr,
  });

  spinner.start();
  return spinner;
}
