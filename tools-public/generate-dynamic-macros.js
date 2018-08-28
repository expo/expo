'use strict';

const _ = require('lodash');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const process = require('process');
const { mkdir } = require('shelljs');
const { IosPlist, IosPodsTools, ExponentTools, UrlUtils, Project } = require('xdl');
const JsonFile = require('@expo/json-file').default;
const spawnAsync = require('@exponent/spawn-async');
const request = require('request-promise-native').defaults({
  resolveWithFullResponse: true,
});
const ip = require('ip');
const uuidv4 = require('uuid/v4');
const { Modules } = require('xdl');

const { renderExpoKitPodspecAsync, renderPodfileAsync } = IosPodsTools;

const ProjectVersions = require('./project-versions');

const EXPONENT_DIR = process.env.EXPONENT_DIR || path.join(__dirname, '..');

const EXPO_CLIENT_UNIVERSAL_MODULES = Modules.getAllNativeForExpoClientOnPlatform('ios');

// We need these permissions when testing but don't want them
// ending up in our release.
const ANDROID_TEST_PERMISSIONS = `
  <uses-permission android:name="android.permission.WRITE_CONTACTS" />
`;

// some files are absent on turtle builders and we don't want log errors there
const isTurtle = !!process.env.TURTLE_WORKING_DIR_PATH;

let isInUniverse = true;
try {
  let universePkgJson = require(process.env.UNIVERSE_PKG_JSON || '../../package.json');
  if (universePkgJson.name !== 'universe') {
    isInUniverse = false;
  }
} catch (e) {
  isInUniverse = false;
}

let useLegacyWorkflow = false;
if (isInUniverse) {
  // determine workflow
  if (!fs.existsSync('../../.pt-state')) {
    useLegacyWorkflow = true;
  }
}

async function getSavedDevHomeUrlAsync(platform) {
  let devHomeConfig = await new JsonFile(
    path.join(EXPONENT_DIR, 'dev-home-config.json')
  ).readAsync();
  return devHomeConfig.url;
}

const macrosFuncs = {
  async TEST_APP_URI() {
    if (process.env.TEST_SUITE_URI) {
      return process.env.TEST_SUITE_URI;
    } else if (isInUniverse) {
      try {
        let testSuitePath = path.join(__dirname, '..', 'apps', 'test-suite');
        let status = await Project.currentStatus(testSuitePath);
        if (status === 'running') {
          return await UrlUtils.constructManifestUrlAsync(testSuitePath);
        } else {
          return '';
        }
      } catch (e) {
        return '';
      }
    } else {
      return '';
    }
  },

  async TEST_CONFIG() {
    if (process.env.TEST_CONFIG) {
      return process.env.TEST_CONFIG;
    } else {
      return '';
    }
  },

  async TEST_SERVER_URL() {
    let url = 'TODO';

    if (isInUniverse) {
      try {
        let lanAddress = ip.address();
        let localServerUrl = `http://${lanAddress}:3013`;
        let result = await request.get({
          url: `${localServerUrl}/expo-test-server-status`,
          timeout: 500, // ms
        });
        if (result.body === 'running!') {
          url = localServerUrl;
        }
      } catch (e) {}
    }

    return url;
  },

  async TEST_RUN_ID() {
    return process.env.UNIVERSE_BUILD_ID || uuidv4();
  },

  async BUILD_MACHINE_LOCAL_HOSTNAME() {
    if (process.env.SHELL_APP_BUILDER) {
      return '';
    }

    try {
      let result = await spawnAsync('scutil', ['--get', 'LocalHostName']);
      return `${result.stdout.trim()}.local`;
    } catch (e) {
      if (e.code !== 'ENOENT') {
        console.error(e.stack);
      }
      return os.hostname();
    }
  },

  async DEV_PUBLISHED_KERNEL_MANIFEST(platform) {
    let manifest, savedDevHomeUrl;
    try {
      console.log('Downloading DEV published kernel manifest...');
      savedDevHomeUrl = await getSavedDevHomeUrlAsync();
      let sdkVersion = await macrosFuncs.TEMPORARY_SDK_VERSION();
      manifest = await ExponentTools.getManifestAsync(savedDevHomeUrl, {
        'Exponent-Platform': platform,
        'Exponent-SDK-Version': sdkVersion,
        Accept: 'application/expo+json,application/json',
      });
    } catch (e) {
      const msg = `Unable to download manifest from ${savedDevHomeUrl}: ${e.message}`;
      console[isTurtle ? 'debug' : 'error'](msg);
      return '';
    }

    return kernelManifestObjectToJson(manifest);
  },

  async BUILD_MACHINE_KERNEL_MANIFEST(platform) {
    if (process.env.SHELL_APP_BUILDER) {
      return '';
    }

    let projectRoot;
    if (isInUniverse && useLegacyWorkflow) {
      projectRoot = path.join(EXPONENT_DIR, 'home', '__internal__');
    } else {
      projectRoot = path.join(EXPONENT_DIR, 'home');
    }

    let manifest;
    try {
      let url = await UrlUtils.constructManifestUrlAsync(projectRoot);
      console.log(
        `Generating local kernel manifest from project root ${projectRoot} and url ${url}...`
      );
      manifest = await ExponentTools.getManifestAsync(url, {
        'Exponent-Platform': platform,
        Accept: 'application/expo+json,application/json',
      });
      if (manifest.name !== 'expo-home') {
        console.log(
          `Manifest at ${url} is not expo-home; using published kernel manifest instead...`
        );
        return '';
      }
    } catch (e) {
      console.error(`Unable to generate manifest from ${projectRoot}: ${e.message}`);
      return '';
    }

    return kernelManifestObjectToJson(manifest);
  },

  async TEMPORARY_SDK_VERSION() {
    let versions = await ProjectVersions.getProjectVersionsAsync();
    return versions.sdkVersion;
  },

  INITIAL_URL() {
    return null;
  },
};

