import chalk from 'chalk';
import fs from 'node:fs';
import path from 'node:path';

import { runCommand } from './commands';
import { XCFramework } from './constants';
import CLIError from './error';
import { withSpinner } from './spinner';
import { IosConfig } from './types';

export const cleanUpArtifacts = async (config: IosConfig) => {
  if (config.dryRun) {
    console.log('Cleaning up previous artifacts');
    return;
  }

  return withSpinner({
    operation: async () => {
      if (!fs.existsSync(config.artifacts)) {
        return;
      }

      const xcframeworks = fs
        .readdirSync(config.artifacts)
        .filter((item) => item.endsWith('.xcframework'));
      xcframeworks.forEach((item) => {
        const itemPath = `${config.artifacts}/${item}`;
        fs.rmSync(itemPath, { recursive: true, force: true });
      });
    },
    loaderMessage: 'Cleaning up previous artifacts...',
    successMessage: 'Cleaning up previous artifacts succeeded',
    errorMessage: 'Cleaning up previous artifacts failed',
  });
};

export const buildFramework = async (config: IosConfig) => {
  const args = [
    '-workspace',
    config.workspace,
    '-scheme',
    config.scheme,
    '-derivedDataPath',
    config.derivedDataPath,
    '-destination',
    'generic/platform=iphoneos',
    '-destination',
    'generic/platform=iphonesimulator',
    '-configuration',
    config.buildConfiguration,
  ];

  if (config.dryRun) {
    console.log(`xcodebuild ${args.join(' ')}`);
    return;
  }

  return withSpinner({
    operation: () => runCommand('xcodebuild', args, { verbose: config.verbose }),
    loaderMessage: 'Compiling framework...',
    successMessage: 'Compiling framework succeeded',
    errorMessage: 'Compiling framework failed',
    verbose: config.verbose,
  });
};

export const copyXCFrameworks = async (config: IosConfig, dest: string) => {
  const xcframeworks = (Object.keys(XCFramework) as (keyof typeof XCFramework)[]).map(
    (framework) => ({
      name: path.basename(XCFramework[framework]),
      path: XCFramework[framework],
    })
  );

  for (const xcframework of xcframeworks) {
    const sourcePath = path.join('ios', xcframework.path);
    if (fs.existsSync(sourcePath)) {
      return withSpinner({
        operation: async () =>
          fs.promises.cp(sourcePath, path.join(dest, xcframework.name), {
            force: true,
            recursive: true,
          }),
        loaderMessage: `Copying ${xcframework.name} to the artifacts directory...`,
        successMessage: `Copying ${xcframework.name} to the artifacts directory succeeded`,
        errorMessage: `Copying ${xcframework.name} to the artifacts directory failed`,
        verbose: config.verbose,
      });
    } else if (xcframework.name === 'hermesvm.xcframework') {
      CLIError.handle('ios-hermes-framework-not-found', sourcePath);
    }
  }
};

export const createXCframework = async (config: IosConfig, at: string) => {
  const frameworkName = `${config.scheme}.xcframework`;
  const outputPath = path.join(at, frameworkName);

  const args = [
    '-create-xcframework',
    '-framework',
    `${config.device}/${config.scheme}.framework`,
    '-framework',
    `${config.simulator}/${config.scheme}.framework`,
    '-output',
    outputPath,
  ];

  if (config.dryRun) {
    console.log(`xcodebuild ${args.join(' ')}`);
    return;
  }

  return withSpinner({
    operation: () => runCommand('xcodebuild', args, { verbose: config.verbose }),
    loaderMessage: 'Packaging framework into an XCFramework...',
    successMessage: 'Packaging framework into an XCFramework succeeded',
    errorMessage: 'Packaging framework into an XCFramework failed',
    verbose: config.verbose,
  });
};

export const findScheme = (): string | undefined => {
  try {
    const iosPath = path.join(process.cwd(), 'ios');
    if (!fs.existsSync(iosPath)) {
      CLIError.handle('ios-directory-not-found');
    }

    const subdirectories = fs
      .readdirSync(iosPath, { withFileTypes: true })
      .filter((item) => item.isDirectory());
    const scheme = subdirectories.find((directory) => {
      const directoryPath = path.join(iosPath, directory.name);
      const files = fs.readdirSync(directoryPath, { recursive: true });
      return files.some(
        (file) => typeof file === 'string' && file.endsWith('ReactNativeHostManager.swift')
      );
    });

    if (scheme) {
      return scheme.name;
    }

    CLIError.handle('ios-scheme-not-found');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '';
    CLIError.handle('ios-directory-unknown-error', errorMessage);
  }
};

export const findWorkspace = (): string | undefined => {
  try {
    const iosPath = path.join(process.cwd(), 'ios');
    if (!fs.existsSync(iosPath)) {
      CLIError.handle('ios-directory-not-found');
    }

    const items = fs.readdirSync(iosPath, { withFileTypes: true });
    const workspace = items.find((item) => item.name.endsWith('.xcworkspace'));
    if (workspace) {
      return path.join(iosPath, workspace.name);
    }

    CLIError.handle('ios-workspace-not-found');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '';
    CLIError.handle('ios-workspace-unknown-error', errorMessage);
  }
};

export const makeArtifactsDirectory = (config: IosConfig) => {
  try {
    if (!fs.existsSync(config.artifacts)) {
      fs.mkdirSync(config.artifacts, { recursive: true });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '';
    CLIError.handle('ios-artifacts-directory-unknown-error', errorMessage);
  }
};

export const printIosConfig = (config: IosConfig) => {
  console.log(chalk.bold('Resolved build configuration'));
  console.log(` - Build configuration: ${chalk.blue(config.buildConfiguration)}`);
  console.log(` - Scheme: ${chalk.blue(config.scheme)}`);
  console.log(` - Workspace: ${chalk.blue(config.workspace)}`);
  console.log(` - Dry run: ${chalk.blue(config.dryRun)}`);
  console.log(` - Verbose: ${chalk.blue(config.verbose)}`);
  console.log(` - Artifacts path: ${chalk.blue(config.artifacts)}`);
  console.log();
};

export const shipFrameworks = async (config: IosConfig) => {
  // Create artifacts directory
  await cleanUpArtifacts(config);
  makeArtifactsDirectory(config);

  // Copy/create XCFrameworks into the package
  await createXCframework(config, config.artifacts);
  await copyXCFrameworks(config, config.artifacts);
};

// TODO(pmleczek): Uncomment once rebased
export const shipSwiftPackage = async (config: IosConfig) => {
  // Create artifacts directory and swift package
  await cleanUpArtifacts(config);
  makeArtifactsDirectory(config);
  // const packagePath = await createSwiftPackage(config);
  // const xcframeworksPath = path.join(packagePath, 'xcframeworks');

  // Copy/create XCFrameworks into the package
  // await createXCframework(config, xcframeworksPath);
  // await copyXCFrameworks(config, xcframeworksPath);
};
