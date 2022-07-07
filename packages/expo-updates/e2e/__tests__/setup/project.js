const spawnAsync = require('@expo/spawn-async');
const fs = require('fs/promises');
const path = require('path');

async function initAsync(workingDir, repoRoot, runtimeVersion) {
  // initialize project
  await spawnAsync('expo-cli', ['init', 'updates-e2e', '--yes'], {
    cwd: workingDir,
    stdio: 'inherit',
  });
  const projectRoot = path.join(workingDir, 'updates-e2e');

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
      'expo-modules-core': 'file:../expo/packages/expo-modules-core',
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
      name: 'updates-e2e',
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
  const templateVersion = require(path.join(localTemplatePath, 'package.json')).version;
  await spawnAsync(
    'expo-cli',
    ['prebuild', '--template', `expo-template-bare-minimum-${templateVersion}.tgz`],
    {
      cwd: projectRoot,
      stdio: 'inherit',
    }
  );

  // enable proguard on Android
  await fs.appendFile(
    path.join(projectRoot, 'android', 'gradle.properties'),
    '\nandroid.enableProguardInReleaseBuilds=true',
    'utf-8'
  );

  return projectRoot;
}

async function setupBasicAppAsync(projectRoot) {
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
    cwd: projectRoot,
    stdio: 'inherit',
  });

  // copy exported update to artifacts
  await fs.cp(path.join(projectRoot, 'dist'), path.join(process.env.ARTIFACTS_DEST, 'dist-basic'), {
    recursive: true,
  });
}

async function setupAssetsAppAsync(projectRoot) {
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
  await spawnAsync('expo-cli', ['install', '@expo-google-fonts/inter'], {
    cwd: projectRoot,
    stdio: 'inherit',
  });

  // export update for test server to host
  await fs.rm(path.join(projectRoot, 'dist'), { force: true, recursive: true });
  await spawnAsync('expo-cli', ['export', '--public-url', 'https://u.expo.dev/dummy-url'], {
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