function generateUniversalModuleConfig(moduleInfo, modulesPath) {
  const requiredProperties = ['podName', 'libName', 'subdirectory'];

  requiredProperties.forEach(propName => {
    if (!moduleInfo[propName]) {
      throw new Error(
        `Module info object provided to \`generateUniversalModuleConfig\` is invalid.\nExpected it to have properties ${JSON.stringify(
          requiredProperties
        )}, object provided:\n${JSON.stringify(moduleInfo, null, 2)}`
      );
    }
  });
  return {
    ...moduleInfo,
    path: path.join(modulesPath, moduleInfo.libName, moduleInfo.subdirectory),
  };
}

function generateUniversalModulesConfig(universalModules, modulesPath) {
  return universalModules
    .filter(moduleInfo => moduleInfo.isNativeModule)
    .map(moduleInfo => generateUniversalModuleConfig(moduleInfo, modulesPath));
}

function kernelManifestObjectToJson(manifest) {
  if (!manifest.id) {
    // TODO: let xdl handle this
    // hack for now because unsigned manifest won't have an id
    manifest.id = '@exponent/home';
  }
  manifest.sdkVersion = 'UNVERSIONED';
  let manifestJson = JSON.stringify(manifest);
  return manifestJson;
}

async function generateIOSBuildConstantsFromMacrosAsync(
  buildConfigPlistPath,
  macros,
  buildConfiguration,
  infoPlistContents,
  keys
) {
  const plistPath = path.dirname(buildConfigPlistPath);
  const plistName = path.basename(buildConfigPlistPath);
  if (!fs.existsSync(buildConfigPlistPath)) {
    await IosPlist.createBlankAsync(plistPath, plistName);
  }

  const result = await IosPlist.modifyAsync(plistPath, plistName, config => {
    if (config.USE_GENERATED_DEFAULTS === false) {
      // this flag means don't generate anything, let the user override.
      return config;
    } else {
      _.map(macros, (value, name) => {
        if (value == null) {
          // null == undefined
          value = '';
        }
        config[name] = value;
      });
      config.EXPO_RUNTIME_VERSION = infoPlistContents.CFBundleVersion
        ? infoPlistContents.CFBundleVersion
        : infoPlistContents.CFBundleShortVersionString;
      if (!config.API_SERVER_ENDPOINT) {
        config.API_SERVER_ENDPOINT = 'https://exp.host/--/api/v2/';
      }
      if (keys) {
        const allowedKeys = ['AMPLITUDE_KEY', 'AMPLITUDE_DEV_KEY', 'GOOGLE_MAPS_IOS_API_KEY'];
        config.DEFAULT_API_KEYS = _.pickBy(keys, (value, key) => allowedKeys.includes(key));
      }
      return validateIOSBuildConstants(config, buildConfiguration);
    }
  });

  return result;
}

