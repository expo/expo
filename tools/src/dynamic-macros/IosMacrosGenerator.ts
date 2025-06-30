import plist from '@expo/plist';
import chalk from 'chalk';
import fs from 'node:fs';
import path from 'node:path';

import * as Directories from '../Directories';
import * as Versions from '../Versions';

interface PlistObject {
  [key: string]: any;
}

const EXPO_DIR = Directories.getExpoRepositoryRootDir();

async function readPlistAsync(plistPath: string): Promise<PlistObject> {
  const plistFileContent = await fs.promises.readFile(plistPath, 'utf8');
  return plist.parse(plistFileContent);
}

async function updatePlistAsync(
  plistPath: string,
  updater: (obj: PlistObject) => PlistObject
): Promise<PlistObject> {
  let data: PlistObject;
  try {
    const contents = await fs.promises.readFile(plistPath, 'utf8');
    data = await plist.parse(contents);
  } catch {
    data = {};
  }

  const updatedData = updater(data);
  const updatedContents = plist.build(updatedData);
  await fs.promises.writeFile(plistPath, updatedContents);
  return updatedData;
}

async function generateBuildConstantsFromMacrosAsync(
  buildConstantsPath: string,
  macros,
  buildConfiguration,
  infoPlistContents,
  keys
): Promise<PlistObject> {
  console.log(
    'Generating build config %s ...',
    chalk.cyan(path.relative(EXPO_DIR, buildConstantsPath))
  );

  const result = await updatePlistAsync(buildConstantsPath, (config) => {
    if (config.USE_GENERATED_DEFAULTS === false) {
      // this flag means don't generate anything, let the user override.
      return config;
    }

    for (const [name, value] of Object.entries(macros)) {
      config[name] = value || '';
    }

    config.EXPO_RUNTIME_VERSION = infoPlistContents.CFBundleVersion
      ? infoPlistContents.CFBundleVersion
      : infoPlistContents.CFBundleShortVersionString;

    if (!config.API_SERVER_ENDPOINT) {
      config.API_SERVER_ENDPOINT = `https://${Versions.VersionsApiHost.PRODUCTION}/v2/`;
    }
    if (keys) {
      const { GOOGLE_MAPS_IOS_API_KEY } = keys;
      config.DEFAULT_API_KEYS = { GOOGLE_MAPS_IOS_API_KEY };
    }
    const validatedConfig = validateBuildConstants(config, buildConfiguration);
    const sortedConfig = Object.fromEntries(
      Object.entries(validatedConfig).sort(([a], [b]) => a.localeCompare(b))
    );
    return sortedConfig;
  });

  return result;
}

/**
 *  Adds IS_DEV_KERNEL (bool) and DEV_KERNEL_SOURCE (PUBLISHED, LOCAL)
 *  and errors if there's a problem with the chosen environment.
 */
function validateBuildConstants(config: PlistObject, buildConfiguration: string): PlistObject {
  config.USE_GENERATED_DEFAULTS = true;

  let IS_DEV_KERNEL = false;
  let DEV_KERNEL_SOURCE = '';
  if (buildConfiguration === 'Debug') {
    IS_DEV_KERNEL = true;
    DEV_KERNEL_SOURCE = config.DEV_KERNEL_SOURCE;
    if (!DEV_KERNEL_SOURCE) {
      // default to dev published build if nothing specified
      DEV_KERNEL_SOURCE = 'PUBLISHED';
    }
  } else {
    IS_DEV_KERNEL = false;
  }

  if (IS_DEV_KERNEL) {
    if (DEV_KERNEL_SOURCE === 'LOCAL' && !config.BUILD_MACHINE_KERNEL_MANIFEST) {
      throw new Error(
        `Error generating local kernel manifest.\nMake sure a local kernel is being served, or switch DEV_KERNEL_SOURCE to use PUBLISHED instead.`
      );
    }

    if (DEV_KERNEL_SOURCE === 'PUBLISHED' && !config.DEV_PUBLISHED_KERNEL_MANIFEST) {
      throw new Error(`Error downloading DEV published kernel manifest.\n`);
    }
  }

  config.IS_DEV_KERNEL = IS_DEV_KERNEL;
  config.DEV_KERNEL_SOURCE = DEV_KERNEL_SOURCE;
  return config;
}

export default class IosMacrosGenerator {
  async generateAsync(options): Promise<void> {
    const { infoPlistPath, buildConstantsPath, macros, templateSubstitutions } = options;

    // Read Info.plist
    const infoPlist = await readPlistAsync(infoPlistPath);

    // Generate EXBuildConstants.plist
    await generateBuildConstantsFromMacrosAsync(
      path.resolve(buildConstantsPath),
      macros,
      options.configuration,
      infoPlist,
      templateSubstitutions
    );
  }
}
