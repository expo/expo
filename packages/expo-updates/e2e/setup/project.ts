#!/usr/bin/env yarn --silent ts-node --transpile-only

import spawnAsync from '@expo/spawn-async';
import { rmSync, existsSync } from 'fs';
import fs from 'fs/promises';
import nullthrows from 'nullthrows';
import path from 'path';

/*
 * Change this to your own Expo account name
 */
export const EXPO_ACCOUNT_NAME = process.env.EXPO_ACCOUNT_NAME || 'myusername';

/**
 * Repository root directory
 */
export const repoRoot = nullthrows(
  process.env.EXPO_REPO_ROOT || process.env.EAS_BUILD_WORKINGDIR,
  'EXPO_REPO_ROOT is not defined'
);

const dirName = __dirname; /* eslint-disable-line */

// Package dependencies in chunks based on peer dependencies.
function getExpoDependencyChunks({
  includeDevClient,
  includeTV,
  includeSplashScreen,
}: {
  includeDevClient: boolean;
  includeTV: boolean;
  includeSplashScreen: boolean;
}) {
  return [
    ['@expo/config-types', '@expo/env', '@expo/json-file'],
    ['@expo/config'],
    ['@expo/config-plugins'],
    ['expo-modules-core'],
    ['@expo/cli', 'expo', 'expo-asset', 'expo-modules-autolinking'],
    ['expo-manifests'],
    ['@expo/prebuild-config', '@expo/metro-config', 'expo-constants'],
    ['@expo/image-utils'],
    [
      'babel-preset-expo',
      'expo-application',
      'expo-device',
      'expo-eas-client',
      'expo-file-system',
      'expo-font',
      'expo-json-utils',
      'expo-keep-awake',
      'expo-status-bar',
      'expo-structured-headers',
      'expo-updates',
      'expo-updates-interface',
    ],
    ...(includeSplashScreen ? [['expo-splash-screen']] : []),
    ...(includeDevClient
      ? [['expo-dev-menu-interface'], ['expo-dev-menu'], ['expo-dev-launcher'], ['expo-dev-client']]
      : []),
    ...(includeTV
      ? [
          [
            'expo-audio',
            'expo-av',
            'expo-blur',
            'expo-crypto',
            'expo-image',
            'expo-linear-gradient',
            'expo-linking',
            'expo-localization',
            'expo-media-library',
            'expo-network',
            'expo-secure-store',
            'expo-symbols',
            'expo-system-ui',
            'expo-ui',
            'expo-video',
          ],
        ]
      : []),
  ];
}

function getExpoDependencyNamesForDependencyChunks(expoDependencyChunks: string[][]): string[] {
  return expoDependencyChunks.flat();
}

const expoResolutions: { [key: string]: string } = {};

/**
 * Executes `npm pack` on one of the Expo packages used in updates E2E
 * Adds a dateTime stamp to the version to ensure that it is unique and that
 * only this version will be used when yarn installs dependencies in the test app.
 */
async function packExpoDependency(
  repoRoot: string,
  projectRoot: string,
  destPath: string,
  dependencyName: string
) {
  // Pack up the named Expo package into the destination folder
  const dependencyComponents = dependencyName.split('/');
  let dependencyPath: string;
  if (dependencyComponents[0] === '@expo') {
    dependencyPath = path.resolve(
      repoRoot,
      'packages',
      dependencyComponents[0],
      dependencyComponents[1]
    );
  } else {
    dependencyPath = path.resolve(repoRoot, 'packages', dependencyComponents[0]);
  }

  // Save a copy of package.json
  const packageJsonPath = path.resolve(dependencyPath, 'package.json');
  const packageJsonCopyPath = `${packageJsonPath}-original`;
  await fs.copyFile(packageJsonPath, packageJsonCopyPath);
  // Extract the version from package.json
  const packageJson = require(packageJsonPath);
  const originalVersion = packageJson.version;
  // Add string to the version to ensure that yarn uses the tarball and not the published version
  const e2eVersion = `${originalVersion}-${new Date().getTime()}`;
  await fs.writeFile(
    packageJsonPath,
    JSON.stringify(
      {
        ...packageJson,
        version: e2eVersion,
      },
      null,
      2
    )
  );

  let dependencyTarballPath: string;
  try {
    dependencyTarballPath = await spawnNpmPackAsync({ cwd: dependencyPath, outputDir: destPath });
  } finally {
    // Restore the original package JSON
    await fs.copyFile(packageJsonCopyPath, packageJsonPath);
    await fs.rm(packageJsonCopyPath);
  }

  // Return the dependency in the form needed by package.json, as a relative path
  const dependency = `.${path.sep}${path.relative(projectRoot, dependencyTarballPath)}`;

  return {
    dependency,
    e2eVersion,
  };
}

