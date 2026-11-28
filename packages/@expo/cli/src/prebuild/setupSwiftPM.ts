import type { ExpoConfig } from '@expo/config';
import type { SpawnResult } from '@expo/spawn-async';
import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';
import fs from 'fs';
import Module from 'module';
import path from 'path';

import { Log } from '../log';
import { env } from '../utils/env';
import { CommandError } from '../utils/errors';
import { logNewSection } from '../utils/ora';

// The command the template Podfile passes to `use_native_modules!`. Without it, React Native
// falls back to `@react-native-community/cli config`, which Expo projects do not install.
const AUTOLINKING_CONFIG_COMMAND = JSON.stringify([
  'node',
  '--no-warnings',
  '--eval',
  "require('expo/bin/autolinking')",
  'expo-modules-autolinking',
  'react-native-config',
  '--json',
  '--platform',
  'ios',
]);

/**
 * Returns the marker React Native writes to `ios/<name>.xcodeproj` when it sets up Swift Package
 * Manager, or `null` when the iOS project does not use Swift Package Manager.
 */
export function getSwiftPMMarkerPath(projectRoot: string): string | null {
  const iosDir = path.join(projectRoot, 'ios');
  let entries: string[];
  try {
    entries = fs.readdirSync(iosDir);
  } catch {
    return null;
  }
  return (
    entries
      .filter((entry) => entry.endsWith('.xcodeproj'))
      .map((entry) => path.join(iosDir, entry, '.spm-injected.json'))
      .find((marker) => fs.existsSync(marker)) ?? null
  );
}

/**
 * Returns whether the app config allows Swift Package Manager for iOS: it does unless
 * `ios.useCocoaPods` is `true`.
 */
export function isSwiftPMEnabled(exp: ExpoConfig): boolean {
  // `ios.useCocoaPods` is not in the generated ExpoConfig schema yet.
  const ios: (ExpoConfig['ios'] & { useCocoaPods?: unknown }) | undefined = exp.ios;
  return ios?.useCocoaPods !== true;
}

/**
 * Returns whether prebuild sets up iOS with Swift Package Manager. Falls back to CocoaPods with a
 * warning when the project's React Native cannot set up Swift Package Manager and the iOS project
 * does not use it yet.
 */
export function shouldUseSwiftPM(projectRoot: string, exp: ExpoConfig): boolean {
  // `experiments.swiftPackageManager` is not in the generated ExpoConfig schema.
  const experiments: (ExpoConfig['experiments'] & { swiftPackageManager?: unknown }) | undefined =
    exp.experiments;
  const swiftPMEnabled = isSwiftPMEnabled(exp);
  if (experiments?.swiftPackageManager !== undefined) {
    Log.warn(
      swiftPMEnabled
        ? 'The app config sets experiments.swiftPackageManager, which was removed and has no effect. Swift Package Manager is the default for iOS. Remove experiments.swiftPackageManager from the app config. To use CocoaPods, add "ios": { "useCocoaPods": true } to the app config.'
        : 'The app config sets experiments.swiftPackageManager, which was removed. Remove experiments.swiftPackageManager from the app config. ios.useCocoaPods keeps this project on CocoaPods.'
    );
  }
  if (!swiftPMEnabled) {
    return false;
  }
  if (getSwiftPMMarkerPath(projectRoot) || resolveSetupAppleSpmScript(projectRoot)) {
    return true;
  }
  Log.warn(
    'Could not set up Swift Package Manager for iOS because the installed react-native does not include scripts/setup-apple-spm.js, so prebuild uses CocoaPods. Swift Package Manager requires React Native 0.88 or later. If package.json already requires it, install dependencies and run prebuild again. To keep CocoaPods without this warning, add "ios": { "useCocoaPods": true } to the app config.'
  );
  return false;
}

/**
 * Throws when CocoaPods is installed in the iOS project and it has no Swift Package Manager marker,
 * so prebuild never converts an installed CocoaPods project without `--clean`. A Podfile alone, as
 * in a fresh template, is converted: `create-expo` relies on that.
 */
export function assertNoCocoaPodsProject(projectRoot: string): void {
  const iosDir = path.join(projectRoot, 'ios');
  const hasCocoaPodsInstalled =
    fs.existsSync(path.join(iosDir, 'Podfile.lock')) || fs.existsSync(path.join(iosDir, 'Pods'));
  if (hasCocoaPodsInstalled && !getSwiftPMMarkerPath(projectRoot)) {
    throw new CommandError(
      'SWIFTPM_DEFAULT_COCOAPODS_PROJECT',
      'Prebuild stopped because CocoaPods is installed in the iOS project (ios/Podfile.lock or ios/Pods exists), and prebuild sets up iOS with Swift Package Manager unless the app config sets ios.useCocoaPods. Prebuild does not convert an installed CocoaPods project in place. To switch to Swift Package Manager, run `npx expo prebuild --clean` to regenerate the iOS project. To keep CocoaPods, add "ios": { "useCocoaPods": true } to the app config.'
    );
  }
}

