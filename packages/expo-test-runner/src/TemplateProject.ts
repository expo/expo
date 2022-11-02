import spawnAsync from '@expo/spawn-async';
import { Definitions } from 'dot';
import fs from 'fs';
import path from 'path';

import BundlerController from './BundlerController';
import { Application, DetoxTest } from './Config';
import { Platform } from './Platform';
import TemplateEvaluator from './TemplateEvaluator';
import { ProjectFile, TemplateFilesFactory, UserFile } from './TemplateFile';
import { killVirtualDevicesAsync } from './Utils';

export default class TemplateProject {
  constructor(
    protected config: Application,
    protected name: string,
    protected platform: Platform,
    protected configFilePath: string
  ) {}

  getDefinitions(): Definitions {
    return {
      name: 'devcliente2e',
      appEntryPoint: 'e2e/app/App',
    };
  }

  async createApplicationAsync(projectPath: string) {
    // TODO: this assumes there is a parent folder
    const parentFolder = path.resolve(projectPath, '..');
    if (!fs.existsSync(parentFolder)) {
      fs.mkdirSync(parentFolder, { recursive: true });
    }

    const appName = 'dev-client-e2e';
    await spawnAsync('yarn', ['create', 'expo-app', appName], {
      stdio: 'inherit',
      cwd: parentFolder,
    });
    fs.renameSync(path.join(parentFolder, appName), projectPath);

    const repoRoot = path.resolve(this.configFilePath, '..', '..', '..');
    const localCliBin = path.join(repoRoot, 'packages/@expo/cli/build/bin/cli');
    await spawnAsync(localCliBin, ['install', 'detox', 'jest'], {
      stdio: 'inherit',
      cwd: projectPath,
    });

    // add local dependencies
    let packageJson = JSON.parse(fs.readFileSync(path.join(projectPath, 'package.json'), 'utf-8'));
    packageJson = {
      ...packageJson,
      dependencies: {
        ...packageJson.dependencies,
        'expo-dev-client': `file:${repoRoot}/packages/expo-dev-client`,
        'expo-dev-menu-interface': `file:${repoRoot}/packages/expo-dev-menu-interface`,
        'expo-status-bar': `file:${repoRoot}/packages/expo-status-bar`,
        expo: `file:${repoRoot}/packages/expo`,
        'jest-circus': packageJson.dependencies.jest,
      },
      resolutions: {
        ...packageJson.resolutions,
        'expo-application': `file:${repoRoot}/packages/expo-application`,
        'expo-asset': `file:${repoRoot}/packages/expo-asset`,
        'expo-constants': `file:${repoRoot}/packages/expo-constants`,
        'expo-dev-launcher': `file:${repoRoot}/packages/expo-dev-launcher`,
        'expo-dev-menu': `file:${repoRoot}/packages/expo-dev-menu`,
        'expo-error-recovery': `file:${repoRoot}/packages/expo-error-recovery`,
        'expo-file-system': `file:${repoRoot}/packages/expo-file-system`,
        'expo-font': `file:${repoRoot}/packages/expo-font`,
        'expo-keep-awake': `file:${repoRoot}/packages/expo-keep-awake`,
        'expo-manifests': `file:${repoRoot}/packages/expo-manifests`,
        'expo-modules-autolinking': `file:${repoRoot}/packages/expo-modules-autolinking`,
        'expo-modules-core': `file:${repoRoot}/packages/expo-modules-core`,
        'expo-updates-interface': `file:${repoRoot}/packages/expo-updates-interface`,
      },
    };
    fs.writeFileSync(
      path.join(projectPath, 'package.json'),
      JSON.stringify(packageJson, null, 2),
      'utf-8'
    );

    // configure app.json
    let appJson = JSON.parse(fs.readFileSync(path.join(projectPath, 'app.json'), 'utf-8'));
    appJson = {
      ...appJson,
      expo: {
        ...appJson.expo,
        android: { ...appJson.android, package: 'com.testrunner' },
        ios: { ...appJson.ios, bundleIdentifier: 'com.testrunner' },
      },
    };
    fs.writeFileSync(path.join(projectPath, 'app.json'), JSON.stringify(appJson, null, 2), 'utf-8');

    // pack local template and prebuild
    const localTemplatePath = path.join(repoRoot, 'templates', 'expo-template-bare-minimum');
    await spawnAsync('npm', ['pack', '--pack-destination', projectPath], {
      cwd: localTemplatePath,
      stdio: 'inherit',
    });
    const templateVersion = require(path.join(localTemplatePath, 'package.json')).version;

    await spawnAsync(
      localCliBin,
      ['prebuild', '--template', `expo-template-bare-minimum-${templateVersion}.tgz`],
      {
        stdio: 'inherit',
        cwd: projectPath,
      }
    );

    const templateFiles = this.getTemplateFiles();
    await this.copyFilesAsync(projectPath, templateFiles);
    await this.evaluateFiles(projectPath, templateFiles);

    // workaround for instrumented unit test files not compiling in this
    // configuration (ignored in .npmignore)
    await spawnAsync('rm', ['-rf', 'node_modules/expo-dev-client/android/src/androidTest'], {
      stdio: 'inherit',
      cwd: projectPath,
    });
  }

