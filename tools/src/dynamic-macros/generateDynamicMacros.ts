import JsonFile from '@expo/json-file';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';

import AndroidMacrosGenerator from './AndroidMacrosGenerator';
import IosMacrosGenerator from './IosMacrosGenerator';
import macros from './macros';
import { Directories } from '../expotools';

const EXPO_DIR = Directories.getExpoRepositoryRootDir();

type TemplateSubstitutions = {
  [key: string]: string;
};

async function getTemplateSubstitutionsFromSecrets(): Promise<TemplateSubstitutions> {
  try {
    return await new JsonFile<TemplateSubstitutions>(
      path.join(EXPO_DIR, 'secrets', 'keys.json')
    ).readAsync();
  } catch {
    // Don't have access to decrypted secrets, use public keys
    console.log(
      "You don't have access to decrypted secrets. Falling back to `template-files/keys.json`."
    );
    return await new JsonFile<TemplateSubstitutions>(
      path.join(EXPO_DIR, 'template-files', 'keys.json')
    ).readAsync();
  }
}

async function getTemplateSubstitutionsAsync() {
  const defaultKeys = await getTemplateSubstitutionsFromSecrets();

  try {
    // Keys from secrets/template-files can be overwritten by private-keys.json file.
    const privateKeys = await new JsonFile(path.join(EXPO_DIR, 'private-keys.json')).readAsync();
    return { ...defaultKeys, ...privateKeys };
  } catch {
    return defaultKeys;
  }
}

async function generateMacrosAsync(platform, configuration) {
  const macrosObject = {};

  console.log('Resolving macros...');

  for (const [name, func] of Object.entries(macros)) {
    // @ts-ignore
    const macroValue = await func.call(macros, platform, configuration);

    macrosObject[name] = macroValue;

    console.log(
      'Resolved %s macro to %s',
      chalk.green(name),
      chalk.yellow(JSON.stringify(macroValue))
    );
  }
  console.log();
  return macrosObject;
}

function getMacrosGeneratorForPlatform(platform) {
  if (platform === 'ios') {
    return new IosMacrosGenerator();
  }
  if (platform === 'android') {
    return new AndroidMacrosGenerator();
  }
  throw new Error(`Platform '${platform}' is not supported.`);
}

function getSkippedTemplates(isBare: boolean): string[] {
  if (isBare) {
    return ['AndroidManifest.xml', 'google-services.json'];
  }

  return [];
}

async function generateDynamicMacrosAsync(args) {
  try {
    const { platform, bareExpo } = args;
    const templateSubstitutions = await getTemplateSubstitutionsAsync();

    if (!bareExpo) {
      const macros = await generateMacrosAsync(platform, args.configuration);
      const macrosGenerator = getMacrosGeneratorForPlatform(platform);
      await macrosGenerator.generateAsync({ ...args, macros, templateSubstitutions });
    }
    // Copy template files - it is platform-agnostic.
    await copyTemplateFilesAsync(
      platform,
      { ...args, skipTemplates: getSkippedTemplates(bareExpo) },
      templateSubstitutions
    );
  } catch (error) {
    console.error(
      `There was an error while generating Expo template files, which could lead to unexpected behavior at runtime:\n${error.stack}`
    );
    process.exit(1);
  }
}

async function readExistingSourceAsync(filepath): Promise<string | null> {
  try {
    return await fs.readFile(filepath, 'utf8');
  } catch {
    return null;
  }
}

async function copyTemplateFileAsync(
  source: string,
  dest: string,
  templateSubstitutions: TemplateSubstitutions,
  configuration,
  isOptional: boolean
): Promise<void> {
  let [currentSourceFile, currentDestFile] = await Promise.all([
    readExistingSourceAsync(source),
    readExistingSourceAsync(dest),
  ]);

  if (!currentSourceFile) {
    console.error(`Couldn't find ${chalk.magenta(source)} file.`);
    process.exit(1);
  }

  for (const [textToReplace, value] of Object.entries(templateSubstitutions)) {
    currentSourceFile = currentSourceFile.replace(
      new RegExp(`\\$\\{${textToReplace}\\}`, 'g'),
      value
    );
  }

  if (configuration === 'debug') {
    // We need these permissions when testing but don't want them
    // ending up in our release.
    currentSourceFile = currentSourceFile.replace(
      `<!-- ADD TEST PERMISSIONS HERE -->`,
      `<uses-permission android:name="android.permission.WRITE_CONTACTS" />`
    );
  }

  if (currentSourceFile !== currentDestFile) {
    try {
      await fs.writeFile(dest, currentSourceFile, 'utf8');
    } catch (error) {
      if (!isOptional) throw error;
    }
  }
}

type TemplatePaths = Record<string, string>;
type TemplatePathsFile = {
  paths: TemplatePaths;
  generateOnly: TemplatePaths;
};

async function copyTemplateFilesAsync(platform: string, args: any, templateSubstitutions: any) {
  const templateFilesPath = args.templateFilesPath || path.join(EXPO_DIR, 'template-files');
  const templatePathsFile = (await new JsonFile(
    path.join(templateFilesPath, `${platform}-paths.json`)
  ).readAsync()) as TemplatePathsFile;
  const templatePaths = { ...templatePathsFile.paths, ...templatePathsFile.generateOnly };
  const checkIgnoredTemplatePaths = Object.values(templatePathsFile.generateOnly);
  const promises: Promise<any>[] = [];
  const skipTemplates: string[] = args.skipTemplates || [];
  for (const [source, dest] of Object.entries(templatePaths)) {
    if (skipTemplates.includes(source)) {
      console.log(
        'Skipping template %s ...',
        chalk.cyan(path.join(templateFilesPath, platform, source))
      );
      continue;
    }

    const isOptional = checkIgnoredTemplatePaths.includes(dest);
    console.log(
      'Rendering %s from template %s %s...',
      chalk.cyan(path.join(EXPO_DIR, dest)),
      chalk.cyan(path.join(templateFilesPath, platform, source)),
      isOptional ? chalk.yellow('(Optional) ') : ''
    );

    promises.push(
      copyTemplateFileAsync(
        path.join(templateFilesPath, platform, source),
        path.join(EXPO_DIR, dest),
        templateSubstitutions,
        args.configuration,
        isOptional
      )
    );
  }

  await Promise.all(promises);
}

export { generateDynamicMacrosAsync, getTemplateSubstitutionsAsync };
