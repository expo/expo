import { IosPlist } from '@expo/xdl';
import fs from 'fs';
import path from 'path';

import { getPackageRoot, getProjectRoot, getTargetName } from '../helpers';
import { addDevMenu } from './addDevMenu';

export function copyTemplateFiles(packageName: string) {
  const packageRoot = getPackageRoot(packageName);
  const projectRoot = getProjectRoot(packageName);
  // eslint-disable-next-line
  const templateRoot = path.resolve(projectRoot, '../../template-files/stories-templates');

  // metro config
  const metroConfigPath = path.resolve(templateRoot, 'metro.config.js');
  fs.copyFileSync(metroConfigPath, path.resolve(projectRoot, 'metro.config.js'));

  // package.json
  const defaultPkg = require(path.resolve(templateRoot, 'pkg.json'));
  const projectPkg = require(path.resolve(projectRoot, 'package.json'));
  const packagePkg = require(path.resolve(packageRoot, 'package.json'));

  const mergedPkg = {
    ...projectPkg,
    ...defaultPkg,
  };

  // configure story server
  mergedPkg.expoStories = {
    projectRoot,
    watchRoot: packageRoot,
  };

  // remove dependencies from excluded autolinked packages
  const extraNodeModules: any = packagePkg.expoStories?.packages ?? {};

  mergedPkg.dependencies = {
    ...mergedPkg.dependencies,
    ...extraNodeModules,
  };

  fs.writeFileSync(
    path.resolve(projectRoot, 'package.json'),
    JSON.stringify(mergedPkg, null, '\t')
  );

  // AppDelegate.{h,m}
  const targetName = getTargetName(packageName);
  const iosRoot = path.resolve(projectRoot, 'ios', targetName);

  let appDelegateHeader = fs.readFileSync(path.resolve(iosRoot, 'AppDelegate.h'), {
    encoding: 'utf-8',
  });

  appDelegateHeader = appDelegateHeader.replace(
    '#import <UMCore/UMAppDelegateWrapper.h>\n',
    '#import <ExpoModulesCore/EXAppDelegateWrapper.h>\n'
  );

  appDelegateHeader = appDelegateHeader.replace('UMAppDelegateWrapper', 'EXAppDelegateWrapper');

  fs.writeFileSync(path.resolve(iosRoot, 'AppDelegate.h'), appDelegateHeader, {
    encoding: 'utf-8',
  });

  addDevMenu(packageName);

  // Podfile
  const podfileRoot = path.resolve(projectRoot, 'ios/Podfile');
  fs.copyFileSync(path.resolve(templateRoot, 'ios/Podfile'), podfileRoot);

  // update target
  let podFileStr = fs.readFileSync(podfileRoot, { encoding: 'utf-8' });
  podFileStr = podFileStr.replace('{{ targetName }}', targetName);
  fs.writeFileSync(path.resolve(projectRoot, 'ios/Podfile'), podFileStr, { encoding: 'utf-8' });

  // Info.plist -> add splash screen
  IosPlist.modifyAsync(iosRoot, 'Info', (config) => {
    config['UILaunchStoryboardName'] = 'SplashScreen';
    return config;
  });

  fs.copyFileSync(path.resolve(templateRoot, 'App.js'), path.resolve(projectRoot, 'App.js'));
}