async function spawnNpmPackAsync({
  cwd,
  outputDir,
}: {
  cwd: string;
  outputDir: string;
}): Promise<string> {
  const { stdout } = await spawnAsync(
    'npm',
    // Run `npm pack --json` without the script logging (see: https://github.com/npm/cli/issues/7354)
    ['--foreground-scripts=false', 'pack', '--json', '--pack-destination', outputDir],
    { cwd, stdio: 'pipe' }
  );

  // Validate the tarball output data
  const output = JSON.parse(stdout);
  if (output.length !== 1) {
    throw new Error(`Expected a single tarball to be created, received: ${output.length}`);
  }

  // Return the absolute path to the tarball
  return path.join(outputDir, output[0].filename);
}

async function copyCommonFixturesToProject(
  projectRoot: string,
  fileList: string[],
  {
    appJsFileName,
    repoRoot,
    isTV = false,
  }: { appJsFileName: string; repoRoot: string; isTV: boolean }
) {
  // copy App.tsx from test fixtures
  const appJsSourcePath = path.resolve(dirName, '..', 'fixtures', appJsFileName);
  const appJsDestinationPath = path.resolve(projectRoot, 'App.tsx');
  let appJsFileContents = await fs.readFile(appJsSourcePath, 'utf-8');
  appJsFileContents = appJsFileContents
    .replace('UPDATES_HOST', nullthrows(process.env.UPDATES_HOST))
    .replace('UPDATES_PORT', nullthrows(process.env.UPDATES_PORT));
  await fs.writeFile(appJsDestinationPath, appJsFileContents, 'utf-8');

  // pack up project files
  const projectFilesSourcePath = path.join(dirName, '..', 'fixtures', 'project_files');
  const projectFilesTarballPath = path.join(projectRoot, 'project_files.tgz');
  const tarArgs = ['zcf', projectFilesTarballPath, ...fileList];

  await spawnAsync('tar', tarArgs, {
    cwd: projectFilesSourcePath,
    stdio: 'inherit',
  });

  // unpack project files in project directory
  await spawnAsync('tar', ['zxf', projectFilesTarballPath], {
    cwd: projectRoot,
    stdio: 'inherit',
  });

  // remove project files archive
  await fs.rm(projectFilesTarballPath);

  // copy .prettierrc
  await fs.copyFile(path.resolve(repoRoot, '.prettierrc'), path.join(projectRoot, '.prettierrc'));

  // Modify specific files for TV
  if (isTV) {
    // Modify .detoxrc.json for TV
    const detoxRCPath = path.resolve(projectRoot, '.detoxrc.json');
    let detoxRCText = await fs.readFile(detoxRCPath, { encoding: 'utf-8' });
    detoxRCText = detoxRCText.replace(/iphonesim/g, 'appletvsim').replace('iPhone 14', 'Apple TV');
    await fs.rm(detoxRCPath);
    await fs.writeFile(detoxRCPath, detoxRCText, { encoding: 'utf-8' });

    // Add TV environment variable to EAS build config
    const easJsonPath = path.resolve(projectRoot, 'eas.json');
    let easJson = require(easJsonPath);
    easJson = {
      ...easJson,
      build: {
        ...easJson.build,
        updates_testing_debug: {
          ...easJson.build.updates_testing_debug,
          env: {
            ...easJson.build.updates_testing_debug.env,
            TEST_TV_BUILD: '1',
          },
        },
        updates_testing_release: {
          ...easJson.build.updates_testing_release,
          env: {
            ...easJson.build.updates_testing_release.env,
            TEST_TV_BUILD: '1',
          },
        },
      },
    };
    await fs.rm(easJsonPath);
    await fs.writeFile(easJsonPath, JSON.stringify(easJson, null, 2), { encoding: 'utf-8' });
  }
}

/**
 * Adds all the dependencies and other properties needed for the E2E test app
 */