/**
 *  Adds IS_DEV_KERNEL (bool) and DEV_KERNEL_SOURCE (PUBLISHED, LOCAL)
 *  and errors if there's a problem with the chosen environment.
 */
function validateIOSBuildConstants(config, buildConfiguration) {
  config.USE_GENERATED_DEFAULTS = true;

  let IS_DEV_KERNEL,
    DEV_KERNEL_SOURCE = '';
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

async function generateAndroidBuildConstantsFromMacrosAsync(macros) {
  let source;

  // android falls back to published dev home if local dev home
  // doesn't exist or had an error.
  const isLocalManifestEmpty =
    !macros.BUILD_MACHINE_KERNEL_MANIFEST || macros.BUILD_MACHINE_KERNEL_MANIFEST === '';
  if (isLocalManifestEmpty) {
    macros.BUILD_MACHINE_KERNEL_MANIFEST = macros.DEV_PUBLISHED_KERNEL_MANIFEST;
    console.log('\n\nUsing published dev version of Expo Home\n\n');
  } else {
    console.log('\n\nUsing Expo Home from __internal__\n\n');
  }
  delete macros['DEV_PUBLISHED_KERNEL_MANIFEST'];

  let definitions = _.map(
    macros,
    (value, name) =>
      `  public static final ${formatJavaType(value)} ${name} = ${formatJavaLiteral(value)};`
  );
  source = `
package host.exp.exponent.generated;

public class ExponentBuildConstants {
${definitions.join('\n')}
}`;

  return (
    `
// Copyright 2016-present 650 Industries. All rights reserved.
// ${'@'}generated by tools-public/generate-dynamic-macros.js

${source.trim()}
`.trim() + '\n'
  );
}

function formatJavaType(value) {
  if (value == null) {
    return 'String';
  } else if (typeof value === 'string') {
    return 'String';
  } else if (typeof value === 'number') {
    return 'int';
  }
  throw new Error(`Unsupported literal value: ${value}`);
}

function formatJavaLiteral(value) {
  if (value == null) {
    return 'null';
  } else if (typeof value === 'string') {
    value = value.replace(/"/g, '\\"');
    return `"${value}"`;
  } else if (typeof value === 'number') {
    return value;
  }
  throw new Error(`Unsupported literal value: ${value}`);
}

async function generateMacrosAsync(platform, configuration) {
  let names = [];
  let promises = [];
  _.forEach(macrosFuncs, (func, name) => {
    names.push(name);
    promises.push(func(platform, configuration));
  });
  let values = await Promise.all(promises);

  let macros = {};
  for (let entry of names.entries()) {
    let ii = entry[0];
    let name = entry[1];
    macros[name] = values[ii];
  }
  return macros;
}

async function readExistingSourceAsync(filepath) {
  try {
    return await fs.readFile(filepath, 'utf8');
  } catch (e) {
    return null;
  }
}

async function copyTemplateFileAsync(source, dest, templateSubstitutions, configuration) {
  let promises = await Promise.all([
    readExistingSourceAsync(source),
    readExistingSourceAsync(dest),
  ]);
  let currentSourceFile = promises[0];
  let currentDestFile = promises[1];

  _.map(templateSubstitutions, (value, textToReplace) => {
    currentSourceFile = currentSourceFile.replace(
      new RegExp(`\\\$\\\{${textToReplace}\\\}`, 'g'),
      value
    );
  });

  if (configuration === 'debug') {
    currentSourceFile = currentSourceFile.replace(
      `<!-- ADD TEST PERMISSIONS HERE -->`,
      ANDROID_TEST_PERMISSIONS
    );
  }

  if (currentSourceFile !== currentDestFile) {
    await fs.writeFile(dest, currentSourceFile, 'utf8');
  }
}

async function modifyIOSInfoPlistAsync(path, filename, templateSubstitutions) {
  let result = await IosPlist.modifyAsync(path, filename, config => {
    if (templateSubstitutions.FABRIC_API_KEY) {
      config.Fabric = {
        APIKey: templateSubstitutions.FABRIC_API_KEY,
        Kits: [
          {
            KitInfo: {},
            KitName: 'Crashlytics',
          },
        ],
      };
    }
    return config;
  });
  return result;
}

async function getTemplateSubstitutions() {
  try {
    return await new JsonFile(path.join(EXPONENT_DIR, '__internal__', 'keys.json')).readAsync();
  } catch (e) {
    // Don't have __internal__, use public keys
    console.log('generate-dynamic-macros is falling back to `template-files/keys.json`');
    return await new JsonFile(path.join(EXPONENT_DIR, 'template-files', 'keys.json')).readAsync();
  }
}

async function writeIOSTemplatesAsync(
  platform,
  args,
  templateFilesPath,
  templateSubstitutions,
  iOSInfoPlistContents
) {
  await renderPodfileAsync(
    path.join(templateFilesPath, platform, 'Podfile'),
    path.join(EXPONENT_DIR, 'ios', 'Podfile'),
    {
      TARGET_NAME: 'Exponent',
      UNIVERSAL_MODULES: generateUniversalModulesConfig(
        EXPO_CLIENT_UNIVERSAL_MODULES,
        templateSubstitutions.UNIVERSAL_MODULES_PATH
      ),
      REACT_NATIVE_PATH: templateSubstitutions.REACT_NATIVE_PATH,
      REACT_NATIVE_EXPO_SUBSPECS: ['Expo', 'ExpoOptional'],
    }
  );

  // also render the Podfile for the OSS repo, if we're in universe
  // stubbed in to eliminate the step of running this script before building the client from expo/expo
  if (fs.existsSync(path.join(EXPONENT_DIR, 'ios', '__github__'))) {
    await renderPodfileAsync(
      path.join(templateFilesPath, platform, 'Podfile'),
      path.join(EXPONENT_DIR, 'ios', '__github__', 'Podfile'),
      {
        TARGET_NAME: 'Exponent',
        REACT_NATIVE_PATH: '../home/node_modules/react-native',
        UNIVERSAL_MODULES: generateUniversalModulesConfig(
          EXPO_CLIENT_UNIVERSAL_MODULES,
          '../modules/'
        ),
        REACT_NATIVE_EXPO_SUBSPECS: ['Expo', 'ExpoOptional'],
      }
    );
  }

  if (args.expoKitPath) {
    let expoKitPath = path.join(process.cwd(), args.expoKitPath);
    await renderExpoKitPodspecAsync(
      path.join(templateFilesPath, platform, 'ExpoKit.podspec'),
      path.join(expoKitPath, 'ExpoKit.podspec'),
      {
        IOS_EXPONENT_CLIENT_VERSION: iOSInfoPlistContents.CFBundleShortVersionString,
      }
    );
    await renderPodfileAsync(
      path.join(templateFilesPath, platform, 'ExpoKit-Podfile'),
      path.join(expoKitPath, 'exponent-view-template', 'ios', 'Podfile'),
      {
        TARGET_NAME: 'exponent-view-template',
        EXPOKIT_PATH: '../..',
        UNIVERSAL_MODULES: generateUniversalModulesConfig(
          EXPO_CLIENT_UNIVERSAL_MODULES,
          '../../modules'
        ),
        REACT_NATIVE_PATH: '../../react-native-lab/react-native',
      }
    );
  }
}

async function copyTemplateFilesAsync(platform, args, templateSubstitutions) {
  let templateFilesPath = path.join(EXPONENT_DIR, 'template-files');
  let templatePaths = await new JsonFile(
    path.join(templateFilesPath, `${platform}-paths.json`)
  ).readAsync();

  let promises = [];
  _.forEach(templatePaths, (dest, source) => {
    promises.push(
      copyTemplateFileAsync(
        path.join(templateFilesPath, platform, source),
        path.join(EXPONENT_DIR, dest, source),
        templateSubstitutions,
        args.configuration
      )
    );
  });

  await Promise.all(promises);
  if (platform === 'ios') {
    await writeIOSTemplatesAsync(
      platform,
      args,
      templateFilesPath,
      templateSubstitutions,
      args.infoPlist
    );
  }
}

async function generateBuildConfigAsync(platform, args) {
  const filepath = path.resolve(args.buildConstantsPath);
  const { configuration } = args;

  mkdir('-p', path.dirname(filepath));

  let macros = await generateMacrosAsync(platform, configuration);
  if (platform === 'android') {
    let result = await Promise.all([
      generateAndroidBuildConstantsFromMacrosAsync(macros),
      readExistingSourceAsync(filepath),
    ]);
    let source = result[0];
    let existingSource = result[1];

    if (source !== existingSource) {
      await fs.writeFile(filepath, source, 'utf8');
    }
  } else {
    await generateIOSBuildConstantsFromMacrosAsync(
      filepath,
      macros,
      configuration,
      args.infoPlist,
      args.templateSubstitutions
    );
  }
}

/**
 *  args:
 *    platform (ios|android)
 *    buildConstantsPath
 *  ios-only:
 *    configuration - optional but we behave differently if this is Debug
 *    infoPlistPath
 *    expoKitPath (optional - if provided, generate files for ExpoKit)
 */
exports.generateDynamicMacrosAsync = async function generateDynamicMacrosAsync(args) {
  try {
    const { platform } = args;
    const templateSubstitutions = await getTemplateSubstitutions();
    if (platform === 'ios') {
      const infoPlistPath = args.infoPlistPath;
      args.infoPlist = await modifyIOSInfoPlistAsync(infoPlistPath, 'Info', templateSubstitutions);
      args.templateSubstitutions = templateSubstitutions;
    } else {
      args.configuration =
        process.env.EXPO_ANDROID_GRADLE_TASK_NAMES &&
        process.env.EXPO_ANDROID_GRADLE_TASK_NAMES.includes('Debug')
          ? 'debug'
          : 'release';
    }

    await generateBuildConfigAsync(platform, args);
    await copyTemplateFilesAsync(platform, args, templateSubstitutions);
  } catch (error) {
    console.error(
      `There was an error while generating Expo template files, which could lead to unexpected behavior at runtime:\n${error.stack}`
    );
    process.exit(1);
  }
};

exports.cleanupDynamicMacrosAsync = async function cleanupDynamicMacrosAsync(args) {
  try {
    let platform = args.platform;
    if (platform === 'ios') {
      let infoPlistPath = args.infoPlistPath;
      await IosPlist.cleanBackupAsync(infoPlistPath, 'Info', true);
    }
  } catch (error) {
    console.error(`There was an error cleaning up Expo template files:\n${error.stack}`);
    process.exit(1);
  }
};

exports.runFabricIOSAsync = async function runFabricIOSAsync(args) {
  let templateSubstitutions = await getTemplateSubstitutions();
  try {
    let configFile = await new JsonFile(
      path.join(EXPONENT_DIR, 'ios', 'private-shell-app-config.json')
    ).readAsync();
    if (configFile && configFile.fabric && configFile.fabric.apiKey) {
      templateSubstitutions.FABRIC_API_KEY = configFile.fabric.apiKey;
    }

    if (configFile && configFile.fabric && configFile.fabric.buildSecret) {
      templateSubstitutions.FABRIC_API_SECRET = configFile.fabric.buildSecret;
    }
  } catch (e) {
    // don't have a config file, just use default keys
  }

  await spawnAsync(
    `/bin/sh`,
    [
      args.fabricPath,
      templateSubstitutions.FABRIC_API_KEY,
      templateSubstitutions.FABRIC_API_SECRET,
    ],
    {
      stdio: 'inherit',
      cwd: args.iosPath,
    }
  );
};
