import { IosPlist, IosPodsTools } from '@expo/xdl';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import plist from 'plist';

import * as Directories from '../Directories';
import * as ProjectVersions from '../ProjectVersions';

interface PlistObject {
  [key: string]: any;
}

const EXPO_DIR = Directories.getExpoRepositoryRootDir();

async function readPlistAsync(plistPath: string): Promise<PlistObject> {
  const plistFileContent = await fs.readFile(plistPath, 'utf8');
  return plist.parse(plistFileContent);
}

async function generateBuildConstantsFromMacrosAsync(
  buildConfigPlistPath,
  macros,
  buildConfiguration,
  infoPlistContents,
  keys
): Promise<PlistObject> {
  const plistPath = path.dirname(buildConfigPlistPath);
  const plistName = path.basename(buildConfigPlistPath);

  if (!(await fs.pathExists(buildConfigPlistPath))) {
    await IosPlist.createBlankAsync(plistPath, plistName);
  }

  console.log(
    'Generating build config %s ...',
    chalk.cyan(path.relative(EXPO_DIR, buildConfigPlistPath))
  );

  const result = await IosPlist.modifyAsync(plistPath, plistName, (config) => {
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
      config.API_SERVER_ENDPOINT = 'https://exp.host/--/api/v2/';
    }
    if (keys) {
      const { GOOGLE_MAPS_IOS_API_KEY } = keys;
      config.DEFAULT_API_KEYS = { GOOGLE_MAPS_IOS_API_KEY };
    }
    return validateBuildConstants(config, buildConfiguration);
  });

  return result;
}

/**
 *  Adds IS_DEV_KERNEL (bool) and DEV_KERNEL_SOURCE (PUBLISHED, LOCAL)
 *  and errors if there's a problem with the chosen environment.
 */
function validateBuildConstants(config, buildConfiguration) {
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

    if (process.env.USE_DOGFOODING_PUBLISHED_KERNEL_MANIFEST) {
      if (!config.DOGFOODING_PUBLISHED_KERNEL_MANIFEST) {
        throw new Error(`Error downloading DOGFOODING published kernel manifest.\n`);
      }
      DEV_KERNEL_SOURCE = 'DOGFOODING';
    }
  }

  config.IS_DEV_KERNEL = IS_DEV_KERNEL;
  config.DEV_KERNEL_SOURCE = DEV_KERNEL_SOURCE;
  return config;
}

async function writeTemplatesAsync(expoKitPath: string, templateFilesPath: string) {
  if (expoKitPath) {
    await renderExpoKitPodspecAsync(expoKitPath, templateFilesPath);
    await renderExpoKitPodfileAsync(expoKitPath, templateFilesPath);
  }
}

export async function renderExpoKitPodspecAsync(
  expoKitPath: string,
  templateFilesPath: string
): Promise<void> {
  const podspecPath = path.join(expoKitPath, 'ios', 'ExpoKit.podspec');
  const podspecTemplatePath = path.join(templateFilesPath, 'ios', 'ExpoKit.podspec');

  console.log(
    'Rendering %s from template %s ...',
    chalk.cyan(path.relative(EXPO_DIR, podspecPath)),
    chalk.cyan(path.relative(EXPO_DIR, podspecTemplatePath))
  );

  await IosPodsTools.renderExpoKitPodspecAsync(podspecTemplatePath, podspecPath, {
    IOS_EXPONENT_CLIENT_VERSION: await ProjectVersions.getNewestSDKVersionAsync('ios'),
  });
}

async function renderExpoKitPodfileAsync(
  expoKitPath: string,
  templateFilesPath: string
): Promise<void> {
  const podfilePath = path.join(expoKitPath, 'exponent-view-template', 'ios', 'Podfile');
  const podfileTemplatePath = path.join(templateFilesPath, 'ios', 'ExpoKit-Podfile');

  console.log(
    'Rendering %s from template %s ...',
    chalk.cyan(path.relative(EXPO_DIR, podfilePath)),
    chalk.cyan(path.relative(EXPO_DIR, podfileTemplatePath))
  );

  await IosPodsTools.renderPodfileAsync(podfileTemplatePath, podfilePath, {
    TARGET_NAME: 'exponent-view-template',
    EXPOKIT_PATH: '../..',
    REACT_NATIVE_PATH: '../../react-native-lab/react-native',
    UNIVERSAL_MODULES_PATH: '../../packages',
  });
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

    // // Generate Podfile and ExpoKit podspec using template files.
    await writeTemplatesAsync(options.expoKitPath, options.templateFilesPath);
  }
}