async function preparePackageJson(
  projectRoot: string,
  repoRoot: string,
  configureE2E: boolean,
  isTV: boolean,
  shouldGenerateTestUpdateBundles: boolean,
  includeDevClient: boolean,
  useCustomInit: boolean
) {
  // Create the project subfolder to hold NPM tarballs built from the current state of the repo
  const dependenciesPath = path.join(projectRoot, 'dependencies');
  await fs.mkdir(dependenciesPath);

  const allDependencyChunks = getExpoDependencyChunks({
    includeDevClient,
    includeTV: isTV,
    includeSplashScreen: !useCustomInit,
  });

  console.time('Done packing dependencies');
  for (const dependencyChunk of allDependencyChunks) {
    await Promise.all(
      dependencyChunk.map(async (dependencyName) => {
        console.log(`Packing ${dependencyName}...`);
        console.time(`Packaged ${dependencyName}`);
        const result = await packExpoDependency(
          repoRoot,
          projectRoot,
          dependenciesPath,
          dependencyName
        );
        expoResolutions[dependencyName] = result.dependency;
        console.timeEnd(`Packaged ${dependencyName}`);
      })
    );
  }
  console.timeEnd('Done packing dependencies');

  const extraScriptsGenerateTestUpdateBundlesPart = shouldGenerateTestUpdateBundles
    ? {
        'generate-test-update-bundles': 'npx ts-node ./scripts/generate-test-update-bundles',
      }
    : {
        'generate-test-update-bundles': 'echo 1',
      };

  const extraScriptsAssetExclusion = {
    'reset-to-embedded':
      'npx ts-node ./scripts/reset-app.ts App.tsx.embedded; (rm -rf android/build android/app/build)',
    'set-to-update-1':
      'npx ts-node ./scripts/reset-app.ts App.tsx.update1; eas update --branch=main --message=Update1',
    'set-to-update-2':
      'npx ts-node ./scripts/reset-app.ts App.tsx.update2; eas update --branch=main --message=Update2',
  };

  // Additional scripts and dependencies for Detox testing
  const extraScripts = configureE2E
    ? {
        'detox:android:debug:build': 'detox build -c android.debug',
        'detox:android:debug:test': 'detox test -c android.debug',
        'detox:android:release:build': 'detox build -c android.release',
        'detox:android:release:test': 'detox test -c android.release',
        'detox:ios:debug:build': 'detox build -c ios.debug',
        'detox:ios:debug:test': 'detox test -c ios.debug',
        'detox:ios:release:build': 'detox build -c ios.release',
        'detox:ios:release:test': 'detox test -c ios.release',
        'eas-build-pre-install': './eas-hooks/eas-build-pre-install.sh',
        'eas-build-on-success': './eas-hooks/eas-build-on-success.sh',
        'check-android-emulator': 'npx ts-node ./scripts/check-android-emulator.ts',
        postinstall: 'patch-package',
        ...extraScriptsGenerateTestUpdateBundlesPart,
      }
    : extraScriptsAssetExclusion;

  const extraDevDependencies = configureE2E
    ? {
        '@config-plugins/detox': '^9.0.0',
        '@types/express': '^4.17.17',
        '@types/jest': '^29.4.0',
        detox: '^20.33.0',
        express: '^4.18.2',
        'form-data': '^4.0.0',
        jest: '^29.3.1',
        'jest-circus': '^29.3.1',
        prettier: '^2.8.1',
        'ts-jest': '^29.0.5',
        'patch-package': '^8.0.0',
      }
    : {};

  // Remove the default Expo dependencies from create-expo-app
  let packageJson = JSON.parse(await fs.readFile(path.join(projectRoot, 'package.json'), 'utf-8'));
  for (const dependencyName of getExpoDependencyNamesForDependencyChunks(allDependencyChunks)) {
    if (packageJson.dependencies[dependencyName]) {
      delete packageJson.dependencies[dependencyName];
    }
  }
  // Add dependencies and resolutions to package.json
  packageJson = {
    ...packageJson,
    scripts: {
      ...packageJson.scripts,
      ...extraScripts,
    },
    dependencies: {
      ...expoResolutions,
      ...packageJson.dependencies,
    },
    devDependencies: {
      '@types/react': '~19.0.10',
      ...extraDevDependencies,
      ...packageJson.devDependencies,
      'ts-node': '10.9.2',
      typescript: '5.8.3',
    },
    resolutions: {
      ...expoResolutions,
      ...packageJson.resolutions,
      typescript: '5.8.3',
      '@isaacs/cliui': 'npm:cliui@8.0.1', // Fix string-width ESM error
    },
  };

  if (isTV) {
    packageJson = {
      ...packageJson,
      dependencies: {
        ...packageJson.dependencies,
        'react-native': 'npm:react-native-tvos@0.79.1-0',
        '@react-native-tvos/config-tv': '^0.1.1',
      },
      expo: {
        install: {
          exclude: ['react-native', 'typescript'],
        },
      },
    };
  }

  const packageJsonString = JSON.stringify(packageJson, null, 2);
  await fs.writeFile(path.join(projectRoot, 'package.json'), packageJsonString, 'utf-8');
}

/**
 * Adds Detox modules to both iOS and Android expo-updates code.
 * Returns a function that cleans up these changes to the repo once E2E setup is complete
 */
