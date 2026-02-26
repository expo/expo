import { Command } from '@expo/commander';

import {
  createRequest,
  createContext,
  runPrebuildPipeline,
  installSignalHandlers,
} from '../prebuilds/pipeline/Index';
import type { PrebuildCliOptions } from '../prebuilds/pipeline/Index';

async function runPrebuildPackagesAsync(packageNames: string[], options: PrebuildCliOptions) {
  const request = createRequest(packageNames, options);
  const ctx = createContext(request);
  const removeHandlers = installSignalHandlers(ctx);
  try {
    const result = await runPrebuildPipeline(ctx);
    process.exit(result.exitCode);
  } finally {
    removeHandlers();
  }
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
      'Include external (third-party) packages from packages/external/ in discovery and building.',
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
    .asyncAction(runPrebuildPackagesAsync);
};
