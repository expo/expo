import spawnAsync from '@expo/spawn-async';
import { IosPlist } from '@expo/xdl';
import fs from 'fs';
import inquirer from 'inquirer';
import path from 'path';
import { podInstallAsync } from '../CocoaPods';

import { runExpoCliAsync } from '../ExpoCLI';
import Logger from '../Logger';

type Action = {
  platform: 'android' | 'ios' | 'web';
  rebuild: boolean;
  clearCache: boolean;
};

async function action(packageName: string, options: Action) {
  let { platform, rebuild = false, clearCache = false } = options;

  if (!packageName) {
    const cwdPkg = require(path.resolve(process.cwd(), 'package.json'));
    const cwdPkgName = cwdPkg.name;

    if (cwdPkgName && cwdPkgName !== '@expo/expo') {
      packageName = cwdPkgName;
    }
  }

  if (!packageName) {
    const { pkg } = await inquirer.prompt({
      type: 'input',
      name: 'pkg',
      message: 'Which package are you working on?',
    });

    packageName = pkg;
  }

  // eslint-disable-next-line
  const packageRoot = path.resolve(__dirname, '../../../packages', packageName);
  if (!fs.existsSync(packageRoot)) {
    throw new Error(
      `${packageName} does not exist - are you sure you selected the correct package?`
    );
  }

  // eslint-disable-next-line
  const examplesRoot = path.resolve(__dirname, '../../../story-loaders');

  if (!fs.existsSync(examplesRoot)) {
    fs.mkdirSync(examplesRoot);
  }

  const projectName = `${packageName}-stories`;
  const targetName = projectName.split('-').join('');

  const projectRoot = path.resolve(examplesRoot, projectName);

  if (rebuild || !fs.existsSync(projectRoot)) {
    if (fs.existsSync(projectRoot)) {
      // @ts-ignore
      fs.rmdirSync(projectRoot, { recursive: true, force: true });
    }

    Logger.log();
    Logger.info(`🛠  Building fresh story loader for ${packageName}`);
    Logger.log();

    // 1. initialize expo project w/ name
    await runExpoCliAsync('init', [projectName, '-t', 'bare-minimum', '--no-install'], {
      cwd: examplesRoot,
      stdio: 'ignore',
    });

    // remove .git repo for newly built project
    // @ts-ignore
    fs.rmdirSync(path.resolve(projectRoot, '.git'), { force: true, recursive: true });

    // 2. run expo prebuild on project
    // First update bundle ids
    const appJsonPath = path.resolve(projectRoot, 'app.json');
    const appJson = require(appJsonPath);
    const bundleId = `com.expostories.${targetName}`;

    appJson.expo.android = {
      package: bundleId,
    };

    appJson.expo.ios = {
      bundleIdentifier: bundleId,
    };

    fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, '\t'), { encoding: 'utf-8' });

    await runExpoCliAsync('prebuild', ['--no-install'], { cwd: projectRoot, stdio: 'ignore' });
  }

  // 3. copy over template files for project
  // eslint-disable-next-line
  const templateRoot = path.resolve(__dirname, '../../../template-files/stories-templates');

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
  const iosRoot = path.resolve(projectRoot, 'ios', targetName);

  fs.copyFileSync(
    path.resolve(templateRoot, 'ios/AppDelegate.h'),
    path.resolve(iosRoot, 'AppDelegate.h')
  );

  fs.copyFileSync(
    path.resolve(templateRoot, 'ios/AppDelegate.m'),
    path.resolve(iosRoot, 'AppDelegate.m')
  );

  // Podfile
  const podfileRoot = path.resolve(projectRoot, 'ios/Podfile');
  fs.copyFileSync(path.resolve(templateRoot, 'ios/Podfile'), podfileRoot);

  // update target
  let podFileStr = fs.readFileSync(podfileRoot, { encoding: 'utf-8' });
  podFileStr = podFileStr.replace('{{ targetName }}', targetName);

  fs.writeFileSync(path.resolve(projectRoot, 'ios/Podfile'), podFileStr, { encoding: 'utf-8' });
  fs.unlinkSync(path.resolve(projectRoot, 'react-native.config.js'));

  // Info.plist -> add splash screen
  IosPlist.modifyAsync(iosRoot, 'Info', (config) => {
    config['UILaunchStoryboardName'] = 'SplashScreen';
    return config;
  });

  fs.copyFileSync(path.resolve(templateRoot, 'App.js'), path.resolve(projectRoot, 'App.js'));

  // 4. yarn + install deps
  Logger.log('🧶 Yarning...');
  Logger.log();
  await spawnAsync('yarn', ['install'], { cwd: projectRoot });

  if (clearCache) {
    Logger.log('🧶 Clearing cache...');
    Logger.log();

    const podLockfilePath = path.resolve(projectRoot, 'ios', 'Podfile.lock');
    if (fs.existsSync(podLockfilePath)) {
      fs.unlinkSync(podLockfilePath);
    }
  }

  Logger.log('✅ Done!');
  Logger.log();

  if (!platform) {
    const { selectedPlatform } = await inquirer.prompt({
      type: 'list',
      name: 'selectedPlatform',
      message: 'Which platform are you working on?',
      choices: [
        { value: 'ios', name: 'iOS' },
        { value: 'android', name: 'Android' },
        { value: 'web', name: 'Web' },
      ],
    });

    platform = selectedPlatform;
  }

  Logger.log();

  if (platform === 'web') {
    // TODO
  } else {
    await podInstallAsync(path.resolve(projectRoot, 'ios'));

    const command = `run-${platform}`;
    Logger.log(`🛠  Building for ${platform}...this may take a few minutes`);
    Logger.log();

    const { child: bundlerProcess } = spawnAsync('yarn', ['react-native', 'start'], {
      cwd: projectRoot,
      stdio: 'inherit',
    });

    const { child: buildProcess } = spawnAsync('react-native', [command], {
      cwd: projectRoot,
      stdio: 'inherit',
    });

    const { child: storiesProcess } = spawnAsync('yarn', ['stories'], {
      cwd: projectRoot,
      stdio: 'inherit',
    });

    process.on('SIGINT', () => {
      bundlerProcess.kill('SIGINT');
      buildProcess.kill('SIGINT');
      storiesProcess.kill('SIGINT');
      process.exit(1);
    });

    process.on('SIGTERM', () => {
      bundlerProcess.kill('SIGTERM');
      buildProcess.kill('SIGTERM');
      storiesProcess.kill('SIGTERM');
      process.exit(1);
    });
  }
}

export default (program: any) => {
  program
    .command('run-stories [packageName]')
    .option('-r, --rebuild', 'Rebuild the project from scratch')
    .option('-c, --clear-cache', 'Clear and reinstall depedencies')
    .option('-p, --platform <string>', 'The platform the app will run in')
    .asyncAction(action);
};