async function prepareLocalUpdatesModule(repoRoot: string) {
  // copy UpdatesE2ETest exported module into the local package
  const iosE2ETestModuleSwiftPath = path.join(
    repoRoot,
    'packages',
    'expo-updates',
    'ios',
    'EXUpdates',
    'E2ETestModule.swift'
  );
  const androidE2ETestModuleKTPath = path.join(
    repoRoot,
    'packages',
    'expo-updates',
    'android',
    'src',
    'main',
    'java',
    'expo',
    'modules',
    'updates',
    'UpdatesE2ETestModule.kt'
  );
  await fs.copyFile(
    path.resolve(dirName, '..', 'fixtures', 'E2ETestModule.swift'),
    iosE2ETestModuleSwiftPath
  );
  await fs.copyFile(
    path.resolve(dirName, '..', 'fixtures', 'UpdatesE2ETestModule.kt'),
    androidE2ETestModuleKTPath
  );

  // Add E2ETestModule to expo-module.config.json
  const expoModuleConfigFilePath = path.join(
    repoRoot,
    'packages',
    'expo-updates',
    'expo-module.config.json'
  );
  const originalExpoModuleConfigJsonString = await fs.readFile(expoModuleConfigFilePath, 'utf-8');
  const originalExpoModuleConfig = JSON.parse(originalExpoModuleConfigJsonString);
  const expoModuleConfig = {
    ...originalExpoModuleConfig,
    apple: {
      ...originalExpoModuleConfig.apple,
      modules: [...originalExpoModuleConfig.apple.modules, 'E2ETestModule'],
    },
    android: {
      ...originalExpoModuleConfig.android,
      modules: [
        ...originalExpoModuleConfig.android.modules,
        'expo.modules.updates.UpdatesE2ETestModule',
      ],
    },
  };
  await fs.writeFile(expoModuleConfigFilePath, JSON.stringify(expoModuleConfig, null, 2), 'utf-8');

  // Return cleanup function
  return async () => {
    await fs.writeFile(expoModuleConfigFilePath, originalExpoModuleConfigJsonString, 'utf-8');
    await fs.rm(iosE2ETestModuleSwiftPath, { force: true });
    await fs.rm(androidE2ETestModuleKTPath, { force: true });
  };
}

/**
 * Modifies app.json in the E2E test app to add the properties we need
 */
function transformAppJsonForE2E(
  appJson: any,
  projectName: string,
  runtimeVersion: string,
  isTV: boolean
) {
  const plugins: any[] = [
    'expo-updates',
    [
      '@config-plugins/detox',
      {
        subdomains: Array.from(new Set(['10.0.2.2', 'localhost', process.env.UPDATES_HOST])),
      },
    ],
  ];
  if (isTV) {
    plugins.push([
      '@react-native-tvos/config-tv',
      {
        isTV: true,
        tvosDeploymentTarget: '15.1',
        showVerboseWarnings: true,
      },
    ]);
  }
  return {
    ...appJson,
    expo: {
      ...appJson.expo,
      name: projectName,
      owner: 'expo-ci',
      runtimeVersion,
      plugins,
      newArchEnabled: true,
      android: { ...appJson.expo.android, package: 'dev.expo.updatese2e' },
      ios: { ...appJson.expo.ios, bundleIdentifier: 'dev.expo.updatese2e' },
      updates: {
        ...appJson.expo.updates,
        url: `http://${process.env.UPDATES_HOST}:${process.env.UPDATES_PORT}/update`,
        assetPatternsToBeBundled: ['includedAssets/*'],
        useNativeDebug: true,
      },
      extra: {
        eas: {
          projectId: '55685a57-9cf3-442d-9ba8-65c7b39849ef',
        },
      },
    },
  };
}

export function transformAppJsonForE2EWithOldArch(
  appJson: any,
  projectName: string,
  runtimeVersion: string,
  isTV: boolean
) {
  const transformedForE2E = transformAppJsonForE2E(appJson, projectName, runtimeVersion, isTV);
  return {
    ...transformedForE2E,
    expo: {
      ...transformedForE2E.expo,
      newArchEnabled: false,
    },
  };
}

/**
 * Modifies app.json in the E2E test app to add the properties we need, and sets the runtime version policy to fingerprint
 */
export function transformAppJsonForE2EWithFingerprint(
  appJson: any,
  projectName: string,
  runtimeVersion: string,
  isTV: boolean
) {
  const transformedForE2E = transformAppJsonForE2EWithFallbackToCacheTimeout(
    appJson,
    projectName,
    runtimeVersion,
    isTV
  );
  return {
    ...transformedForE2E,
    expo: {
      ...transformedForE2E.expo,
      runtimeVersion: {
        policy: 'fingerprint',
      },
    },
  };
}

