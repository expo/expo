import chalk from 'chalk';
import fs from 'node:fs';
import path from 'node:path';

import { runCommand } from './commands';
import { XCFramework } from './constants';
import CLIError from './error';
import { ensureCorrectFlavor, enumerateAllPrebuildModules } from './precompiled';
import { withSpinner } from './spinner';
import type { IosConfig } from './types';

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

export const copyXCFrameworks = async (config: IosConfig, dest: string) => {
  console.log('Copying XCFrameworks to:', dest);

  if (config.dryRun) {
    return;
  }

  const xcframeworks = Object.values(XCFramework);
  for (const xcframework of xcframeworks) {
    if (fs.existsSync(xcframework.path)) {
      await withSpinner({
        operation: async () =>
          fs.promises.cp(xcframework.path, path.join(dest, `${xcframework.name}.xcframework`), {
            force: true,
            recursive: true,
          }),
        loaderMessage: `Copying ${xcframework.name} to the artifacts directory...`,
        successMessage: `Copying ${xcframework.name} to the artifacts directory succeeded`,
        errorMessage: `Copying ${xcframework.name} to the artifacts directory failed`,
        verbose: config.verbose,
      });
    } else if (xcframework.name === XCFramework.Hermes.name) {
      CLIError.handle('ios-hermes-framework-not-found', xcframework.path);
    } else {
      console.warn(
        `${xcframework.name} not found in source path: ${xcframework.path}. Assuming it's built from sources`
      );
    }
  }

  if (config.usePrebuilds) {
    // Single source of truth: enumerates all three layers (pod → bundled-npm → shared
    // `.spm-deps/`) and runs the strict completeness check. Failing here surfaces missing
    // deps at packaging time (rather than as `Library not loaded: @rpath/...` at runtime).
    const modules = enumerateAllPrebuildModules(process.cwd(), config.buildConfiguration);

    // Reconcile flavor once per pod — replace-xcframework.js extracts the whole tarball
    // (main + sibling SPM-dep xcframeworks) in one shot, so re-running per-xcframework would
    // unpack the same tarball repeatedly. SPM-dep entries (mainProduct === name, no artifacts/)
    // skip reconciliation entirely inside ensureCorrectFlavor.
    const reconciledPods = new Set<string>();
    for (const module of modules) {
      if (!reconciledPods.has(module.podDir)) {
        reconciledPods.add(module.podDir);
        await ensureCorrectFlavor(module, config.buildConfiguration, { verbose: config.verbose });
      }
      await withSpinner({
        operation: async () =>
          fs.promises.cp(module.xcframeworkPath, path.join(dest, `${module.name}.xcframework`), {
            force: true,
            recursive: true,
          }),
        loaderMessage: `Copying ${module.name} to the artifacts directory...`,
        successMessage: `Copying ${module.name} to the artifacts directory succeeded`,
        errorMessage: `Copying ${module.name} to the artifacts directory failed`,
        verbose: config.verbose,
      });
    }
  }
};

export const createSwiftPackage = async (config: IosConfig): Promise<string> => {
  if (config.dryRun && config.output !== 'frameworks') {
    console.log(
      `Creating Swift package with name: ${config.output.packageName} at path: ${config.artifacts}`
    );
    return '';
  }

  return await withSpinner({
    operation: async () => {
      if (config.output === 'frameworks') {
        return '';
      }

      const packagePath = path.join(config.artifacts, config.output.packageName);
      await fs.promises.mkdir(packagePath, { recursive: true });

      // <package-name>/xcframeworks
      const xcframeworksDir = path.join(packagePath, 'xcframeworks');
      await fs.promises.mkdir(xcframeworksDir, { recursive: true });

      await generatePackageMetadataFile(config, packagePath);

      return packagePath;
    },
    loaderMessage: 'Creating Swift package...',
    successMessage: 'Creating Swift package succeeded',
    errorMessage: 'Creating Swift package failed',
    verbose: config.verbose,
  });
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

  return;
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

  return;
};

export const generatePackageMetadataFile = async (config: IosConfig, packagePath: string) => {
  if (config.output === 'frameworks') {
    return;
  }

  const prebuiltFrameworks = fs.existsSync(XCFramework.React.path);
  const baseFrameworks = [
    { name: config.scheme, targets: [config.scheme] },
    { name: 'hermesvm', targets: ['hermesvm'] },
    ...(prebuiltFrameworks ? [XCFramework.React, XCFramework.ReactDependencies] : []),
  ];

  // Use the same enumeration + completeness check that `copyXCFrameworks` runs, so every
  // xcframework that lands on disk is also declared as a `.binaryTarget` here (and vice-versa).
  // The check fails fast — Package.swift never gets written if a declared SPM dep is missing.
  const precompiledModules = config.usePrebuilds
    ? enumerateAllPrebuildModules(process.cwd(), config.buildConfiguration).map(({ name }) => ({
        name,
        targets: [name],
      }))
    : [];

  const xcframeworks = [...baseFrameworks, ...precompiledModules];

  // With prebuilds the module graph is large; expose a single aggregate library so consumers
  // `import <PackageName>` once and Xcode links every underlying binary target automatically.
  // Without prebuilds keep one `.library` per framework for backwards compatibility.
  const products = config.usePrebuilds
    ? [
        libraryProduct(
          config.output.packageName,
          xcframeworks.map(({ name }) => name)
        ),
      ]
    : xcframeworks.map(({ name, targets }) => libraryProduct(name, targets));

  const contents = `// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "${config.output.packageName}",
    platforms: [${(await getSupportedPlatforms(config)).join(',')}],
    products: [
${products.join('\n')}
    ],
    targets: [
${xcframeworks.map(({ name }) => binaryTarget(name)).join('\n')}
    ],
);
`;

  await fs.promises.writeFile(path.join(packagePath, 'Package.swift'), contents);
};

export const getSupportedPlatforms = async (config: IosConfig): Promise<string[]> => {
  // Try to infer `IPHONEOS_DEPLOYMENT_TARGET` from the project
  const args = ['-workspace', config.workspace, '-scheme', config.scheme, '-showBuildSettings'];

  try {
    const { stdout } = await runCommand('xcodebuild', args, { verbose: false });
    const regex = /^\s*IPHONEOS_DEPLOYMENT_TARGET = (.+)$/m;
    const value = regex.exec(stdout)?.[1]?.trim();
    if (value) {
      return [`.iOS("${value}")`];
    } else {
      throw new Error();
    }
  } catch (error) {
    console.warn(
      'Failed to infer `IPHONEOS_DEPLOYMENT_TARGET` from the project, defaulting to iOS v15'
    );
  }

  // If failed to infer default to iOS v15
  return ['.iOS(.v15)'];
};

export const libraryProduct = (name: string, targets: string[]) => {
  return `      .library(
        name: "${name}",
        targets: ["${targets.join('", "')}"],
      ),`;
};

export const binaryTarget = (name: string) => {
  return `      .binaryTarget(
        name: "${name}",
        path: "xcframeworks/${name}.xcframework",
      ),`;
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
  console.log(` - Bundle precompiled modules: ${chalk.blue(config.usePrebuilds)}`);

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

export const shipSwiftPackage = async (config: IosConfig) => {
  // Create artifacts directory and swift package
  await cleanUpArtifacts(config);
  makeArtifactsDirectory(config);
  const packagePath = await createSwiftPackage(config);
  const xcframeworksPath = path.join(packagePath, 'xcframeworks');

  // Copy/create XCFrameworks into the package
  await createXCframework(config, xcframeworksPath);
  await copyXCFrameworks(config, xcframeworksPath);
};
