import chalk from 'chalk';
import fs from 'node:fs';
import path from 'node:path';

import { runCommand } from './commands';
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

      fs.readdirSync(config.artifacts).forEach((item) => {
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

export const copyHermesXcframework = async (config: IosConfig) => {
  const destinationPath =
    config.output === 'frameworks'
      ? `${config.artifacts}/hermesvm.xcframework`
      : `${config.artifacts}/${config.output.packageName}/xcframeworks/hermesvm.xcframework`;

  if (config.dryRun) {
    console.log(
      `Copying hermes XCFramework from ${config.hermesFrameworkPath} to ${destinationPath}`
    );
    return;
  }

  const sourcePath = `./ios/${config.hermesFrameworkPath}`;
  if (!fs.existsSync(sourcePath)) {
    CLIError.handle('ios-hermes-framework-not-found', sourcePath);
  }

  return withSpinner({
    operation: async () =>
      fs.promises.cp(sourcePath, destinationPath, {
        force: true,
        recursive: true,
      }),
    loaderMessage: 'Copying hermesvm.xcframework to the artifacts directory...',
    successMessage: 'Copying hermesvm.xcframework to the artifacts directory succeeded',
    errorMessage: 'Copying hermesvm.xcframework to the artifacts directory failed',
    verbose: config.verbose,
  });
};

export const createSwiftPackage = async (config: IosConfig) => {
  if (config.dryRun && config.output !== 'frameworks') {
    console.log(
      `Creating Swift package with name: ${config.output.packageName} at path: ${config.artifacts}`
    );
    return;
  }

  return withSpinner({
    operation: async () => {
      if (config.output === 'frameworks') {
        return;
      }

      const packagePath = path.join(config.artifacts, config.output.packageName);
      await fs.promises.mkdir(packagePath, { recursive: true });

      // <package-name>/xcframeworks
      const xcframeworksDir = path.join(packagePath, 'xcframeworks');
      await fs.promises.mkdir(xcframeworksDir, { recursive: true });

      await generatePackageMetadataFile(config, packagePath);
    },
    loaderMessage: 'Creating Swift package...',
    successMessage: 'Creating Swift package succeeded',
    errorMessage: 'Creating Swift package failed',
    verbose: config.verbose,
  });
};

export const createXcframework = async (config: IosConfig) => {
  const output =
    config.output === 'frameworks'
      ? `${config.artifacts}/${config.scheme}.xcframework`
      : `${config.artifacts}/${config.output.packageName}/xcframeworks/${config.scheme}.xcframework`;

  const args = [
    '-create-xcframework',
    '-framework',
    `${config.device}/${config.scheme}.framework`,
    '-framework',
    `${config.simulator}/${config.scheme}.framework`,
    '-output',
    output,
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

export const findWorkspace = (dryRun: boolean): string | undefined => {
  // XCWorkspace cannot be inferred on Ubuntu runners
  // as pods cannot be installed
  if (dryRun) {
    return path.join(process.cwd(), 'ios/testappbuildiospb.xcworkspace');
  }

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

// TODO(pmleczek): Add support for prebuilt RN frameworks in future PR
export const generatePackageMetadataFile = async (config: IosConfig, packagePath: string) => {
  if (config.output === 'frameworks') {
    return;
  }

  const xcframeworks = [
    { name: config.scheme, targets: [config.scheme] },
    { name: 'hermesvm', targets: ['hermesvm'] },
  ];

  const contents = `// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "${config.output.packageName}",
    platforms: [.iOS(.v15)],
    products: [${xcframeworks
      .map(
        (xcf) => `
        .library(
          name: "${xcf.name}",
          targets: ["${xcf.targets.join('", "')}"],
        ),
      `
      )
      .join('\n')}],
    targets: [${xcframeworks
      .map(
        (xcf) => `
        .binaryTarget(
          name: "${xcf.name}",
          path: "xcframeworks/${xcf.name}.xcframework",
        ),
      `
      )
      .join('\n')}]
);
`;

  await fs.promises.writeFile(path.join(packagePath, 'Package.swift'), contents);
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

  if (config.output !== 'frameworks') {
    console.log(` - Package name: ${chalk.blue(config.output.packageName)}`);
  }

  console.log();
};
