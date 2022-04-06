import path from 'path';
import fs from 'fs-extra';
import { Command } from '@expo/commander';
import spawnAsync from '@expo/spawn-async';

import { runExpoCliAsync } from '../ExpoCLI';
import { EXPO_DIR, PACKAGES_DIR } from '../Constants';

type GenerateBareAppOptions = {
  name?: string;
  template?: string;
  clean?: boolean;
  outDir?: string;
};

async function action(
  packageNames: string[],
  {
    name: appName = 'my-generated-bare-app',
    outDir = 'bare-apps',
    template = 'expo-template-bare-minimum',
    clean = false,
  }: GenerateBareAppOptions
) {
  // TODO:
  // if appName === ''
  // if packageNames.length === 0

  const workspaceDir = path.resolve(process.cwd(), outDir);
  const projectDir = path.resolve(process.cwd(), workspaceDir, appName);
  const packagesToSymlink = await getPackagesToSymlink({ packageNames, workspaceDir });

  await createProjectDirectory({ clean, projectDir, workspaceDir, appName, template });
  await modifyPackageJson({ packagesToSymlink, projectDir });
  await yarnInstall({ projectDir });
  await symlinkPackages({ packagesToSymlink, projectDir });
  await runExpoPrebuild({ projectDir });
  await updateRNVersion({ projectDir });
  await createMetroConfig({ workspaceRoot: EXPO_DIR, projectRoot: projectDir });
  await applyGradleFlipperFixtures({ projectDir });
  // reestablish symlinks - some might be wiped out from prebuild
  await symlinkPackages({ projectDir, packagesToSymlink });

  console.log(`Project created in ${projectDir}!`);
}

async function createProjectDirectory({
  clean,
  workspaceDir,
  projectDir,
  appName,
  template,
}: {
  clean: boolean;
  workspaceDir: string;
  projectDir: string;
  appName: string;
  template: string;
}) {
  console.log('Creating project');

  if (!fs.existsSync(workspaceDir)) {
    fs.mkdirSync(workspaceDir);
  }

  if (clean) {
    await fs.remove(projectDir);
  }

  return await runExpoCliAsync('init', [appName, '--no-install', '--template', template], {
    cwd: workspaceDir,
    stdio: 'ignore',
  });
}

function getDefaultPackagesToSymlink({ workspaceDir }: { workspaceDir: string }) {
  const defaultPackagesToSymlink: string[] = ['expo', 'expo-modules-autolinking'];

  const isInExpoRepo = workspaceDir.startsWith(EXPO_DIR);

  if (isInExpoRepo) {
    // these packages are picked up by prebuild since they are symlinks in the mono repo
    // config plugins are applied so we include these packages to be safe
    defaultPackagesToSymlink.concat([
      'expo-asset',
      'expo-application',
      'expo-constants',
      'expo-file-system',
      'expo-font',
      'expo-keep-awake',
      'expo-error-recovery',
      'expo-splash-screen',
      'expo-updates',
      'expo-manifests',
      'expo-updates-interface',
      'expo-dev-client',
      'expo-dev-launcher',
      'expo-dev-menu',
      'expo-dev-menu-interface',
    ]);
  }

  return defaultPackagesToSymlink;
}

async function getPackagesToSymlink({
  packageNames,
  workspaceDir,
}: {
  packageNames: string[];
  workspaceDir: string;
}) {
  const packagesToSymlink = new Set<string>();

  const defaultPackages = getDefaultPackagesToSymlink({ workspaceDir });
  defaultPackages.forEach((packageName) => packagesToSymlink.add(packageName));

  for (const packageName of packageNames) {
    const deps = getPackageDependencies(packageName);
    deps.forEach((dep) => packagesToSymlink.add(dep));
  }

  return Array.from(packagesToSymlink);
}

function getPackageDependencies(packageName: string) {
  const packagePath = path.resolve(PACKAGES_DIR, packageName, 'package.json');

  if (!fs.existsSync(packagePath)) {
    return [];
  }

  let dependencies = new Set<string>();
  dependencies.add(packageName);

  const pkg = require(packagePath);

  if (pkg.dependencies) {
    Object.keys(pkg.dependencies).forEach((dependency) => {
      const deps = getPackageDependencies(dependency);
      deps.forEach((dep) => dependencies.add(dep));
    });
  }

  return Array.from(dependencies);
}

