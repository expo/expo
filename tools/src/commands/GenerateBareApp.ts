import { Command } from '@expo/commander';
import spawnAsync from '@expo/spawn-async';
import fs from 'fs-extra';
import path from 'path';

import { EXPO_DIR, PACKAGES_DIR } from '../Constants';
import { runExpoCliAsync } from '../ExpoCLI';

export type GenerateBareAppOptions = {
  name?: string;
  template?: string;
  clean?: boolean;
  outDir?: string;
  rnVersion?: string;
};

export async function action(
  packageNames: string[],
  {
    name: appName = 'my-generated-bare-app',
    outDir = 'bare-apps',
    template = 'expo-template-bare-minimum',
    clean = false,
    rnVersion,
  }: GenerateBareAppOptions
) {
  // TODO:
  // if appName === ''
  // if packageNames.length === 0

  const { workspaceDir, projectDir } = getDirectories({ name: appName, outDir });

  const packagesToSymlink = await getPackagesToSymlink({ packageNames, workspaceDir });

  await createProjectDirectory({ clean, projectDir, workspaceDir, appName, template });
  await modifyPackageJson({ packagesToSymlink, projectDir });
  await yarnInstall({ projectDir });
  await symlinkPackages({ packagesToSymlink, projectDir });
  await runExpoPrebuild({ projectDir });
  await updateRNVersion({ projectDir, rnVersion });
  await createMetroConfig({ workspaceRoot: EXPO_DIR, projectRoot: projectDir });
  await createScripts({ projectDir });

  // reestablish symlinks - some might be wiped out from prebuild
  await symlinkPackages({ projectDir, packagesToSymlink });

  console.log(`Project created in ${projectDir}!`);
}

