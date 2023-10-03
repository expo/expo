const spawnAsync = require('@expo/spawn-async');
const fs = require('fs/promises');
const glob = require('glob');
const path = require('path');

const dirName = __dirname; /* eslint-disable-line */

const expoDependencyNames = [
  'expo',
  '@expo/cli',
  '@expo/config-plugins',
  '@expo/config-types',
  '@expo/dev-server',
  '@expo/prebuild-config',
  '@expo/use-updates',
  'expo-application',
  'expo-constants',
  'expo-eas-client',
  'expo-file-system',
  'expo-font',
  'expo-json-utils',
  'expo-keep-awake',
  'expo-manifests',
  'expo-modules-autolinking',
  'expo-modules-core',
  'expo-splash-screen',
  'expo-status-bar',
  'expo-structured-headers',
  'expo-updates',
  'expo-updates-interface',
];

const expoResolutions = {};
const expoVersions = {};

/**
 * Executes `npm pack` on one of the Expo packages used in updates E2E
 * Adds a dateTime stamp to the version to ensure that it is unique and that
 * only this version will be used when yarn installs dependencies in the test app.
 */
async function packExpoDependency(repoRoot, projectRoot, destPath, dependencyName) {
  // Pack up the named Expo package into the destination folder
  const dependencyComponents = dependencyName.split('/');
  let dependencyPath;
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

  await spawnAsync('npm', ['pack', '--pack-destination', destPath], {
    cwd: dependencyPath,
    stdio: 'ignore',
  });

  // Ensure the file was created as expected
  const dependencyTarballName =
    dependencyComponents[0] === '@expo'
      ? `expo-${dependencyComponents[1]}`
      : `${dependencyComponents[0]}`;
  const dependencyTarballPath = glob.sync(path.join(destPath, `${dependencyTarballName}-*.tgz`))[0];

  if (!dependencyTarballPath) {
    throw new Error(`Failed to locate packed ${dependencyName} in ${destPath}`);
  }

  // Restore the original package JSON
  await fs.copyFile(packageJsonCopyPath, packageJsonPath);
  await fs.rm(packageJsonCopyPath);

  // Return the dependency in the form needed by package.json, as a relative path
  const dependency = `.${path.sep}${path.relative(projectRoot, dependencyTarballPath)}`;
  return {
    dependency,
    e2eVersion,
  };
}

async function copyCommonFixturesToProject(projectRoot, appJsFileName, repoRoot) {
  // copy App.tsx from test fixtures
  const appJsSourcePath = path.resolve(dirName, '..', 'fixtures', appJsFileName);
  const appJsDestinationPath = path.resolve(projectRoot, 'App.tsx');
  let appJsFileContents = await fs.readFile(appJsSourcePath, 'utf-8');
  appJsFileContents = appJsFileContents
    .replace('UPDATES_HOST', process.env.UPDATES_HOST)
    .replace('UPDATES_PORT', process.env.UPDATES_PORT);
  await fs.writeFile(appJsDestinationPath, appJsFileContents, 'utf-8');

  // pack up project files
  const projectFilesSourcePath = path.join(dirName, '..', 'fixtures', 'project_files');
  const projectFilesTarballPath = path.join(projectRoot, 'project_files.tgz');
  await spawnAsync(
    'tar',
    [
      'zcf',
      projectFilesTarballPath,
      'tsconfig.json',
      '.detoxrc.json',
      'detox.config.js',
      'eas.json',
      'eas-hooks',
      'e2e',
      'scripts',
    ],
    {
      cwd: projectFilesSourcePath,
      stdio: 'inherit',
    }
  );

  // unpack project files in project directory
  await spawnAsync('tar', ['zxf', projectFilesTarballPath], {
    cwd: projectRoot,
    stdio: 'inherit',
  });

  // remove project files archive
  await fs.rm(projectFilesTarballPath);

  // copy .prettierrc
  await fs.copyFile(path.resolve(repoRoot, '.prettierrc'), path.join(projectRoot, '.prettierrc'));
}

/**
 * Adds all the dependencies and other properties needed for the E2E test app
 */
