import fs from 'node:fs/promises';

import { Errors, Help } from '../../constants';
import {
  BuildConfigIos,
  ensurePrebuild,
  getCommonConfig,
  getIosConfig,
  printConfig,
  runCommand,
  withSpinner,
} from '../../utils';

const action = async () => {
  // const args = parseArgs({
  //   spec: Args.IOS,
  //   // Skip first three args:
  //   // <node-path> expo-brownfield build:ios
  //   argv: process.argv.slice(3),
  //   stopAtPositional: true,
  // });

  // if (getCommand(args)) {
  //   return Errors.additionalCommand('build:ios');
  // }

  // // Only resolve --help and --verbose options
  // const basicConfig = getCommonConfig(args);
  // if (basicConfig.help) {
  //   console.log(Help.IOS);
  //   return process.exit(0);
  // }

  // await ensurePrebuild('ios');

  // const config = await getIosConfig(args);
  // printConfig(config);

  // await cleanUpArtifacts(config);
  // await runBuild(config);
  // await packageFrameworks(config);
  // await copyHermesFramework(config);
  console.log('build:ios');
};

export default action;

const cleanUpArtifacts = async (config: BuildConfigIos) => {
  if (config.dryRun) {
    console.log('Cleaning up previous artifacts');
    return;
  }

  return withSpinner({
    operation: async () => {
      try {
        await fs.access(config.artifacts);
      } catch (error) {
        return;
      }

      const artifacts = (await fs.readdir(config.artifacts)).filter((artifact) =>
        artifact.endsWith('.xcframework')
      );

      for (const artifact of artifacts) {
        await fs.rm(`${config.artifacts}/${artifact}`, {
          recursive: true,
          force: true,
        });
      }
    },
    loaderMessage: 'Cleaning up previous artifacts...',
    successMessage: 'Cleaning up previous artifacts succeeded',
    errorMessage: 'Cleaning up previous artifacts failed',
  });
};

const runBuild = async (config: BuildConfigIos) => {
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
    config.buildType.charAt(0).toUpperCase() + config.buildType.slice(1),
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

const packageFrameworks = async (config: BuildConfigIos) => {
  const args = [
    '-create-xcframework',
    '-framework',
    `${config.device}/${config.scheme}.framework`,
    '-framework',
    `${config.simulator}/${config.scheme}.framework`,
    '-output',
    `${config.artifacts}/${config.scheme}.xcframework`,
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

const copyHermesFramework = async (config: BuildConfigIos) => {
  if (config.dryRun) {
    console.log(
      `Copying hermes XCFramework from ${config.hermesFrameworkPath} to ${config.artifacts}/hermes.xcframework`
    );
    return;
  }

  return withSpinner({
    operation: () =>
      fs.cp(`./ios/${config.hermesFrameworkPath}`, `${config.artifacts}/hermes.xcframework`, {
        force: true,
        recursive: true,
      }),
    loaderMessage: 'Copying hermes.xcframework to the artifacts directory...',
    successMessage: 'Copying hermes.xcframework to the artifacts directory succeeded',
    errorMessage: 'Copying hermes.xcframework to the artifacts directory failed',
    verbose: config.verbose,
  });
};