async function modifyPackageJson({
  packagesToSymlink,
  projectDir,
}: {
  packagesToSymlink: string[];
  projectDir: string;
}) {
  const pkgPath = path.resolve(projectDir, 'package.json');
  const pkg = await fs.readJSON(pkgPath);

  packagesToSymlink.forEach((packageName) => {
    const packageJson = require(path.resolve(PACKAGES_DIR, packageName, 'package.json'));
    pkg.dependencies[packageName] = packageJson.version ?? '*';
  });

  await fs.outputJson(path.resolve(projectDir, 'package.json'), pkg, { spaces: 2 });
}

async function yarnInstall({ projectDir }: { projectDir: string }) {
  console.log('Yarning');
  return await spawnAsync('yarn', [], { cwd: projectDir, stdio: 'ignore' });
}

async function symlinkPackages({
  packagesToSymlink,
  projectDir,
}: {
  packagesToSymlink: string[];
  projectDir: string;
}) {
  for (const packageName of packagesToSymlink) {
    const projectPackagePath = path.resolve(projectDir, 'node_modules', packageName);
    const expoPackagePath = path.resolve(PACKAGES_DIR, packageName);

    if (fs.existsSync(projectPackagePath)) {
      fs.rmdirSync(projectPackagePath, { recursive: true });
    }

    fs.symlinkSync(expoPackagePath, projectPackagePath);
  }
}

async function updateRNVersion({ projectDir }: { projectDir: string }) {
  const pkgPath = path.resolve(projectDir, 'package.json');
  const pkg = await fs.readJSON(pkgPath);

  const mainPkg = require(path.resolve(EXPO_DIR, 'package.json'));
  const currentRNVersion = mainPkg.resolutions['react-native'];
  pkg.dependencies['react-native'] = currentRNVersion;

  await fs.outputJson(path.resolve(projectDir, 'package.json'), pkg, { spaces: 2 });
  await spawnAsync('yarn', [], { cwd: projectDir });
}

async function runExpoPrebuild({ projectDir }: { projectDir: string }) {
  console.log('Applying config plugins');
  return await runExpoCliAsync('prebuild', ['--no-install'], { cwd: projectDir });
}

async function createMetroConfig({
  workspaceRoot,
  projectRoot,
}: {
  workspaceRoot: string;
  projectRoot: string;
}) {
  console.log('Adding metro.config.js for project');

  const template = `// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig('${projectRoot}');

// 1. Watch all files within the monorepo
config.watchFolders = ['${workspaceRoot}'];

// 2. Let Metro know where to resolve packages, and in what order
config.resolver.nodeModulesPaths = [
  path.resolve('${projectRoot}', 'node_modules'),
  path.resolve('${workspaceRoot}', 'packages'),
];

// Use Node-style module resolution instead of Haste everywhere
config.resolver.providesModuleNodeModules = [];

// Ignore test files and JS files in the native Android and Xcode projects
config.resolver.blockList = [
  /\\/__tests__\\/.*/,
  /.*\\/android\\/React(Android|Common)\\/.*/,
  /.*\\/versioned-react-native\\/.*/,
];

module.exports = config;
`;

  return await fs.writeFile(path.resolve(projectRoot, 'metro.config.js'), template, {
    encoding: 'utf-8',
  });
}

async function applyGradleFlipperFixtures({ projectDir }: { projectDir: string }) {
  // prebuild is updating the gradle.properties FLIPPER_VERSION which causes SoLoader crash on launch
  const gradlePropertiesPath = path.resolve(projectDir, 'android', 'gradle.properties');
  const gradleProperties = await fs.readFile(gradlePropertiesPath, { encoding: 'utf-8' });
  const updatedGradleProperies = gradleProperties.replace(
    `FLIPPER_VERSION=0.54.0`,
    `FLIPPER_VERSION=0.99.0`
  );
  console.log(`Overriding the gradle.properties to FLIPPER_VERSION=0.99.0`)
  await fs.outputFile(gradlePropertiesPath, updatedGradleProperies);
}

export default (program: Command) => {
  program
    .command('generate-bare-app [packageNames...]')
    .alias('gba')
    .option('-n, --name <string>', 'Specifies the name of the project')
    .option('-c, --clean', 'Rebuilds the project from scratch')
    .option('-o, --outDir <string>', 'Specifies the directory to build the project in')
    .option('-t, --template <string>', 'Specify the expo template to use as the project starter')
    .description(`Generates a bare app with the specified packages symlinked`)
    .asyncAction(action);
};