async function preparePackageJson(projectRoot, repoRoot, configureE2E) {
  // Create the project subfolder to hold NPM tarballs built from the current state of the repo
  const dependenciesPath = path.join(projectRoot, 'dependencies');
  await fs.mkdir(dependenciesPath);

  for (const dependencyName of expoDependencyNames) {
    console.log(`Packing ${dependencyName}...`);
    const result = await packExpoDependency(
      repoRoot,
      projectRoot,
      dependenciesPath,
      dependencyName
    );
    expoResolutions[dependencyName] = result.dependency;
    expoVersions[dependencyName] = result.dependency;
  }
  console.log('Done packing dependencies.');

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
        'generate-test-update-bundles': 'node scripts/generate-test-update-bundles.js',
      }
    : {};

  const extraDevDependencies = configureE2E
    ? {
        '@config-plugins/detox': '^5.0.1',
        '@types/express': '^4.17.17',
        '@types/jest': '^29.4.0',
        '@types/react': '~18.0.14',
        '@types/react-native': '~0.70.6',
        detox: '^20.4.0',
        express: '^4.18.2',
        'form-data': '^4.0.0',
        jest: '^29.3.1',
        'jest-circus': '^29.3.1',
        prettier: '^2.8.1',
        'ts-jest': '^29.0.5',
        typescript: '^4.6.3',
      }
    : {};

  // Remove the default Expo dependencies from create-expo-app
  let packageJson = JSON.parse(await fs.readFile(path.join(projectRoot, 'package.json'), 'utf-8'));
  for (const dependencyName of expoDependencyNames) {
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
      ...extraDevDependencies,
      ...packageJson.devDependencies,
    },
    resolutions: {
      ...expoResolutions,
      ...packageJson.resolutions,
    },
  };

  const packageJsonString = JSON.stringify(packageJson, null, 2);
  await fs.writeFile(path.join(projectRoot, 'package.json'), packageJsonString, 'utf-8');
}

/**
 * Adds Detox modules to both iOS and Android expo-updates code.
 * Returns a function that cleans up these changes to the repo once E2E setup is complete
 */
async function prepareLocalUpdatesModule(repoRoot) {
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

  // export module from UpdatesPackage on Android
  const updatesPackageFilePath = path.join(
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
    'UpdatesPackage.kt'
  );
  const originalUpdatesPackageFileContents = await fs.readFile(updatesPackageFilePath, 'utf8');
  let updatesPackageFileContents = originalUpdatesPackageFileContents;
  if (!updatesPackageFileContents) {
    throw new Error('Failed to read UpdatesPackage.kt; was the file renamed or moved?');
  }
  updatesPackageFileContents = updatesPackageFileContents.replace(
    'UpdatesModule(context) as ExportedModule',
    'UpdatesModule(context) as ExportedModule, UpdatesE2ETestModule(context)'
  );
  // make sure the insertion worked
  if (!updatesPackageFileContents.includes('UpdatesE2ETestModule(context)')) {
    throw new Error('Failed to modify UpdatesPackage.kt to insert UpdatesE2ETestModule');
  }
  await fs.writeFile(updatesPackageFilePath, updatesPackageFileContents, 'utf8');

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
    ios: {
      ...originalExpoModuleConfig.ios,
      modules: ['UpdatesModule', 'E2ETestModule'],
    },
  };
  await fs.writeFile(expoModuleConfigFilePath, JSON.stringify(expoModuleConfig, null, 2), 'utf-8');

  // Return cleanup function
  return async () => {
    await fs.writeFile(updatesPackageFilePath, originalUpdatesPackageFileContents, 'utf8');
    await fs.writeFile(expoModuleConfigFilePath, originalExpoModuleConfigJsonString, 'utf-8');
    await fs.rm(iosE2ETestModuleSwiftPath, { force: true });
    await fs.rm(androidE2ETestModuleKTPath, { force: true });
  };
}

/**
 * Modifies app.json in the E2E test app to add the properties we need
 */
function transformAppJsonForE2E(appJson, projectName, runtimeVersion) {
  return {
    ...appJson,
    expo: {
      ...appJson.expo,
      name: projectName,
      owner: 'expo-ci',
      runtimeVersion,
      jsEngine: 'jsc',
      plugins: ['expo-updates', '@config-plugins/detox'],
      android: { ...appJson.expo.android, package: 'dev.expo.updatese2e' },
      ios: { ...appJson.expo.ios, bundleIdentifier: 'dev.expo.updatese2e' },
      updates: {
        ...appJson.updates,
        url: `http://${process.env.UPDATES_HOST}:${process.env.UPDATES_PORT}/update`,
      },
      extra: {
        eas: {
          projectId: '55685a57-9cf3-442d-9ba8-65c7b39849ef',
        },
      },
    },
  };
}

