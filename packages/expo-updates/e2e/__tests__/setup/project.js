const spawnAsync = require('@expo/spawn-async');
const fs = require('fs/promises');
const glob = require('glob');
const path = require('path');


async function packExpoDependency(repoRoot, projectRoot, destPath, dependencyName) {
  // Pack up the named Expo package into the destination folder
  const dependencyPath = path.resolve(repoRoot, 'packages', dependencyName);
  await spawnAsync('npm', ['pack', '--pack-destination', destPath], {
    cwd: dependencyPath,
    stdio: 'ignore',
  });

  // Ensure the file was created as expected
  const dependencyTarballPath = glob.sync(path.join(destPath, `${dependencyName}-*.tgz`))[0];

  if (!dependencyTarballPath) {
    throw new Error(`Failed to locate packed ${dependencyName} in ${destPath}`);
  }

  // Return the dependency in the form needed by package.json, as a relative path
  const dependency = `file:.${path.sep}${path.relative(projectRoot, dependencyTarballPath)}`;
  // We also need the exact version string for each package
  const version = require(path.resolve(dependencyPath, 'package.json')).version;
  return {
    dependency,
    version,
  };
}

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

  // initialize project (do not do NPM install, we do that later)
  await spawnAsync('yarn', ['create', 'expo-app', projectName, '--yes', '--no-install'], {
    cwd: workingDir,
    stdio: 'inherit',
  });

  await prepareLocalUpdatesModule(repoRoot);

  // Create the project subfolder to hold NPM tarballs built from the current state of the repo
  const dependenciesPath = path.join(projectRoot, 'dependencies');
  await fs.mkdir(dependenciesPath);

  const expoDependencyNames = [
    'expo',
    'expo-application',
    'expo-constants',
    'expo-eas-client',
    'expo-error-recovery',
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
    'expo-updates-interface',
    'expo-updates',
  ];

  const expoResolutions = {};
  const expoVersions = {};

  for (const dependencyName of expoDependencyNames) {
    console.log(`Packing ${dependencyName}...`);
    const result = await packExpoDependency(
      repoRoot,
      projectRoot,
      dependenciesPath,
      dependencyName
    );
    expoResolutions[dependencyName] = result.dependency;
    expoVersions[dependencyName] = result.version;
  }
  console.log('Done packing dependencies.');

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
    dependencies: {
      ...packageJson.dependencies,
      ...expoVersions,
    },
    resolutions: {
      ...packageJson.resolutions,
      ...expoResolutions,
    },
  };
  await fs.writeFile(
    path.join(projectRoot, 'package.json'),
    JSON.stringify(packageJson, null, 2),
    'utf-8'
  );
  // Now we do NPM install
  await spawnAsync('yarn', [], {
    cwd: projectRoot,
    stdio: 'inherit',
  });

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
      EXPO_DEBUG: '1',
      CI: '1',
    },
    cwd: projectRoot,
    stdio: 'ignore',
  });

  // We are done with template tarball
  await fs.rm(localTemplatePathName);

  // iOS cocoapods install
  await spawnAsync('npx', ['pod-install'], {
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