export function transformAppJsonForE2EWithBrickingMeasuresDisabled(
  appJson: any,
  projectName: string,
  runtimeVersion: string,
  isTV: boolean
) {
  const transformedForE2E = transformAppJsonForE2EWithFallbackToCacheTimeout(
    appJson,
    projectName,
    runtimeVersion,
    isTV
  );
  return {
    ...transformedForE2E,
    expo: {
      ...transformedForE2E.expo,
      updates: {
        ...transformedForE2E.expo.updates,
        disableAntiBrickingMeasures: true,
      },
    },
  };
}

/**
 * Modifies app.json in the E2E test app to add the properties we need, plus a fallback to cache timeout for testing startup procedure
 */
export function transformAppJsonForE2EWithFallbackToCacheTimeout(
  appJson: any,
  projectName: string,
  runtimeVersion: string,
  isTV: boolean
) {
  const transformedForE2E = transformAppJsonForE2E(appJson, projectName, runtimeVersion, isTV);
  return {
    ...transformedForE2E,
    expo: {
      ...transformedForE2E.expo,
      updates: {
        ...transformedForE2E.expo.updates,
        fallbackToCacheTimeout: 5000,
      },
    },
  };
}

/**
 * Modifies app.json in the updates-disabled E2E test app to add the properties we need
 */
export function transformAppJsonForUpdatesDisabledE2E(
  appJson: any,
  projectName: string,
  runtimeVersion: string
) {
  const plugins: any[] = [
    'expo-updates',
    [
      '@config-plugins/detox',
      {
        subdomains: Array.from(new Set(['10.0.2.2', 'localhost', process.env.UPDATES_HOST])),
      },
    ],
  ];
  return {
    ...appJson,
    expo: {
      ...appJson.expo,
      name: projectName,
      owner: 'expo-ci',
      runtimeVersion,
      plugins,
      newArchEnabled: true,
      android: { ...appJson.expo.android, package: 'dev.expo.updatese2e' },
      ios: { ...appJson.expo.ios, bundleIdentifier: 'dev.expo.updatese2e' },
      updates: {
        enabled: false,
        useNativeDebug: true,
      },
      extra: {
        eas: {
          projectId: '55685a57-9cf3-442d-9ba8-65c7b39849ef',
        },
      },
    },
  };
}

async function configureUpdatesSigningAsync(projectRoot: string) {
  console.time('generate and configure code signing');
  // generate and configure code signing
  await spawnAsync(
    'yarn',
    [
      'expo-updates',
      'codesigning:generate',
      '--key-output-directory',
      'keys',
      '--certificate-output-directory',
      'certs',
      '--certificate-validity-duration-years',
      '1',
      '--certificate-common-name',
      'E2E Test App',
    ],
    { cwd: projectRoot, stdio: 'inherit' }
  );

  await spawnAsync(
    'yarn',
    [
      'expo-updates',
      'codesigning:configure',
      '--certificate-input-directory',
      'certs',
      '--key-input-directory',
      'keys',
    ],
    { cwd: projectRoot, stdio: 'inherit' }
  );
  // Archive the keys so that they are not filtered out when uploading to EAS
  await spawnAsync('tar', ['cf', 'keys.tar', 'keys'], { cwd: projectRoot, stdio: 'inherit' });

  console.timeEnd('generate and configure code signing');
}

