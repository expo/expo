import type { ExpoConfig } from '@expo/config';
import JsonFile from '@expo/json-file';
import * as PackageManager from '@expo/package-manager';
import chalk from 'chalk';
import { glob } from 'fast-glob';
import fs from 'fs';
import ora from 'ora';
import path from 'path';

import { sanitizedName } from './createFileTransform';
import { Log } from './log';
import { formatRunCommand, PackageManagerName } from './resolvePackageManager';
import { env } from './utils/env';
import { downloadAndExtractGitHubRepositoryAsync } from './utils/github';
import {
  applyBetaTag,
  applyKnownNpmPackageNameRules,
  downloadAndExtractNpmModuleAsync,
  ExtractProps,
  getResolvedTemplateName,
} from './utils/npm';

const debug = require('debug')('expo:init:template') as typeof console.log;

const isMacOS = process.platform === 'darwin';

// keep this list in sync with the validation helper in WWW: src/utils/experienceParser.ts
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
  Object.keys(source).forEach((key) => {
    if (typeof source[key] === 'object' && source[key] !== null) {
      target[key] = deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  });
  return target;
}

function coerceUrl(urlString: string) {
  try {
    return new URL(urlString);
  } catch (e) {
    if (!/^(https?:\/\/)/.test(urlString)) {
      return new URL(`https://${urlString}`);
    }
    throw e;
  }
}

export function resolvePackageModuleId(moduleId: string) {
  if (
    // Supports github repository URLs
    /^(https?:\/\/)?github\.com\//.test(moduleId)
  ) {
    try {
      const uri = coerceUrl(moduleId);
      debug('Resolved moduleId to repository path:', moduleId);
      return { type: 'repository', uri } as const;
    } catch {
      throw new Error(`Invalid URL: "${moduleId}" provided`);
    }
  }

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
    return { type: 'file', uri: path.resolve(moduleId) } as const;
  }

  debug(`Resolved moduleId to NPM package:`, moduleId);
  return { type: 'npm', uri: moduleId } as const;
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

  const { type, uri } = resolvePackageModuleId(npmPackage || 'expo-template-default');

  if (type === 'repository') {
    await downloadAndExtractGitHubRepositoryAsync(uri, {
      cwd: projectRoot,
      name: projectName,
    });
  } else {
    const resolvedUri = type === 'file' ? uri : getResolvedTemplateName(applyBetaTag(uri));
    await downloadAndExtractNpmModuleAsync(resolvedUri, {
      cwd: projectRoot,
      name: projectName,
      disableCache: type === 'file',
    });
  }

  try {
    const files = await getTemplateFilesToRenameAsync({ cwd: projectRoot });
    await renameTemplateAppNameAsync({
      cwd: projectRoot,
      files,
      name: projectName,
    });
  } catch (error: any) {
    Log.error('Error renaming app name in template');
    throw error;
  }

  await sanitizeTemplateAsync(projectRoot);

  return projectRoot;
}

function escapeXMLCharacters(original: string): string {
  const noAmps = original.replace('&', '&amp;');
  const noLt = noAmps.replace('<', '&lt;');
  const noGt = noLt.replace('>', '&gt;');
  const noApos = noGt.replace('"', '\\"');
  return noApos.replace("'", "\\'");
}

/**
 * # Background
 *
 * `@expo/cli` and `create-expo` extract a template from a tarball (whether from
 * a local npm project or a GitHub repository), but these templates have a
 * static name that needs to be updated to match whatever app name the user
 * specified.
 *
 * By convention, the app name of all templates is "HelloWorld". During
 * extraction, filepaths are transformed via `createEntryResolver()` in
 * `createFileTransform.ts`, but the contents of files are left untouched.
 * Technically, the contents used to be transformed during extraction as well,
 * but due to poor configurability, we've moved to a post-extraction approach.
 *
 * # The new approach: Renaming the app post-extraction
 *
 * In this new approach, we take a list of file patterns, otherwise known as the
 * "rename config" to determine explicitly which files – relative to the root of
 * the template – to perform find-and-replace on, to update the app name.
 *
 * ## The rename config
 *
 * The rename config can be passed directly as a string array to
 * `getTemplateFilesToRenameAsync()`.
 *
 * The file patterns are formatted as glob expressions to be interpreted by
 * [fast-glob](https://github.com/mrmlnc/fast-glob). Comments are supported with
 * the `#` symbol, both in the plain-text file and string array formats.
 * Whitespace is trimmed and whitespace-only lines are ignored.
 *
 * If no rename config has been passed directly to
 * `getTemplateFilesToRenameAsync()` then this default rename config will be
 * used instead.
 */
