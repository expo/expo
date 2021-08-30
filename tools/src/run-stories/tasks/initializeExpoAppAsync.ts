import spawnAsync from '@expo/spawn-async';
import fs from 'fs';
import fse from 'fs-extra';
import path from 'path';

import { runExpoCliAsync } from '../../ExpoCLI';
import {
  getExamplesRoot,
  getPackageRoot,
  getProjectName,
  getProjectRoot,
  getTargetName,
  getTemplateRoot,
} from '../helpers';

// Creates the expo project in a new folder under expo/stories
// 1. Initialize project with expo init
// 2. Copy template files for expo stories app into new project
// 3. Setup package.json of new project
// 4. Setup Podfile
export async function initializeExpoAppAsync(packageName: string) {
  const projectRoot = getProjectRoot(packageName);
  const examplesRoot = getExamplesRoot();
  const projectName = getProjectName(packageName);

  if (fs.existsSync(projectRoot)) {
    // @ts-ignore
    fs.rmdirSync(projectRoot, { recursive: true, force: true });
  }

  // initialize expo project w/ name
  await runExpoCliAsync('init', [projectName, '-t', 'bare-minimum', '--no-install'], {
    cwd: examplesRoot,
    stdio: 'ignore',
  });

  const packageRoot = getPackageRoot(packageName);
  const templateRoot = getTemplateRoot(packageName);

  const metroConfigPath = path.resolve(templateRoot, 'metro.config.js');
  fs.copyFileSync(metroConfigPath, path.resolve(projectRoot, 'metro.config.js'));

  const webpackConfigPath = path.resolve(templateRoot, 'webpack.config.js');
  fs.copyFileSync(webpackConfigPath, path.resolve(projectRoot, 'webpack.config.js'));

  const pluginsPath = path.resolve(templateRoot, 'plugins');
  await fse.copy(pluginsPath, path.resolve(projectRoot, 'plugins'));

  // package.json
  const defaultPkg = require(path.resolve(templateRoot, 'pkg.json'));
  const projectPkg = require(path.resolve(projectRoot, 'package.json'));

  const mergedPkg = {
    ...projectPkg,
    ...defaultPkg,
  };

  // configure story server
  mergedPkg.expoStories = {
    projectRoot,
    watchRoot: packageRoot,
  };

  const packagePkg = require(path.resolve(packageRoot, 'package.json'));

  // symlink package being worked on
  mergedPkg['expo-yarn-workspaces'].symlinks = [
    ...mergedPkg['expo-yarn-workspaces'].symlinks,
    packagePkg.name,
  ];

  // remove dependencies from excluded autolinked packages
  const extraNodeModules: any = packagePkg.expoStories?.packages ?? {};

  mergedPkg.name = projectName;

  mergedPkg.dependencies = {
    ...mergedPkg.dependencies,
    ...extraNodeModules,
    [packagePkg.name]: `~${packagePkg.version}`,
  };

  fs.writeFileSync(path.resolve(projectRoot, 'package.json'), JSON.stringify(mergedPkg, null, 2));

  // remove .git repo for newly built project
  // @ts-ignore
  fs.rmdirSync(path.resolve(projectRoot, '.git'), { force: true, recursive: true });

  const targetName = getTargetName(packageName);

  // Podfile
  const podfileRoot = path.resolve(projectRoot, 'ios/Podfile');
  fs.copyFileSync(path.resolve(templateRoot, 'ios/Podfile'), podfileRoot);

  // update target
  let podFileStr = fs.readFileSync(podfileRoot, { encoding: 'utf-8' });
  podFileStr = podFileStr.replace('{{ targetName }}', targetName);
  fs.writeFileSync(path.resolve(projectRoot, 'ios/Podfile'), podFileStr, { encoding: 'utf-8' });

  // configure JS stories app
  const projectAppJsPath = path.resolve(projectRoot, 'App.js');
  fs.copyFileSync(path.resolve(templateRoot, 'App.js'), path.resolve(projectRoot, 'App.js'));

  // add title
  const appTitle = getProjectName(packageName)
    .split('-')
    .map((str) => str.charAt(0).toUpperCase() + str.slice(1))
    .join(' ');

  let appJs = fs.readFileSync(projectAppJsPath, { encoding: 'utf-8' });
  appJs = appJs.replace('{{ title }}', appTitle);

  fs.writeFileSync(projectAppJsPath, appJs, { encoding: 'utf-8' });

  return await spawnAsync('yarn', ['install'], { cwd: projectRoot, stdio: 'ignore' });
}