export async function initAsync(
  projectRoot: string,
  {
    repoRoot,
    runtimeVersion,
    localCliBin,
    configureE2E = true,
    transformAppJson = transformAppJsonForE2E,
    isTV = false,
    shouldGenerateTestUpdateBundles = true,
    shouldConfigureCodeSigning = true,
    includeDevClient = false,
    useCustomInit = false,
  }: {
    repoRoot: string;
    runtimeVersion: string;
    localCliBin: string;
    configureE2E?: boolean;
    transformAppJson?: (
      appJson: any,
      projectName: string,
      runtimeVersion: string,
      isTV: boolean
    ) => void;
    isTV?: boolean;
    shouldGenerateTestUpdateBundles?: boolean;
    shouldConfigureCodeSigning?: boolean;
    includeDevClient?: boolean;
    useCustomInit?: boolean;
  }
) {
  console.log('Creating expo app');
  const workingDir = path.dirname(projectRoot);
  const projectName = path.basename(projectRoot);

  if (!process.env.CI && existsSync(projectRoot)) {
    console.log(`Deleting existing project at ${projectRoot}...`);
    rmSync(projectRoot, { recursive: true, force: true });
  }

  // pack typescript template
  const templateName = 'expo-template-blank-typescript';
  const localTSTemplatePath = path.join(repoRoot, 'templates', templateName);
  const localTSTemplatePathName = await spawnNpmPackAsync({
    cwd: localTSTemplatePath,
    outputDir: repoRoot,
  });

  // initialize project (do not do NPM install, we do that later)
  await spawnAsync(
    'yarn',
    [
      'create',
      'expo-app',
      projectName,
      '--yes',
      '--no-install',
      '--template',
      localTSTemplatePathName,
    ],
    {
      cwd: workingDir,
      stdio: 'inherit',
    }
  );

  // We are done with template tarball
  await fs.rm(localTSTemplatePathName);

  let cleanupLocalUpdatesModule: (() => Promise<void>) | undefined;
  if (configureE2E) {
    cleanupLocalUpdatesModule = await prepareLocalUpdatesModule(repoRoot);
  }

  await preparePackageJson(
    projectRoot,
    repoRoot,
    configureE2E,
    isTV,
    shouldGenerateTestUpdateBundles,
    includeDevClient,
    useCustomInit
  );

  // configure app.json
  let appJson = JSON.parse(await fs.readFile(path.join(projectRoot, 'app.json'), 'utf-8'));
  appJson = transformAppJson(appJson, projectName, runtimeVersion, isTV);
  await fs.writeFile(path.join(projectRoot, 'app.json'), JSON.stringify(appJson, null, 2), 'utf-8');

  // Install node modules with local tarballs
  await spawnAsync('yarn', [], {
    cwd: projectRoot,
    stdio: 'inherit',
  });

  if (configureE2E && shouldConfigureCodeSigning) {
    await configureUpdatesSigningAsync(projectRoot);
  }

  // pack local template and prebuild, but do not reinstall NPM
  const prebuildTemplateName = 'expo-template-bare-minimum';

  const localTemplatePath = path.join(repoRoot, 'templates', prebuildTemplateName);
  const localTemplatePathName = await spawnNpmPackAsync({
    cwd: localTemplatePath,
    outputDir: projectRoot,
  });

  await spawnAsync(localCliBin, ['prebuild', '--no-install', '--template', localTemplatePathName], {
    env: {
      ...process.env,
      EXPO_DEBUG: '1',
      CI: '1',
    },
    cwd: projectRoot,
    stdio: 'inherit',
  });

  // We are done with template tarball
  await fs.rm(localTemplatePathName);

  // Restore expo dependencies after prebuild
  const packageJsonPath = path.resolve(projectRoot, 'package.json');
  let packageJsonString = await fs.readFile(packageJsonPath, 'utf-8');
  const packageJson = JSON.parse(packageJsonString);
  packageJson.dependencies.expo = packageJson.resolutions.expo;
  packageJsonString = JSON.stringify(packageJson, null, 2);
  await fs.rm(packageJsonPath);
  await fs.writeFile(packageJsonPath, packageJsonString, 'utf-8');
  await spawnAsync('yarn', [], {
    cwd: projectRoot,
    stdio: 'inherit',
  });

  // enable proguard on Android, and custom init if needed
  await fs.appendFile(
    path.join(projectRoot, 'android', 'gradle.properties'),
    `\nandroid.enableProguardInReleaseBuilds=true${useCustomInit ? '\nEX_UPDATES_CUSTOM_INIT=true' : ''}`,
    'utf-8'
  );

  // Append additional Proguard rule for Detox 20
  await fs.appendFile(
    path.join(projectRoot, 'android', 'app', 'proguard-rules.pro'),
    [
      '',
      '-keep class org.apache.commons.** { *; }',
      '-dontwarn androidx.appcompat.graphics.drawable.DrawableWrapper',
      '-dontwarn com.facebook.react.views.slider.**',
      '-dontwarn javax.lang.model.element.Modifier',
      '-dontwarn org.checkerframework.checker.nullness.qual.EnsuresNonNullIf',
      '-dontwarn org.checkerframework.dataflow.qual.Pure',
      '-keep class com.google.common.util.concurrent.ListenableFuture { *; }',
      '',
    ].join('\n'),
    'utf-8'
  );

  // Add custom init to iOS Podfile.properties.json if needed
  if (useCustomInit) {
    const podfilePropertiesJsonPath = path.join(projectRoot, 'ios', 'Podfile.properties.json');
    const podfilePropertiesJsonString = await fs.readFile(podfilePropertiesJsonPath, {
      encoding: 'utf-8',
    });
    const podfilePropertiesJson: any = JSON.parse(podfilePropertiesJsonString);
    podfilePropertiesJson.updatesCustomInit = 'true';
    await fs.writeFile(podfilePropertiesJsonPath, JSON.stringify(podfilePropertiesJson, null, 2), {
      encoding: 'utf-8',
    });
  }

  const customInitSourcesDirectory = path.join(
    repoRoot,
    'packages',
    'expo-updates',
    'e2e',
    'fixtures',
    'custom_init'
  );
  // If custom init, copy native source files
  if (useCustomInit) {
    const filesToCopyForCustomInit = [
      {
        sourcePath: path.join(customInitSourcesDirectory, 'AppDelegate.swift'),
        destPath: path.join(projectRoot, 'ios', 'updatese2e', 'AppDelegate.swift'),
      },
      {
        sourcePath: path.join(customInitSourcesDirectory, 'MainApplication.kt'),
        destPath: path.join(
          projectRoot,
          'android',
          'app',
          'src',
          'main',
          'java',
          'dev',
          'expo',
          'updatese2e',
          'MainApplication.kt'
        ),
      },
      {
        sourcePath: path.join(customInitSourcesDirectory, 'MainActivity.kt'),
        destPath: path.join(
          projectRoot,
          'android',
          'app',
          'src',
          'main',
          'java',
          'dev',
          'expo',
          'updatese2e',
          'MainActivity.kt'
        ),
      },
    ];
    for (const fileToCopy of filesToCopyForCustomInit) {
      await fs.copyFile(fileToCopy.sourcePath, fileToCopy.destPath);
    }
  }

  await fs.appendFile(
    path.join(projectRoot, 'android', 'app', 'build.gradle'),
    [
      '',
      '// [Detox] AGP 8 fixed the `testProguardFiles` for androidTest',
      'android.buildTypes.release {',
      '   testProguardFiles "proguard-rules.pro"',
      '}',
      '',
    ].join('\n'),
    'utf-8'
  );

  // Cleanup local updates module if needed
  if (cleanupLocalUpdatesModule) {
    await cleanupLocalUpdatesModule();
  }

  return projectRoot;
}