export const defaultRenameConfig = [
  // Common
  '!**/node_modules',
  'app.json',

  // Android
  'android/**/*.gradle',
  'android/app/BUCK',
  'android/app/src/**/*.java',
  'android/app/src/**/*.kt',
  'android/app/src/**/*.xml',

  // iOS
  'ios/Podfile',
  'ios/**/*.xcodeproj/project.pbxproj',
  'ios/**/*.xcodeproj/xcshareddata/xcschemes/*.xcscheme',
  'ios/**/*.xcworkspace/contents.xcworkspacedata',

  // macOS
  'macos/Podfile',
  'macos/**/*.xcodeproj/project.pbxproj',
  'macos/**/*.xcodeproj/xcshareddata/xcschemes/*.xcscheme',
  'macos/**/*.xcworkspace/contents.xcworkspacedata',
] as const;

/**
 * Returns a list of files within a template matched by the resolved rename
 * config.
 *
 * The rename config is resolved in the order of preference:
 * Config provided as function param > defaultRenameConfig
 */
export async function getTemplateFilesToRenameAsync({
  cwd,
  /**
   * An array of patterns following the rename config format. If omitted, then
   * we fall back to defaultRenameConfig.
   * @see defaultRenameConfig
   */
  renameConfig: userConfig,
}: Pick<ExtractProps, 'cwd'> & { renameConfig?: string[] }) {
  let config = userConfig ?? defaultRenameConfig;

  // Strip comments, trim whitespace, and remove empty lines.
  config = config.map((line) => line.split(/(?<!\\)#/, 2)[0].trim()).filter((line) => line !== '');

  return await glob(config, {
    cwd,
    // `true` is consistent with .gitignore. Allows `*.xml` to match .xml files
    // in all subdirs.
    baseNameMatch: true,
    dot: true,
    // Prevent climbing out of the template directory in case a template
    // includes a symlink to an external directory.
    followSymbolicLinks: false,
  });
}

export async function renameTemplateAppNameAsync({
  cwd,
  name,
  files,
}: Pick<ExtractProps, 'cwd' | 'name'> & {
  /**
   * An array of files to transform. Usually provided by calling
   * getTemplateFilesToRenameAsync().
   * @see getTemplateFilesToRenameAsync
   */
  files: string[];
}) {
  debug(`Got files to transform: ${JSON.stringify(files)}`);

  await Promise.all(
    files.map(async (file) => {
      const absoluteFilePath = path.resolve(cwd, file);

      let contents: string;
      try {
        contents = await fs.promises.readFile(absoluteFilePath, { encoding: 'utf-8' });
      } catch (error) {
        throw new Error(
          `Failed to read template file: "${absoluteFilePath}". Was it removed mid-operation?`,
          { cause: error }
        );
      }

      debug(`Renaming app name in file: ${absoluteFilePath}`);

      const safeName = ['.xml', '.plist'].includes(path.extname(file))
        ? escapeXMLCharacters(name)
        : name;

      try {
        const replacement = contents
          .replace(/Hello App Display Name/g, safeName)
          .replace(/HelloWorld/g, sanitizedName(safeName))
          .replace(/helloworld/g, sanitizedName(safeName.toLowerCase()));

        if (replacement === contents) {
          return;
        }

        await fs.promises.writeFile(absoluteFilePath, replacement);
      } catch (error) {
        throw new Error(
          `Failed to overwrite template file: "${absoluteFilePath}". Was it removed mid-operation?`,
          { cause: error }
        );
      }
    })
  );
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

  const defaultConfig: ExpoConfig = {
    name: projectName,
    slug: projectName,
  };

  const appFile = new JsonFile(path.join(projectRoot, 'app.json'), { default: {} });
  const appContent = (await appFile.readAsync()) as ExpoConfig | Record<'expo', ExpoConfig>;
  const appJson = deepMerge(
    appContent,
    'expo' in appContent ? { expo: defaultConfig } : defaultConfig
  );

  await appFile.writeAsync(appJson);
  debug(`Created app.json:\n%O`, appJson);

  const packageFile = new JsonFile(path.join(projectRoot, 'package.json'));
  const packageJson = await packageFile.readAsync();
  // name and version are required for yarn workspaces (monorepos)
  const inputName = 'name' in appJson ? appJson.name : appJson.expo.name;
  packageJson.name = applyKnownNpmPackageNameRules(inputName) || 'app';
  // These are metadata fields related to the template package, let's remove them from the package.json.
  // A good place to start
  packageJson.version = '1.0.0';
  packageJson.private = true;
  delete packageJson.description;
  delete packageJson.tags;
  delete packageJson.repository;

  // Only strip the license if it's 0BSD, used by our templates. Leave other licenses alone.
  if (packageJson.license === '0BSD') {
    delete packageJson.license;
  }

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
