import spawnAsync from '@expo/spawn-async';
import { rmSync, existsSync } from 'fs';
import fs from 'fs/promises';
import nullthrows from 'nullthrows';
import path from 'path';

const dirName = __dirname;

// Package dependencies in chunks based on peer dependencies.
const dependencyChunks = [
  ['@expo/config-types', '@expo/env'],
  ['@expo/config'],
  ['@expo/config-plugins'],
  ['expo-modules-core'],
  ['@expo/cli', 'expo', 'expo-asset', 'expo-modules-autolinking'],
  ['@expo/prebuild-config', '@expo/metro-config', 'expo-constants', 'expo-manifests'],
  [
    'babel-preset-expo',
    'expo-application',
    'expo-device',
    'expo-eas-client',
    'expo-file-system',
    'expo-font',
    'expo-json-utils',
    'expo-keep-awake',
    'expo-splash-screen',
    'expo-status-bar',
    'expo-structured-headers',
  ],
];

function getExpoDependencyNamesForDependencyChunks(expoDependencyChunks: string[][]): string[] {
  return expoDependencyChunks.flat();
}

const expoResolutions = {};

/**
 * Executes `npm pack` on one of the Expo packages used in module-core E2E
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

async function prepareMacOSProject(projectRoot: string) {
  try {
    // Initialize the macOS project
    await spawnAsync('npx', ['--yes', 'react-native-macos-init'], {
      cwd: projectRoot,
    });
  } catch {
    // Ignore Podfile errors on 0.75.2
  }

  // copy Podfile
  const podfilePath = path.resolve(dirName, '..', 'fixtures', 'Podfile');
  await fs.copyFile(podfilePath, path.join(projectRoot, 'macos', 'Podfile'));

  // copy index.js
  const indexPath = path.resolve(dirName, '..', 'fixtures', 'index.js');
  await fs.copyFile(indexPath, path.join(projectRoot, 'index.js'));

  // copy metro.config.js
  const metroConfigPath = path.resolve(dirName, '..', 'fixtures', 'metro.config.js');
  await fs.copyFile(metroConfigPath, path.join(projectRoot, 'metro.config.js'));

  // copy App.tsx
  const AppPath = path.resolve(dirName, '..', 'fixtures', 'App.tsx');
  await fs.copyFile(AppPath, path.join(projectRoot, 'App.tsx'));
}

/**
 * Adds all the dependencies and other properties needed for the E2E test app
 */
async function preparePackageJson(projectRoot: string, repoRoot: string) {
  // Create the project subfolder to hold NPM tarballs built from the current state of the repo
  const dependenciesPath = path.join(projectRoot, 'dependencies');
  await fs.mkdir(dependenciesPath);

  console.time('Done packing dependencies');
  for (const dependencyChunk of dependencyChunks) {
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

  const extraDevDependencies = {
    '@config-plugins/detox': '^5.0.1',
    '@types/express': '^4.17.17',
    '@types/jest': '^29.4.0',
    express: '^4.18.2',
    'form-data': '^4.0.0',
    jest: '^29.3.1',
    'jest-circus': '^29.3.1',
    prettier: '^2.8.1',
    'ts-jest': '^29.0.5',
    'patch-package': '^8.0.0',
  };

  // Remove the default Expo dependencies from create-expo-app
  let packageJson = JSON.parse(await fs.readFile(path.join(projectRoot, 'package.json'), 'utf-8'));
  for (const dependencyName of getExpoDependencyNamesForDependencyChunks(dependencyChunks)) {
    if (packageJson.dependencies[dependencyName]) {
      delete packageJson.dependencies[dependencyName];
    }
  }
  // Add dependencies and resolutions to package.json
  packageJson = {
    ...packageJson,
    scripts: {
      postinstall: 'patch-package',
      ...packageJson.scripts,
    },
    dependencies: {
      ...expoResolutions,
      ...packageJson.dependencies,
      'react-native-macos': '0.75.2',
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
    },
  };

  const packageJsonString = JSON.stringify(packageJson, null, 2);
  await fs.writeFile(path.join(projectRoot, 'package.json'), packageJsonString, 'utf-8');
}

/**
 * Modifies app.json in the E2E test app to add the properties we need
 */
function transformAppJsonForE2E(appJson: any, projectName: string) {
  return {
    ...appJson,
    expo: {
      ...appJson.expo,
      name: projectName,
      owner: 'expo-ci',
      ios: { ...appJson.expo.ios, bundleIdentifier: 'org.reactjs.native.modules-core-e2e' },
      extra: {
        eas: {
          projectId: '461a0c7f-022a-4f2a-b0af-682bde2857ad',
        },
      },
    },
  };
}

async function initAsync(
  projectRoot: string,
  {
    repoRoot,
  }: {
    repoRoot: string;
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

  await preparePackageJson(projectRoot, repoRoot);

  // configure app.json
  let appJson = JSON.parse(await fs.readFile(path.join(projectRoot, 'app.json'), 'utf-8'));
  appJson = transformAppJsonForE2E(appJson, projectName);
  await fs.writeFile(path.join(projectRoot, 'app.json'), JSON.stringify(appJson, null, 2), 'utf-8');

  // Install node modules with local tarballs
  await spawnAsync('yarn', [], {
    cwd: projectRoot,
    stdio: 'inherit',
  });

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

  // Configure macos
  await prepareMacOSProject(projectRoot);

  // copy eas.json
  await fs.copyFile(
    path.resolve(dirName, '..', 'fixtures', 'eas.json'),
    path.join(projectRoot, 'eas.json')
  );

  // copy eas custom build yml
  await fs.mkdir(path.join(projectRoot, '.eas'));
  await fs.mkdir(path.join(projectRoot, '.eas', 'build'));
  await fs.copyFile(
    path.resolve(dirName, '..', 'fixtures', 'build-preview.yml'),
    path.join(projectRoot, '.eas', 'build', 'build-preview.yml')
  );

  return projectRoot;
}

const repoRoot = nullthrows(process.env.EXPO_REPO_ROOT, 'EXPO_REPO_ROOT is not defined');
const workingDir = path.resolve(repoRoot, '..');

/**
 *
 * This generates a project at the location TEST_PROJECT_ROOT,
 * that is configured to build a test app in macOS.
 *
 * See `packages/expo-modules-core/e2e/README.md` for instructions on how
 * to run these tests locally.
 *
 */

(async function () {
  if (!process.env.EXPO_REPO_ROOT) {
    throw new Error('Missing one or more environment variables; see instructions in e2e/README.md');
  }
  const projectRoot = process.env.TEST_PROJECT_ROOT || path.join(workingDir, 'modules-core-e2e');

  await initAsync(projectRoot, { repoRoot });
})();