  getTemplateFiles(): { [path: string]: ProjectFile } {
    const tff = new TemplateFilesFactory('detox');

    const additionalFiles: { [path: string]: ProjectFile } = this.config.additionalFiles?.reduce(
      (reducer, file) => ({
        ...reducer,
        [file]: new UserFile(this.userFilePath(file)),
      }),
      {}
    );

    if (this.config.android?.detoxTestFile) {
      additionalFiles['android/app/src/androidTest/java/com/testrunner/DetoxTest.java'] =
        new UserFile(this.userFilePath(this.config.android.detoxTestFile), Platform.Android);
    }

    return {
      'android/build.gradle': tff.androidFile(),
      'android/app/build.gradle': tff.androidFile(),
      'android/app/src/androidTest/java/com/testrunner/DetoxTest.java': tff.androidFile(),
      'android/app/src/main/java/com/testrunner/MainApplication.java': tff.androidFile(),
      'index.js': tff.file(true),
      'ios/devcliente2e/main.m': tff.iosFile(),
      [this.config.detoxConfigFile]: new UserFile(
        this.userFilePath(this.config.detoxConfigFile),
        Platform.Both,
        true
      ),
      ...additionalFiles,
    };
  }

  protected userFilePath(relativePath: string): string {
    return path.join(this.configFilePath, '..', relativePath);
  }

  protected async copyFilesAsync(projectPath: string, files: { [path: string]: ProjectFile }) {
    await Promise.all(Object.entries(files).map(([path, file]) => file.copy(projectPath, path)));
  }

  protected async evaluateFiles(projectPath: string, files: { [path: string]: ProjectFile }) {
    const templateEvaluator = new TemplateEvaluator(this.getDefinitions());
    await Promise.all(
      Object.entries(files).map(([path, file]) =>
        file.evaluate(projectPath, path, templateEvaluator)
      )
    );
  }

  async build(projectPath: string, test: DetoxTest): Promise<void> {
    for (const conf of test.configurations) {
      await spawnAsync('yarn', ['detox', 'build', '-c', conf], {
        cwd: projectPath,
        stdio: 'inherit',
      });
    }
  }

  async run(projectPath: string, test: DetoxTest): Promise<void> {
    let bundler: BundlerController | undefined;
    try {
      bundler = new BundlerController(projectPath);

      if (test.shouldRunBundler) {
        await bundler.start();
      }

      for (const conf of test.configurations) {
        await spawnAsync(
          'yarn',
          ['detox', 'test', '-c', conf, '--ci', '--headless', '--gpu', 'swiftshader_indirect'],
          {
            cwd: projectPath,
            stdio: 'inherit',
          }
        );

        await killVirtualDevicesAsync(this.platform);
      }
    } finally {
      // If bundler wasn't started is noop.
      await bundler?.stop();
    }
  }
}