export async function setupE2EAppAsync(
  projectRoot: string,
  { localCliBin, repoRoot, isTV = false }: { localCliBin: string; repoRoot: string; isTV?: boolean }
) {
  await copyCommonFixturesToProject(
    projectRoot,
    ['tsconfig.json', '.detoxrc.json', 'eas.json', 'eas-hooks', 'e2e', 'includedAssets', 'scripts'],
    { appJsFileName: 'App.tsx', repoRoot, isTV }
  );

  // install extra fonts package
  await spawnAsync(localCliBin, ['install', '@expo-google-fonts/inter'], {
    cwd: projectRoot,
    stdio: 'inherit',
  });

  // Copy Detox test file to e2e/tests directory
  await fs.copyFile(
    path.resolve(dirName, '..', 'fixtures', 'Updates.e2e.ts'),
    path.join(projectRoot, 'e2e', 'tests', 'Updates.e2e.ts')
  );
}

export async function setupManualTestAppAsync(projectRoot: string, repoRoot: string) {
  // Copy API test app and other fixtures to project
  await copyCommonFixturesToProject(
    projectRoot,
    ['tsconfig.json', 'assetsInUpdates', 'embeddedAssets', 'scripts'],
    { appJsFileName: 'App-apitest.tsx', repoRoot, isTV: false }
  );

  const projectName = path.basename(projectRoot);

  // disable JS debugging on Android
  const mainApplicationPath = path.join(
    projectRoot,
    'android',
    'app',
    'src',
    'main',
    'java',
    'com',
    EXPO_ACCOUNT_NAME,
    projectName,
    'MainApplication.kt'
  );
  const mainApplicationText = await fs.readFile(mainApplicationPath, { encoding: 'utf-8' });
  const mainApplicationTextModified = mainApplicationText.replace('BuildConfig.DEBUG', 'false');
  await fs.writeFile(mainApplicationPath, mainApplicationTextModified, { encoding: 'utf-8' });
}

export async function setupUpdatesDisabledE2EAppAsync(
  projectRoot: string,
  { localCliBin, repoRoot }: { localCliBin: string; repoRoot: string }
) {
  await copyCommonFixturesToProject(
    projectRoot,
    ['tsconfig.json', '.detoxrc.json', 'eas.json', 'eas-hooks', 'e2e', 'includedAssets', 'scripts'],
    {
      appJsFileName: 'App-updates-disabled.tsx',
      repoRoot,
      isTV: false,
    }
  );

  // install extra fonts package
  await spawnAsync(localCliBin, ['install', '@expo-google-fonts/inter'], {
    cwd: projectRoot,
    stdio: 'inherit',
  });

  // Copy Detox test file to e2e/tests directory
  await fs.copyFile(
    path.resolve(dirName, '..', 'fixtures', 'Updates-disabled.e2e.ts'),
    path.join(projectRoot, 'e2e', 'tests', 'Updates.e2e.ts')
  );
}