async function configureUpdatesSigningAsync(projectRoot) {
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
}

async function initAsync(
  projectRoot,
  {
    repoRoot,
    runtimeVersion,
    localCliBin,
    configureE2E = true,
    transformAppJson = transformAppJsonForE2E,
  }
) {
  console.log('Creating expo app');
  const workingDir = path.dirname(projectRoot);
  const projectName = path.basename(projectRoot);

  // pack typescript template
  const localTSTemplatePath = path.join(repoRoot, 'templates', 'expo-template-blank-typescript');
  await spawnAsync('npm', ['pack', '--pack-destination', repoRoot], {
    cwd: localTSTemplatePath,
    stdio: 'ignore',
  });

  const localTSTemplatePathName = glob.sync(
    path.join(repoRoot, 'expo-template-blank-typescript-*.tgz')
  )[0];

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

  let cleanupLocalUpdatesModule;
  if (configureE2E) {
    cleanupLocalUpdatesModule = await prepareLocalUpdatesModule(repoRoot);
  }

  await preparePackageJson(projectRoot, repoRoot, configureE2E);

  // Now we do NPM install
  await spawnAsync('yarn', [], {
    cwd: projectRoot,
    stdio: 'inherit',
  });

  // configure app.json
  let appJson = JSON.parse(await fs.readFile(path.join(projectRoot, 'app.json'), 'utf-8'));
  appJson = transformAppJson(appJson, projectName, runtimeVersion);
  await fs.writeFile(path.join(projectRoot, 'app.json'), JSON.stringify(appJson, null, 2), 'utf-8');

  if (configureE2E) {
    await configureUpdatesSigningAsync(projectRoot);
  }

  // pack local template and prebuild, but do not reinstall NPM
  const localTemplatePath = path.join(repoRoot, 'templates', 'expo-template-bare-minimum');
  await spawnAsync('npm', ['pack', '--pack-destination', projectRoot], {
    cwd: localTemplatePath,
    stdio: 'ignore',
  });

  const localTemplatePathName = glob.sync(
    path.join(projectRoot, 'expo-template-bare-minimum-*.tgz')
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
  packageJson.dependencies['expo-splash-screen'] = packageJson.resolutions['expo-splash-screen'];
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
    '\nandroid.enableProguardInReleaseBuilds=true\nandroid.kotlinVersion=1.8.20',
    'utf-8'
  );

  // Append additional Proguard rule for Detox 20
  await fs.appendFile(
    path.join(projectRoot, 'android', 'app', 'proguard-rules.pro'),
    '\n-keep class org.apache.commons.** { *; }\n',
    'utf-8'
  );

  // Force bundling on iOS for debug builds
  const iosProjectPath = glob.sync(
    path.join(projectRoot, 'ios', '*.xcodeproj', 'project.pbxproj')
  )[0];
  const iosProject = await fs.readFile(iosProjectPath, 'utf-8');
  const iosProjectEdited = iosProject.replace('SKIP', 'FORCE');
  await fs.rm(iosProjectPath);
  await fs.writeFile(iosProjectPath, iosProjectEdited, 'utf-8');

  // Cleanup local updates module if needed
  if (cleanupLocalUpdatesModule) {
    await cleanupLocalUpdatesModule();
  }

  return projectRoot;
}

async function setupE2EAppAsync(projectRoot, localCliBin, repoRoot) {
  await copyCommonFixturesToProject(projectRoot, 'App.tsx', repoRoot);

  // copy png assets and install extra package
  await fs.copyFile(
    path.resolve(dirName, '..', 'fixtures', 'test.png'),
    path.join(projectRoot, 'test.png')
  );
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

async function setupManualTestAppAsync(projectRoot) {
  // Copy API test app to project
  await fs.rm(path.join(projectRoot, 'App.tsx'));
  await fs.copyFile(
    path.resolve(dirName, '..', 'fixtures', 'App-apitest.tsx'),
    path.join(projectRoot, 'App.tsx')
  );
  // Copy tsconfig.json to project
  await fs.rm(path.join(projectRoot, 'tsconfig.json'));
  await fs.copyFile(
    path.resolve(dirName, '..', 'fixtures', 'project_files', 'tsconfig.json'),
    path.join(projectRoot, 'tsconfig.json')
  );
}

module.exports = {
  initAsync,
  setupE2EAppAsync,
  setupManualTestAppAsync,
};
