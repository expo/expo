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

    config.USE_GENERATED_DEFAULTS = true;

    const sortedConfig = Object.fromEntries(
      Object.entries(config).sort(([a], [b]) => a.localeCompare(b))
    );
    return sortedConfig;
  });

  return result;
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
      infoPlist,
      templateSubstitutions
    );
  }
}
