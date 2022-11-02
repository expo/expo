const spawnAsync = require('@expo/spawn-async');
const fs = require('fs/promises');
const path = require('path');
const glob = require('glob');

async function prepareLocalUpdatesModule(repoRoot) {
  // copy UpdatesE2ETest exported module into the local package
  await fs.copyFile(
    path.resolve(__dirname, '..', 'fixtures', 'EXUpdatesE2ETestModule.h'),
    path.join(repoRoot, 'packages', 'expo-updates', 'ios', 'EXUpdates', 'EXUpdatesE2ETestModule.h')
  );
  await fs.copyFile(
    path.resolve(__dirname, '..', 'fixtures', 'EXUpdatesE2ETestModule.m'),
    path.join(repoRoot, 'packages', 'expo-updates', 'ios', 'EXUpdates', 'EXUpdatesE2ETestModule.m')
  );
  await fs.copyFile(
    path.resolve(__dirname, '..', 'fixtures', 'UpdatesE2ETestModule.kt'),
    path.join(
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
    )
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
  let updatesPackageFileContents = await fs.readFile(updatesPackageFilePath, 'utf8');
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
}

async function initAsync(projectRoot, { repoRoot, runtimeVersion, localCliBin }) {
  console.log('Creating expo app');
  const workingDir = path.dirname(projectRoot);
  const projectName = path.basename(projectRoot);

  // initialize project
  await spawnAsync('yarn', ['create', 'expo-app', projectName, '--yes'], {
    cwd: workingDir,
    stdio: 'inherit',
  });

  await prepareLocalUpdatesModule(repoRoot);

  // add local dependencies
  let packageJson = JSON.parse(await fs.readFile(path.join(projectRoot, 'package.json'), 'utf-8'));
  packageJson = {
    ...packageJson,
    resolutions: {
      ...packageJson.resolutions,
      'expo-application': 'file:../expo/packages/expo-application',
      'expo-constants': 'file:../expo/packages/expo-constants',
      'expo-eas-client': 'file:../expo/packages/expo-eas-client',
      'expo-error-recovery': 'file:../expo/packages/expo-error-recovery',
      'expo-file-system': 'file:../expo/packages/expo-file-system',
      'expo-font': 'file:../expo/packages/expo-font',
      'expo-json-utils': 'file:../expo/packages/expo-json-utils',
      'expo-keep-awake': 'file:../expo/packages/expo-keep-awake',
      'expo-manifests': 'file:../expo/packages/expo-manifests',
      'expo-modules-autolinking': 'file:../expo/packages/expo-modules-autolinking',
      'expo-modules-core': 'file:../expo/packages/expo-modules-core',
      'expo-splash-screen': 'file:../expo/packages/expo-splash-screen',
      'expo-structured-headers': 'file:../expo/packages/expo-structured-headers',
      'expo-updates-interface': 'file:../expo/packages/expo-updates-interface',
    },
  };
  await fs.writeFile(
    path.join(projectRoot, 'package.json'),
    JSON.stringify(packageJson, null, 2),
    'utf-8'
  );
  await spawnAsync(
    'yarn',
    [
      'add',
      'file:../expo/packages/expo-updates',
      'file:../expo/packages/expo',
      'file:../expo/packages/expo-splash-screen',
      'file:../expo/packages/expo-status-bar',
    ],
    {
      cwd: projectRoot,
      stdio: 'inherit',
    }
  );

  // configure app.json
  let appJson = JSON.parse(await fs.readFile(path.join(projectRoot, 'app.json'), 'utf-8'));
  appJson = {
    ...appJson,
    expo: {
      ...appJson.expo,
      name: projectName,
      runtimeVersion,
      plugins: ['expo-updates'],
      android: { ...appJson.android, package: 'dev.expo.updatese2e' },
      ios: { ...appJson.ios, bundleIdentifier: 'dev.expo.updatese2e' },
      updates: {
        ...appJson.updates,
        url: `http://${process.env.UPDATES_HOST}:${process.env.UPDATES_PORT}/update`,
      },
    },
  };
  await fs.writeFile(path.join(projectRoot, 'app.json'), JSON.stringify(appJson, null, 2), 'utf-8');

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

  // pack local template and prebuild
  const localTemplatePath = path.join(repoRoot, 'templates', 'expo-template-bare-minimum');
  await spawnAsync('npm', ['pack', '--pack-destination', projectRoot], {
    cwd: localTemplatePath,
    stdio: 'inherit',
  });

  const localTemplatePathName = glob.sync(
    path.join(projectRoot, 'expo-template-bare-minimum-*.tgz')
  )[0];

  if (!localTemplatePathName) {
    throw new Error(`Failed to locate packed template in ${projectRoot}`);
  }

  await spawnAsync(localCliBin, ['prebuild', '--template', localTemplatePathName], {
    env: {
      ...process.env,
      EXPO_DEBUG: '1',
      CI: '1',
    },
    cwd: projectRoot,
    stdio: 'inherit',
  });

  // enable proguard on Android
  await fs.appendFile(
    path.join(projectRoot, 'android', 'gradle.properties'),
    '\nandroid.enableProguardInReleaseBuilds=true',
    'utf-8'
  );

  return projectRoot;
}

async function setupBasicAppAsync(projectRoot, localCliBin) {
  // copy App.js from test fixtures
  const appJsSourcePath = path.resolve(__dirname, '..', 'fixtures', 'App.js');
  const appJsDestinationPath = path.resolve(projectRoot, 'App.js');
  let appJsFileContents = await fs.readFile(appJsSourcePath, 'utf-8');
  appJsFileContents = appJsFileContents
    .replace('UPDATES_HOST', process.env.UPDATES_HOST)
    .replace('UPDATES_PORT', process.env.UPDATES_PORT);
  await fs.writeFile(appJsDestinationPath, appJsFileContents, 'utf-8');

  // export update for test server to host
  await fs.rm(path.join(projectRoot, 'dist'), { force: true, recursive: true });
  await spawnAsync('expo-cli', ['export', '--public-url', 'https://u.expo.dev/dummy-url'], {
  //await spawnAsync(localCliBin, ['export'], {
    cwd: projectRoot,
    stdio: 'inherit',
  });

  // copy exported update to artifacts
  await fs.cp(path.join(projectRoot, 'dist'), path.join(process.env.ARTIFACTS_DEST, 'dist-basic'), {
    recursive: true,
  });
}

async function setupAssetsAppAsync(projectRoot, localCliBin) {
  // copy App-assets.js from test fixtures
  const appJsSourcePath = path.resolve(__dirname, '..', 'fixtures', 'App-assets.js');
  const appJsDestinationPath = path.resolve(projectRoot, 'App.js');
  let appJsFileContents = await fs.readFile(appJsSourcePath, 'utf-8');
  appJsFileContents = appJsFileContents
    .replace('UPDATES_HOST', process.env.UPDATES_HOST)
    .replace('UPDATES_PORT', process.env.UPDATES_PORT);
  await fs.writeFile(appJsDestinationPath, appJsFileContents, 'utf-8');

  // copy png assets and install extra package
  await fs.copyFile(
    path.resolve(__dirname, '..', 'fixtures', 'test.png'),
    path.join(projectRoot, 'test.png')
  );
  await spawnAsync(localCliBin, ['install', '@expo-google-fonts/inter'], {
    cwd: projectRoot,
    stdio: 'inherit',
  });

  // export update for test server to host
  await fs.rm(path.join(projectRoot, 'dist'), { force: true, recursive: true });
  await spawnAsync('expo-cli', ['export', '--public-url', 'https://u.expo.dev/dummy-url'], {
  //await spawnAsync(localCliBin, ['export'], {
    cwd: projectRoot,
    stdio: 'inherit',
  });

  // copy exported update to artifacts
  await fs.cp(
    path.join(projectRoot, 'dist'),
    path.join(process.env.ARTIFACTS_DEST, 'dist-assets'),
    {
      recursive: true,
    }
  );
}

module.exports = {
  initAsync,
  setupBasicAppAsync,
  setupAssetsAppAsync,
};
