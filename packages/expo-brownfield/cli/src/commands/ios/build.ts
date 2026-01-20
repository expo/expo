import fs from 'node:fs/promises';

import { Args, Help } from '../../constants';
import {
  BuildConfigIos,
  ensurePrebuild,
  getIosConfig,
  parseArgs,
  printConfig,
  runCommand,
  withSpinner,
} from '../../utils';

const action = async () => {
  const args = parseArgs({
    spec: Args.IOS,
    argv: process.argv.slice(2),
  });

  await ensurePrebuild('ios');

  const config = await getIosConfig(args);
  if (config.help) {
    console.log(Help.IOS);
    return process.exit(0);
  }

  printConfig(config);

  await cleanUpArtifacts(config.artifacts);
  await runBuild(config);
  await packageFrameworks(config);
  await copyHermesFramework(config);
};

export default action;

const cleanUpArtifacts = async (artifactsPath: string) => {
  return withSpinner({
    operation: async () => {
      try {
        await fs.access(artifactsPath);
      } catch (error) {
        return;
      }

      const artifacts = (await fs.readdir(artifactsPath)).filter((artifact) =>
        artifact.endsWith('.xcframework')
      );

      for (const artifact of artifacts) {
        await fs.rm(`${artifactsPath}/${artifact}`, {
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
  return withSpinner({
    operation: () =>
      runCommand(
        'xcodebuild',
        [
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
        ],
        {
          verbose: config.verbose,
        }
      ),
    loaderMessage: 'Compiling framework...',
    successMessage: 'Compiling framework succeeded',
    errorMessage: 'Compiling framework failed',
    verbose: config.verbose,
  });
};

const packageFrameworks = async (config: BuildConfigIos) => {
  return withSpinner({
    operation: () =>
      runCommand(
        'xcodebuild',
        [
          '-create-xcframework',
          '-framework',
          `${config.device}/${config.scheme}.framework`,
          '-framework',
          `${config.simulator}/${config.scheme}.framework`,
          '-output',
          `${config.artifacts}/${config.scheme}.xcframework`,
        ],
        {
          verbose: config.verbose,
        }
      ),
    loaderMessage: 'Packaging framework into an XCFramework...',
    successMessage: 'Packaging framework into an XCFramework succeeded',
    errorMessage: 'Packaging framework into an XCFramework failed',
    verbose: config.verbose,
  });
};

const copyHermesFramework = async (config: BuildConfigIos) => {
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
