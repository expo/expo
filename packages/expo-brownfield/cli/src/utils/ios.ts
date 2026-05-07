import chalk from 'chalk';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { runCommand } from './commands';
import { XCFramework } from './constants';
import CLIError from './error';
import {
  ensureCorrectFlavor,
  enumerateAllPrebuildModules,
  resolvedFixedXCFrameworks,
} from './precompiled';
import { withSpinner } from './spinner';
import type { IosConfig } from './types';

/**
 * Inspect the built brownfield framework binary and return the names of `@rpath`-linked
 * dynamic frameworks that are NOT already covered by the fixed XCFramework set, the
 * brownfield target itself, or precompiled-module enumeration.
 *
 * Source-built pods (e.g. `ExpoModulesJSI` from a local podspec) are produced as dynamic
 * `.framework`s alongside the brownfield framework, and the brownfield binary holds an
 * `@rpath/<X>.framework/<X>` reference to each. Without shipping these as standalone
 * xcframeworks the host app crashes at runtime with `dyld: Library not loaded: @rpath/…`.
 *
 * Returns names without the `.framework` suffix, deduped, in `otool -L` order.
 */
export const enumerateSourceBuiltDeps = (
  config: IosConfig,
  alreadyCovered: Set<string>
): string[] => {
  const frameworkBinary = path.join(config.simulator, `${config.scheme}.framework`, config.scheme);
  if (!fs.existsSync(frameworkBinary)) {
    return [];
  }

  let stdout: string;
  try {
    stdout = execSync(`otool -L "${frameworkBinary}"`, { encoding: 'utf8' });
  } catch {
    // otool failure is non-fatal — degrade gracefully and let the user catch the missing dep
    // at runtime rather than blocking the whole build.
    return [];
  }

  const names = new Set<string>();
  for (const line of stdout.split('\n')) {
    const match = line.trim().match(/^@rpath\/([^/]+)\.framework\//);
    if (match?.[1]) {
      names.add(match[1]);
    }
  }
  return Array.from(names).filter((name) => name !== config.scheme && !alreadyCovered.has(name));
};

/**
 * Build the `-framework <path>` (+ optional `-debug-symbols <dSYM-path>`) arg
 * sequence for one slice of a `xcodebuild -create-xcframework` invocation.
 *
 * `-debug-symbols` is strict — pointing it at a non-existent path fails the
 * whole create step — so we only attach the flag when the dSYM has actually
 * been produced for that slice. dSYMs land at `<framework>.dSYM` next to the
 * `.framework` in the products dir whenever
 * `DEBUG_INFORMATION_FORMAT=dwarf-with-dsym` is in effect (forced for
 * brownfield builds in `buildFramework`, but not guaranteed for transitive
 * source-built deps that build under their own pod build settings).
 */
const xcframeworkSliceArgs = (frameworkPath: string): string[] => {
  const args = ['-framework', frameworkPath];
  const dsymPath = `${frameworkPath}.dSYM`;
  if (fs.existsSync(dsymPath)) {
    args.push('-debug-symbols', dsymPath);
  }
  return args;
};

/**
 * Locate a source-built `.framework` for `name` inside one of the brownfield build product
 * slices. Pods that set `FRAMEWORK_SEARCH_PATHS` to `${PODS_CONFIGURATION_BUILD_DIR}/XCFrameworkIntermediates/<name>`
 * (e.g. `ExpoModulesJSI`) land in `XCFrameworkIntermediates/<name>/<name>.framework` rather
 * than at the slice root, so we check both locations.
 */
const findSourceBuiltFramework = (slicePath: string, name: string): string | null => {
  const candidates = [
    path.join(slicePath, `${name}.framework`),
    path.join(slicePath, 'XCFrameworkIntermediates', name, `${name}.framework`),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
};

/**
 * Build an xcframework from the device + simulator slices of a source-built `.framework`
 * sitting in the brownfield build products dir, and copy it into `dest`. Returns whether
 * the xcframework was produced (false when one or both slices are missing — typically a
 * harmless skip for a system framework or a transitive dep that isn't actually built).
 */
const bundleSourceBuiltFramework = async (
  config: IosConfig,
  name: string,
  dest: string
): Promise<boolean> => {
  const deviceFramework = findSourceBuiltFramework(config.device, name);
  const simulatorFramework = findSourceBuiltFramework(config.simulator, name);

  if (!deviceFramework || !simulatorFramework) {
    console.warn(
      `expo-brownfield: source-built dependency '${name}' is linked by ${config.scheme}.framework ` +
        `but its device/simulator slices were not found under the brownfield build products dir. ` +
        `Skipping. The host app may fail at runtime with 'Library not loaded: @rpath/${name}.framework/${name}'.`
    );
    return false;
  }

  const outputPath = path.join(dest, `${name}.xcframework`);
  if (fs.existsSync(outputPath)) {
    fs.rmSync(outputPath, { recursive: true, force: true });
  }

  const args = [
    '-create-xcframework',
    ...xcframeworkSliceArgs(deviceFramework),
    ...xcframeworkSliceArgs(simulatorFramework),
    '-output',
    outputPath,
  ];

  if (config.dryRun) {
    console.log(`xcodebuild ${args.join(' ')}`);
    return true;
  }

  await runCommand('xcodebuild', args, { verbose: config.verbose });
  return true;
};

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
    // Ensure dSYMs are produced for both Debug and Release so they can be
    // bundled into the resulting xcframework via `-create-xcframework
    // -debug-symbols`. Release defaults to `dwarf-with-dsym`; Debug defaults
    // to plain `dwarf` and would otherwise leave us with no dSYM to ship.
    'DEBUG_INFORMATION_FORMAT=dwarf-with-dsym',
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

  // Bundle any source-built dynamic frameworks the brownfield binary links against
  // (e.g. `ExpoModulesJSI` from a local podspec). Without this the host app crashes at
  // runtime with `dyld: Library not loaded: @rpath/<X>.framework/<X>`.
  const alreadyCovered = collectCoveredFrameworkNames(config);
  const sourceBuiltDeps = enumerateSourceBuiltDeps(config, alreadyCovered);
  for (const depName of sourceBuiltDeps) {
    await withSpinner({
      operation: () => bundleSourceBuiltFramework(config, depName, dest),
      loaderMessage: `Bundling source-built ${depName} as xcframework...`,
      successMessage: `Bundling source-built ${depName} as xcframework succeeded`,
      errorMessage: `Bundling source-built ${depName} as xcframework failed`,
      verbose: config.verbose,
    });
  }
};

/**
 * Set of xcframework names the brownfield CLI already plans to ship (fixed XCFrameworks +
 * prebuilt modules when enabled). Used to dedupe against `enumerateSourceBuiltDeps` so a
 * dep that's already covered by a prebuilt artifact isn't re-built from source.
 */
const collectCoveredFrameworkNames = (config: IosConfig): Set<string> => {
  const covered = new Set<string>([config.scheme, ...resolvedFixedXCFrameworks()]);
  if (config.usePrebuilds) {
    for (const module of enumerateAllPrebuildModules(process.cwd(), config.buildConfiguration)) {
      covered.add(module.name);
    }
  }
  return covered;
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
    ...xcframeworkSliceArgs(`${config.device}/${config.scheme}.framework`),
    ...xcframeworkSliceArgs(`${config.simulator}/${config.scheme}.framework`),
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
      const directoryPath = path.resolve(iosPath, directory.name);
      const directories = [directoryPath];

      let target: string | undefined;
      while ((target = directories.shift()) != null) {
        const entries = fs.readdirSync(target, { withFileTypes: true });
        for (const entry of entries) {
          const childPath = path.join(target, entry.name);
          if (entry.isDirectory()) {
            directories.push(childPath);
          } else if (entry.isFile()) {
            if (entry.name === 'ReactNativeHostManager.swift') return true;
          }
        }
      }

      return false;
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

  // Source-built dynamic deps the brownfield framework links against (e.g. ExpoModulesJSI).
  // `copyXCFrameworks` writes their xcframeworks to disk; we need to declare matching
  // `.binaryTarget`s here so SPM consumers actually link them.
  const sourceBuiltDepNames = enumerateSourceBuiltDeps(
    config,
    new Set([
      config.scheme,
      ...baseFrameworks.map(({ name }) => name),
      ...precompiledModules.map(({ name }) => name),
    ])
  );
  const sourceBuiltDeps = sourceBuiltDepNames.map((name) => ({ name, targets: [name] }));

  const xcframeworks = [...baseFrameworks, ...precompiledModules, ...sourceBuiltDeps];

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
