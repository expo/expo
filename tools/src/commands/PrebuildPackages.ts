import { Command } from '@expo/commander';

import {
  createRequest,
  createContext,
  runPrebuildPipeline,
  installSignalHandlers,
} from '../prebuilds/pipeline/Index';
import type { PrebuildCliOptions } from '../prebuilds/pipeline/Index';

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
  const result = await runPrebuildPackagesAsync(packageNames, options);
  process.exit(result.exitCode);
}

export default (program: Command) => {
  program
    .command('prebuild-packages [packageNames...]')
    .description(
      'Generates `.xcframework` artifacts for iOS packages. If no package names are provided, discovers all packages with spm.config.json.'
    )
    .alias('prebuild')
    .option('-v, --verbose', 'Enable verbose output (full build logs instead of spinners).', false)
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
