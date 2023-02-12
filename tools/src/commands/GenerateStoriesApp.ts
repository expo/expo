import { Command } from '@expo/commander';
import spawnAsync from '@expo/spawn-async';
import fs from 'fs-extra';
import path from 'path';

import { EXPO_DIR, PACKAGES_DIR } from '../Constants';
import {
  GenerateBareAppOptions,
  action as generateBareApp,
  getDirectories,
  getPackagesToSymlink,
  symlinkPackages,
} from './GenerateBareApp';

async function action(packageNames: string[], options: GenerateBareAppOptions) {
  const { projectDir, workspaceDir } = getDirectories(options);
  await generateBareApp(packageNames, options);
  await addNativeDependencies({ projectDir });
  await createMetroConfig({ projectRoot: projectDir, ...options });
  await rewriteAppFile({ projectDir, appName: options.name });

  const packagesToSymlink = await getPackagesToSymlink({ packageNames, workspaceDir });
  await symlinkPackages({ packagesToSymlink, projectDir });
}

async function addNativeDependencies({ projectDir }: { projectDir: string }) {
  const pkgPath = path.resolve(projectDir, 'package.json');
  const pkg = await fs.readJSON(pkgPath);

  const bundledNativeModules = require(path.resolve(
    PACKAGES_DIR,
    'expo',
    'bundledNativeModules.json'
  ));

  [
    'react-native-safe-area-context',
    'react-native-screens',
    'react-native-svg',
    'react-native-gesture-handler',
  ].forEach((packageName) => {
    pkg.dependencies[packageName] = bundledNativeModules[packageName];
  });

  const storiesPkgJson = require(path.resolve(PACKAGES_DIR, 'expo-stories', 'package.json'));
  pkg.dependencies['expo-stories'] = storiesPkgJson.version;

  await fs.outputJson(path.resolve(projectDir, 'package.json'), pkg, { spaces: 2 });

  return await spawnAsync('yarn', [], { cwd: projectDir, stdio: 'ignore' });
}

async function createMetroConfig({ projectRoot }: { projectRoot: string }) {
  console.log('Adding metro.config.js for project');

  const template = `// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const { withExpoStories } = require('expo-stories/build/withExpoStories');
const config = getDefaultConfig('${projectRoot}');
config.expoRoot = "${EXPO_DIR}";
module.exports = withExpoStories(config);
`;

  return await fs.writeFile(path.resolve(projectRoot, 'metro.config.js'), template, {
    encoding: 'utf-8',
  });
}

async function rewriteAppFile({
  projectDir,
  appName = '',
}: {
  projectDir: string;
  appName?: string;
}) {
  const template = `import React from "react";
import ExpoStoriesApp from "expo-stories/build/clients/app";

export default function App() {
  return <ExpoStoriesApp title="${appName}" />;
}
  `;

  const pathToAppJs = path.resolve(projectDir, 'App.js');
  return await fs.writeFile(pathToAppJs, template, { encoding: 'utf-8' });
}

export default (program: Command) => {
  program
    .command('generate-stories-app [packageNames...]')
    .alias('gsa')
    .option('-n, --name <string>', 'Specifies the name of the project')
    .option('-c, --clean', 'Rebuilds the project from scratch')
    .option('--rnVersion <string>', 'Version of react-native to include')
    .option('-o, --outDir <string>', 'Specifies the directory to build the project in')
    .option('-t, --template <string>', 'Specify the expo template to use as the project starter')
    .description(`Generates a stories app with the specified packages symlinked`)
    .asyncAction(action);
};