export async function setupUpdatesErrorRecoveryE2EAppAsync(
  projectRoot: string,
  { localCliBin, repoRoot }: { localCliBin: string; repoRoot: string }
) {
  await copyCommonFixturesToProject(
    projectRoot,
    ['tsconfig.json', '.detoxrc.json', 'eas.json', 'eas-hooks', 'e2e', 'includedAssets', 'scripts'],
    { appJsFileName: 'App.tsx', repoRoot, isTV: false }
  );

  // install extra fonts package
  await spawnAsync(localCliBin, ['install', '@expo-google-fonts/inter'], {
    cwd: projectRoot,
    stdio: 'inherit',
  });

  // Copy Detox test file to e2e/tests directory
  await fs.copyFile(
    path.resolve(dirName, '..', 'fixtures', 'Updates-error-recovery.e2e.ts'),
    path.join(projectRoot, 'e2e', 'tests', 'Updates.e2e.ts')
  );
}

export async function setupUpdatesFingerprintE2EAppAsync(
  projectRoot: string,
  { localCliBin, repoRoot }: { localCliBin: string; repoRoot: string }
) {
  await copyCommonFixturesToProject(
    projectRoot,
    [
      'tsconfig.json',
      '.fingerprintignore',
      '.detoxrc.json',
      'eas.json',
      'eas-hooks',
      'e2e',
      'includedAssets',
      'scripts',
    ],
    { appJsFileName: 'App.tsx', repoRoot, isTV: false }
  );

  // install extra fonts package
  await spawnAsync(localCliBin, ['install', '@expo-google-fonts/inter'], {
    cwd: projectRoot,
    stdio: 'inherit',
  });

  // Copy Detox test file to e2e/tests directory
  await fs.copyFile(
    path.resolve(dirName, '..', 'fixtures', 'Updates-fingerprint.e2e.ts'),
    path.join(projectRoot, 'e2e', 'tests', 'Updates.e2e.ts')
  );
}

export async function setupUpdatesStartupE2EAppAsync(
  projectRoot: string,
  { localCliBin, repoRoot }: { localCliBin: string; repoRoot: string }
) {
  await copyCommonFixturesToProject(
    projectRoot,
    ['tsconfig.json', '.detoxrc.json', 'eas.json', 'eas-hooks', 'e2e', 'includedAssets', 'scripts'],
    { appJsFileName: 'App.tsx', repoRoot, isTV: false }
  );

  // install extra fonts package
  await spawnAsync(localCliBin, ['install', '@expo-google-fonts/inter'], {
    cwd: projectRoot,
    stdio: 'inherit',
  });

  // Copy Detox test file to e2e/tests directory
  await fs.copyFile(
    path.resolve(dirName, '..', 'fixtures', 'Updates-startup.e2e.ts'),
    path.join(projectRoot, 'e2e', 'tests', 'Updates.e2e.ts')
  );
}

export async function setupUpdatesBrickingMeasuresDisabledE2EAppAsync(
  projectRoot: string,
  { localCliBin, repoRoot }: { localCliBin: string; repoRoot: string }
) {
  await copyCommonFixturesToProject(
    projectRoot,
    ['tsconfig.json', '.detoxrc.json', 'eas.json', 'eas-hooks', 'e2e', 'includedAssets', 'scripts'],
    { appJsFileName: 'App.tsx', repoRoot, isTV: false }
  );

  // install extra fonts package
  await spawnAsync(localCliBin, ['install', '@expo-google-fonts/inter'], {
    cwd: projectRoot,
    stdio: 'inherit',
  });

  // Copy Detox test file to e2e/tests directory
  await fs.copyFile(
    path.resolve(dirName, '..', 'fixtures', 'Updates-bricking-measures-disabled.e2e.ts'),
    path.join(projectRoot, 'e2e', 'tests', 'Updates.e2e.ts')
  );
}

export async function setupUpdatesDevClientE2EAppAsync(
  projectRoot: string,
  { localCliBin, repoRoot }: { localCliBin: string; repoRoot: string }
) {
  await copyCommonFixturesToProject(
    projectRoot,
    ['tsconfig.json', '.detoxrc.json', 'eas.json', 'eas-hooks', 'e2e', 'includedAssets', 'scripts'],
    { appJsFileName: 'App.tsx', repoRoot, isTV: false }
  );

  // install extra fonts package
  await spawnAsync(localCliBin, ['install', '@expo-google-fonts/inter'], {
    cwd: projectRoot,
    stdio: 'inherit',
  });

  // Copy Detox test file to e2e/tests directory
  await fs.copyFile(
    path.resolve(dirName, '..', 'fixtures', 'Updates-dev-client.e2e.ts'),
    path.join(projectRoot, 'e2e', 'tests', 'Updates.e2e.ts')
  );
}
