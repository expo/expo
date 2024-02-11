#!/usr/bin/env yarn --silent ts-node --transpile-only

import spawnAsync from '@expo/spawn-async';
import { rmSync, existsSync } from 'fs';
import fs from 'fs/promises';
import glob from 'glob';
import nullthrows from 'nullthrows';
import path from 'path';

const dirName = __dirname; /* eslint-disable-line */

// Package dependencies in chunks based on peer dependencies.
function getExpoDependencyChunks({
  includeDevClient,
  includeTV,
}: {
  includeDevClient: boolean;
  includeTV: boolean;
}) {
  return [
    ['@expo/config-types', '@expo/env'],
    ['@expo/config'],
    [
      '@expo/cli',
      '@expo/config-plugins',
      'expo',
      'expo-asset',
      'expo-modules-core',
      'expo-modules-autolinking',
    ],
    ['@expo/prebuild-config', '@expo/metro-config', 'expo-constants'],
    [
      'babel-preset-expo',
      'expo-application',
      'expo-device',
      'expo-eas-client',
      'expo-file-system',
      'expo-font',
      'expo-json-utils',
      'expo-keep-awake',
      'expo-manifests',
      'expo-splash-screen',
      'expo-status-bar',
      'expo-structured-headers',
      'expo-updates',
      'expo-updates-interface',
    ],
    ...(includeDevClient
      ? [['expo-dev-menu-interface'], ['expo-dev-menu'], ['expo-dev-launcher'], ['expo-dev-client']]
      : []),
    ...(includeTV ? [['expo-av', 'expo-blur', 'expo-image', 'expo-linear-gradient', 'expo-localization']] : []),
  ];
}

function getExpoDependencyNamesForDependencyChunks(expoDependencyChunks: string[][]): string[] {
  return expoDependencyChunks.flat();
}

const expoResolutions = {};

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

  try {
    await spawnAsync('npm', ['pack', '--pack-destination', destPath], {
      cwd: dependencyPath,
      stdio: process.env.CI ? 'ignore' : 'pipe',
    });
  } finally {
    // Restore the original package JSON
    await fs.copyFile(packageJsonCopyPath, packageJsonPath);
    await fs.rm(packageJsonCopyPath);
  }

  // Ensure the file was created as expected
  const dependencyTarballName =
    dependencyComponents[0] === '@expo'
      ? `expo-${dependencyComponents[1]}`
      : `${dependencyComponents[0]}`;
  const dependencyTarballPath = glob.sync(path.join(destPath, `${dependencyTarballName}-*.tgz`))[0];

  if (!dependencyTarballPath) {
    throw new Error(`Failed to locate packed ${dependencyName} in ${destPath}`);
  }

  // Return the dependency in the form needed by package.json, as a relative path
  const dependency = `.${path.sep}${path.relative(projectRoot, dependencyTarballPath)}`;

  return {
    dependency,
    e2eVersion,
  };
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
  includeDevClient: boolean
) {
  // Create the project subfolder to hold NPM tarballs built from the current state of the repo
  const dependenciesPath = path.join(projectRoot, 'dependencies');
  await fs.mkdir(dependenciesPath);

  const allDependencyChunks = getExpoDependencyChunks({ includeDevClient, includeTV: isTV });

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
        ...extraScriptsGenerateTestUpdateBundlesPart,
      }
    : extraScriptsAssetExclusion;

  const extraDevDependencies = configureE2E
    ? {
        '@config-plugins/detox': '^5.0.1',
        '@types/express': '^4.17.17',
        '@types/jest': '^29.4.0',
        detox: '^20.4.0',
        express: '^4.18.2',
        'form-data': '^4.0.0',
        jest: '^29.3.1',
        'jest-circus': '^29.3.1',
        prettier: '^2.8.1',
        'ts-jest': '^29.0.5',
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
      '@types/react': '~18.0.14',
      '@types/react-native': '~0.70.6',
      ...extraDevDependencies,
      ...packageJson.devDependencies,
      'ts-node': '10.9.1',
      typescript: '5.2.2',
    },
    resolutions: {
      ...expoResolutions,
      ...packageJson.resolutions,
      typescript: '5.2.2',
      '@isaacs/cliui': 'npm:cliui@8.0.1', // Fix string-width ESM error
    },
  };

  if (isTV) {
    packageJson = {
      ...packageJson,
      dependencies: {
        ...packageJson.dependencies,
        'react-native': 'npm:react-native-tvos@~0.72.6-0',
        '@react-native-tvos/config-tv': '~0.0.2',
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
  const plugins: any[] = ['expo-updates', '@config-plugins/detox'];
  if (isTV) {
    plugins.push([
      '@react-native-tvos/config-tv',
      {
        isTV: true,
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
      android: { ...appJson.expo.android, package: 'dev.expo.updatese2e' },
      ios: { ...appJson.expo.ios, bundleIdentifier: 'dev.expo.updatese2e' },
      updates: {
        ...appJson.expo.updates,
        url: `http://${process.env.UPDATES_HOST}:${process.env.UPDATES_PORT}/update`,
      },
      extra: {
        updates: {
          assetPatternsToBeBundled: ['includedAssets/*'],
        },
        eas: {
          projectId: '55685a57-9cf3-442d-9ba8-65c7b39849ef',
        },
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
  const plugins: any[] = ['expo-updates', '@config-plugins/detox'];
  return {
    ...appJson,
    expo: {
      ...appJson.expo,
      name: projectName,
      owner: 'expo-ci',
      runtimeVersion,
      plugins,
      android: { ...appJson.expo.android, package: 'dev.expo.updatese2e' },
      ios: { ...appJson.expo.ios, bundleIdentifier: 'dev.expo.updatese2e' },
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
  await spawnAsync('npm', ['pack', '--pack-destination', repoRoot], {
    cwd: localTSTemplatePath,
    stdio: 'ignore',
  });

  const localTSTemplatePathName = glob.sync(path.join(repoRoot, `${templateName}-*.tgz`))[0];

  if (!localTSTemplatePathName) {
    throw new Error(`Failed to locate packed template in ${repoRoot}`);
  }

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
    includeDevClient
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
  await spawnAsync('npm', ['pack', '--pack-destination', projectRoot], {
    cwd: localTemplatePath,
    stdio: 'ignore',
  });

  const localTemplatePathName = glob.sync(
    path.join(projectRoot, `${prebuildTemplateName}-*.tgz`)
  )[0];

  if (!localTemplatePathName) {
    throw new Error(`Failed to locate packed template in ${projectRoot}`);
  }

  await spawnAsync(localCliBin, ['prebuild', '--no-install', '--template', localTemplatePathName], {
    env: {
      ...process.env,
      EX_UPDATES_NATIVE_DEBUG: '1',
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

  // enable proguard on Android
  await fs.appendFile(
    path.join(projectRoot, 'android', 'gradle.properties'),
    '\nandroid.enableProguardInReleaseBuilds=true\nandroid.kotlinVersion=1.8.20\nEXPO_UPDATES_NATIVE_DEBUG=true',
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
      '',
    ].join('\n'),
    'utf-8'
  );
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

  // disable JS debugging on Android
  const mainApplicationPath = path.join(
    projectRoot,
    'android',
    'app',
    'src',
    'main',
    'java',
    'com',
    'douglowderexpo',
    'MyUpdateableApp',
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
