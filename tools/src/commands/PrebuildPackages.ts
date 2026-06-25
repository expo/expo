import { Command } from '@expo/commander';

import {
  createRequest,
  createContext,
  runPrebuildPipeline,
  installSignalHandlers,
} from '../prebuilds/pipeline/Index';
import type { PrebuildCliOptions } from '../prebuilds/pipeline/Index';
import { prunePrebuildBuildFilesAsync } from '../prebuilds/Prune';

export async function runPrebuildPackagesAsync(
  packageNames: string[],
  options: PrebuildCliOptions
) {
  const request = createRequest(packageNames, options);
  const ctx = createContext(request);
  const removeHandlers = installSignalHandlers(ctx);

  try {
    return await runPrebuildPipeline(ctx);
  } finally {
    removeHandlers();
  }
}

async function main(packageNames: string[], options: PrebuildCliOptions) {
  // `et prebuild prune [all | <packageNames...>]` removes the intermediate build files
  // (Xcode DerivedData) while keeping the composed xcframeworks. It's keyed off the first
  // positional rather than a real subcommand because the CLI dispatches on the command name.
  if (packageNames[0] === 'prune') {
    const { exitCode } = await prunePrebuildBuildFilesAsync(packageNames.slice(1), {
      includeExternal: options.includeExternal,
      externalOnly: options.externalOnly,
      dryRun: options.dryRun,
    });
    process.exit(exitCode);
  }

  const result = await runPrebuildPackagesAsync(packageNames, options);
  process.exit(result.exitCode);
}

export default (program: Command) => {
  program
    .command('prebuild-packages [packageNames...]')
    .description(
      'Generates `.xcframework` artifacts for iOS packages. If no package names are provided, builds the default distributed set; pass --all-packages to build every package with an spm.config.json.\n' +
        'Run `et prebuild prune [packageNames...]` to delete the intermediate build files (Xcode DerivedData, ~2GB/package) while keeping the composed xcframeworks. With no names (or `all`) it cleans every build cache found on disk; pass package names to prune only those. Add --dry-run to preview what would be removed.'
    )
    .alias('prebuild')
    .option(
      '-v, --verbose',
      'Print every build step and the full xcodebuild line stream. Off by default; in CI only success/failure lines, compile warnings/errors, and the run summary are printed.',
      false
    )
    .option(
      '--react-native-version <version>',
      'Provides the current React Native version. Auto-detected from bare-expo if not set.'
    )
    .option('--hermes-version <version>', 'Provides the current Hermes version.')
    .option(
      '-f, --flavor <flavor>',
      'Build flavor (Debug or Release). If not specified, builds both.'
    )
    .option(
      '--local-react-native-tarball <path>',
      'Local path to a React Native tarball. Supports {flavor} placeholder for per-flavor paths.'
    )
    .option(
      '--local-hermes-tarball <path>',
      'Local path to a Hermes tarball. Supports {flavor} placeholder for per-flavor paths.'
    )
    .option(
      '--local-react-native-deps-tarball <path>',
      'Local path to a React Native Dependencies tarball. Supports {flavor} placeholder for per-flavor paths.'
    )
    .option(
      '--clean',
      'Cleans all package outputs (xcframeworks, generated code, build folders) before building. Does not touch the dependency cache.',
      false
    )
    .option(
      '--clean-cache',
      'Clears the entire dependency cache, forcing a fresh download of all artifacts.',
      false
    )
    .option(
      '--dry-run',
      'Only applies to `prebuild prune`: list the build files that would be removed (with sizes) without deleting anything.',
      false
    )
    .option('--skip-generate', 'Skip the generate step.', false)
    .option('--skip-artifacts', 'Skip downloading build artifacts.', false)
    .option('--skip-build', 'Skip the build step.', false)
    .option('--skip-compose', 'Skip composing xcframeworks from build artifacts.', false)
    .option('--skip-verify', 'Skip verification of built xcframeworks.', false)
    .option(
      '-p, --platform <platform>',
      'Build platform (iOS, macOS, tvOS, watchOS). If not specified, builds for all platforms defined in the package.'
    )
    .option(
      '-n, --product <name>',
      'Specify a single product name to prebuild if a package contains multiple products.'
    )
    .option(
      '--include-external',
      'Include external (third-party) packages from external-configs/ios/ in discovery and building.',
      false
    )
    .option(
      '--external-only',
      'Build only external (third-party) packages. Implies --include-external.',
      false
    )
    .option(
      '--all-packages',
      'When no package names are given, build every Expo package with an spm.config.json instead of only the default distributed set.',
      false
    )
    .option(
      '-s, --sign <identity>',
      'Code signing identity (certificate name) to sign the XCFrameworks. If not provided, frameworks are left unsigned.'
    )
    .option(
      '--no-timestamp',
      'Disable secure timestamp when signing. By default, signing includes --timestamp for long-term signature validity.',
      false
    )
    .option(
      '-j, --concurrency <number>',
      'Maximum number of packages to build in parallel. Defaults to CPU core count.',
      (val: string) => parseInt(val, 10)
    )
    .asyncAction(main);
};