export function getDirectories({
  name: appName = 'my-generated-bare-app',
  outDir = 'bare-apps',
}: GenerateBareAppOptions) {
  const workspaceDir = path.resolve(process.cwd(), outDir);
  const projectDir = path.resolve(process.cwd(), workspaceDir, appName);

  return {
    workspaceDir,
    projectDir,
  };
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
  const defaultPackagesToSymlink: string[] = ['expo'];

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

export async function getPackagesToSymlink({
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

  const dependencies = new Set<string>();
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

  pkg.expo = pkg.expo ?? {};
  pkg.expo.symlinks = pkg.expo.symlinks ?? [];

  packagesToSymlink.forEach((packageName) => {
    const packageJson = require(path.resolve(PACKAGES_DIR, packageName, 'package.json'));
    pkg.dependencies[packageName] = packageJson.version ?? '*';
    pkg.expo.symlinks.push(packageName);
  });

  await fs.outputJson(path.resolve(projectDir, 'package.json'), pkg, { spaces: 2 });
}

async function yarnInstall({ projectDir }: { projectDir: string }) {
  console.log('Yarning');
  return await spawnAsync('yarn', [], { cwd: projectDir, stdio: 'ignore' });
}

export async function symlinkPackages({
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
      fs.rmSync(projectPackagePath, { recursive: true });
    }

    fs.symlinkSync(expoPackagePath, projectPackagePath);
  }
}

async function updateRNVersion({
  projectDir,
  rnVersion,
}: {
  projectDir: string;
  rnVersion?: string;
}) {
  const reactNativeVersion = rnVersion || getLocalReactNativeVersion();

  const pkgPath = path.resolve(projectDir, 'package.json');
  const pkg = await fs.readJSON(pkgPath);
  pkg.dependencies['react-native'] = reactNativeVersion;

  await fs.outputJson(path.resolve(projectDir, 'package.json'), pkg, { spaces: 2 });
  await spawnAsync('yarn', [], { cwd: projectDir });
}

function getLocalReactNativeVersion() {
  const mainPkg = require(path.resolve(EXPO_DIR, 'package.json'));
  return mainPkg.resolutions?.['react-native'];
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

async function createScripts({ projectDir }) {
  const scriptsDir = path.resolve(projectDir, 'scripts');
  await fs.mkdir(scriptsDir);

  await fs.writeFile(
    path.resolve(scriptsDir, 'addPackages.js'),
    addPackagesScriptTemplate(projectDir),
    {
      encoding: 'utf-8',
    }
  );

  await fs.writeFile(
    path.resolve(scriptsDir, 'removePackages.js'),
    removePackagesScriptTemplate(projectDir),
    {
      encoding: 'utf-8',
    }
  );

  const pkgJsonPath = path.resolve(projectDir, 'package.json');
  const pkgJson = await fs.readJSON(pkgJsonPath);
  pkgJson.scripts['package:add'] = 'node scripts/addPackages.js';
  pkgJson.scripts['package:remove'] = 'node scripts/removePackages.js';
  pkgJson.scripts['clean'] =
    'watchman watch-del-all &&  rm -fr $TMPDIR/metro-cache && rm $TMPDIR/haste-map-*';
  pkgJson.scripts['ios'] = 'expo run:ios';
  pkgJson.scripts['android'] = 'expo run:android';

  await fs.writeJSON(pkgJsonPath, pkgJson);

  console.log('Added package scripts!');
}

const addPackagesScriptTemplate = (projectDir: string) => `#!/usr/bin/env node

const path = require("path");
const fs = require("fs");

const expoDirectory = "${EXPO_DIR}";
const projectDirectory = "${projectDir}";

function symlinkPackages(packageNames) {
  const pkgJson = require(path.resolve(projectDirectory, "./package.json"));
  const symlinks = pkgJson.expo.symlinks;

  packageNames.forEach((packageName) => {
    if (!symlinks.includes(packageName)) {
      symlinks.push(packageName);
    }
  });

  symlinks.forEach((packageName) => {
    const pathToPackage = path.resolve(expoDirectory, "packages", packageName);

    const nodeModulesPackage = path.resolve(
      projectDirectory,
      "node_modules",
      packageName
    );

    const pkg = require(path.resolve(pathToPackage, "package.json"));
    const version = pkg.version || "*";

    pkgJson.dependencies[packageName] = version;

    if (fs.existsSync(nodeModulesPackage)) {
      fs.rmSync(nodeModulesPackage, { recursive: true });
    }

    fs.symlinkSync(pathToPackage, nodeModulesPackage);
  });

  fs.writeFileSync(
    path.resolve(projectDirectory, "./package.json"),
    JSON.stringify(pkgJson, null, 2),
    { encoding: "utf-8" }
  );

  console.log('Symlinking packages complete');
}

const packageNames = process.argv.slice(2);
symlinkPackages(packageNames);
`;

const removePackagesScriptTemplate = (projectDir: string) => `#!/usr/bin/env node

const path = require("path");
const fs = require("fs");

const expoDirectory = "${EXPO_DIR}";
const projectDirectory = "${projectDir}";

function removePackages(packagesToRemove) {
  const pkgJson = require(path.resolve(projectDirectory, "./package.json"));
  const symlinks = pkgJson.expo.symlinks;
  const nextSymlinks = [];

  symlinks.forEach((packageName) => {
    if (!packagesToRemove.includes(packageName)) {
      nextSymlinks.push(packageName);
    } else {
      delete pkgJson.dependencies[packageName];

      const nodeModulesPackage = path.resolve(
        projectDirectory,
        "node_modules",
        packageName
      );

      fs.rmSync(nodeModulesPackage, { recursive: true });
    }
  });

  nextSymlinks.forEach((packageName) => {
    const pathToPackage = path.resolve(expoDirectory, "packages", packageName);

    const nodeModulesPackage = path.resolve(
      projectDirectory,
      "node_modules",
      packageName
    );

    const pkg = require(path.resolve(pathToPackage, "package.json"));
    const version = pkg.version || "*";

    pkgJson.dependencies[packageName] = version;

    if (fs.existsSync(nodeModulesPackage)) {
      fs.rmSync(nodeModulesPackage, { recursive: true });
    }

    fs.symlinkSync(pathToPackage, nodeModulesPackage);
  });

  pkgJson.expo.symlinks = nextSymlinks;

  fs.writeFileSync(
    path.resolve(projectDirectory, "./package.json"),
    JSON.stringify(pkgJson, null, 2),
    { encoding: "utf-8" }
  );

  console.log('Removing packages complete');
}

const packageNames = process.argv.slice(2);
removePackages(packageNames);
`;

export default (program: Command) => {
  program
    .command('generate-bare-app [packageNames...]')
    .alias('gba')
    .option('-n, --name <string>', 'Specifies the name of the project')
    .option('-c, --clean', 'Rebuilds the project from scratch')
    .option('--rnVersion <string>', 'Version of react-native to include')
    .option('-o, --outDir <string>', 'Specifies the directory to build the project in')
    .option('-t, --template <string>', 'Specify the expo template to use as the project starter')
    .description(`Generates a bare app with the specified packages symlinked`)
    .asyncAction(action);
};