/**
 * Throws when the iOS project uses Swift Package Manager although the app config opts into
 * CocoaPods, so CocoaPods never runs against a Swift Package Manager project.
 */
export function assertNoSwiftPMMarker(projectRoot: string): void {
  const marker = getSwiftPMMarkerPath(projectRoot);
  if (marker) {
    throw new CommandError(
      'COCOAPODS_CONFIG_SWIFTPM_PROJECT',
      `The iOS project uses Swift Package Manager (${path.relative(projectRoot, marker)} exists), but the app config sets "ios": { "useCocoaPods": true }. To keep Swift Package Manager, remove ios.useCocoaPods from the app config. To switch to CocoaPods, run \`npx expo prebuild --clean\` to regenerate the iOS project.`
    );
  }
}

/**
 * Sets up the iOS project with Swift Package Manager instead of CocoaPods, or updates an existing
 * setup, with React Native's `setup-apple-spm.js`. Prints the command instead when it cannot run here.
 */
export async function setupSwiftPMAsync(
  projectRoot: string,
  { install }: { install: boolean }
): Promise<void> {
  const script = resolveSetupAppleSpmScript(projectRoot);
  const args = [
    ...(getSwiftPMMarkerPath(projectRoot) ? ['update'] : ['add', '--deintegrate']),
    '--yes',
    '--config-command',
    AUTOLINKING_CONFIG_COMMAND,
  ];
  const retryCommand = formatShellCommand([
    'node',
    script
      ? path.relative(projectRoot, script).split(path.sep).join('/')
      : 'node_modules/react-native/scripts/setup-apple-spm.js',
    ...args,
  ]);

  if (!install || process.platform !== 'darwin') {
    Log.log(
      install
        ? 'Skipped setting up Swift Package Manager for iOS because it requires macOS. On a Mac, run this command in the project directory:'
        : chalk`Skipped setting up Swift Package Manager for iOS because of {bold --no-install}. To finish, run this command in the project directory:`
    );
    Log.log(chalk.bold(`  ${retryCommand}`));
    return;
  }

  if (!script) {
    throw new CommandError(
      'SWIFTPM_UNSUPPORTED',
      `Could not set up Swift Package Manager for iOS because this project's React Native version does not include react-native/scripts/setup-apple-spm.js. Swift Package Manager requires React Native 0.88 or later. Upgrade react-native, or add "ios": { "useCocoaPods": true } to the app config and run \`npx expo prebuild --clean\` to use CocoaPods.`
    );
  }

  const step = logNewSection('Setting up Swift Package Manager for iOS');
  try {
    await spawnAsync(process.execPath, [script, ...args], {
      cwd: projectRoot,
      stdio: env.EXPO_DEBUG ? 'inherit' : 'pipe',
    });
  } catch (error) {
    step.fail('Failed to set up Swift Package Manager for iOS');
    const { stderr, stdout } = error as Partial<SpawnResult>;
    const output = (stderr || stdout || (error as Error).message).trim();
    throw new CommandError(
      'SWIFTPM_SETUP_FAILED',
      [
        `Could not set up Swift Package Manager for iOS because React Native's setup-apple-spm.js failed:`,
        output,
        '',
        `Fix the error above, then run this command in the project directory to finish the setup:`,
        `  ${retryCommand}`,
      ].join('\n')
    );
  }
  step.succeed('Set up Swift Package Manager for iOS');
}

function resolveSetupAppleSpmScript(projectRoot: string): string | null {
  try {
    const reactNativePackageJson = Module.createRequire(
      path.join(projectRoot, 'package.json')
    ).resolve('react-native/package.json');
    const script = path.join(path.dirname(reactNativePackageJson), 'scripts', 'setup-apple-spm.js');
    return fs.existsSync(script) ? script : null;
  } catch {
    return null;
  }
}

function formatShellCommand(argv: string[]): string {
  return argv
    .map((arg) => (/^[\w@%+=:,./-]+$/.test(arg) ? arg : `'${arg.replace(/'/g, `'\\''`)}'`))
    .join(' ');
}
