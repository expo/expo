import type { ExpoConfig } from '@expo/config';
import { IOSConfig } from '@expo/config-plugins';
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

const CONFIGURE_PROJECT_PHASE_NAME = '[Expo] Configure project';
const PODS_MODULES_PROVIDER_PATH =
  /^Pods\/Target Support Files\/[^/]+\/ExpoModulesProvider\.swift$/;

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

/** Returns whether the app config opts iOS into Swift Package Manager (preview). */
export function isSwiftPMEnabled(exp: ExpoConfig): boolean {
  // `experiments.swiftPackageManager` is not in the generated ExpoConfig schema yet.
  const experiments: (ExpoConfig['experiments'] & { swiftPackageManager?: unknown }) | undefined =
    exp.experiments;
  return experiments?.swiftPackageManager === true;
}

/**
 * Throws when the iOS project uses Swift Package Manager although the app config does not enable
 * it, so CocoaPods never runs against a Swift Package Manager project.
 */
export function assertNoSwiftPMMarker(projectRoot: string): void {
  const marker = getSwiftPMMarkerPath(projectRoot);
  if (marker) {
    throw new CommandError(
      'SWIFTPM_NOT_ENABLED',
      `The iOS project uses Swift Package Manager (${path.relative(projectRoot, marker)} exists), but experiments.swiftPackageManager is not enabled in the app config. To keep Swift Package Manager, add "experiments": { "swiftPackageManager": true } to the app config. To switch back to CocoaPods, run \`npx expo prebuild --clean\` to regenerate the iOS project.`
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
      `Could not set up Swift Package Manager for iOS because this project's React Native version does not include react-native/scripts/setup-apple-spm.js. Swift Package Manager requires React Native 0.88 or later. Upgrade react-native, or remove experiments.swiftPackageManager from the app config and run \`npx expo prebuild --clean\` to use CocoaPods.`
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
  removeExpoCocoaPodsIntegration(projectRoot);
  step.succeed('Set up Swift Package Manager for iOS');
}

/**
 * Removes what Expo's CocoaPods integration added to the Xcode project and points into `Pods/`:
 * the `[Expo] Configure project` build phase and the `ExpoModulesProvider.swift` source file.
 * React Native's `setup-apple-spm.js` deletes `Pods/` but does not know about these items.
 */
function removeExpoCocoaPodsIntegration(projectRoot: string): void {
  const project = IOSConfig.XcodeUtils.getPbxproj(projectRoot);
  const objects: Record<string, Record<string, any>> = project.hash.project.objects;
  const unquote = (value: unknown) => String(value).replace(/^"(.*)"$/, '$1');
  // Sections pair each uuid with a `<uuid>_comment` string, which is not an object.
  const entriesOf = (section: Record<string, any> = {}): [string, any][] =>
    Object.entries(section).filter(([uuid]) => !uuid.endsWith('_comment'));
  const remove = (section: Record<string, any>, uuid: string) => {
    delete section[uuid];
    delete section[`${uuid}_comment`];
  };
  let changed = false;

  for (const [uuid, phase] of entriesOf(objects.PBXShellScriptBuildPhase)) {
    if (unquote(phase.name) !== CONFIGURE_PROJECT_PHASE_NAME) {
      continue;
    }
    remove(objects.PBXShellScriptBuildPhase!, uuid);
    for (const [, target] of entriesOf(objects.PBXNativeTarget)) {
      target.buildPhases = target.buildPhases?.filter((ref: any) => ref.value !== uuid);
    }
    changed = true;
  }

  for (const [fileUuid, fileReference] of entriesOf(objects.PBXFileReference)) {
    if (!PODS_MODULES_PROVIDER_PATH.test(unquote(fileReference.path))) {
      continue;
    }
    remove(objects.PBXFileReference!, fileUuid);
    for (const [buildFileUuid, buildFile] of entriesOf(objects.PBXBuildFile)) {
      if (buildFile.fileRef !== fileUuid) {
        continue;
      }
      remove(objects.PBXBuildFile!, buildFileUuid);
      for (const [, phase] of entriesOf(objects.PBXSourcesBuildPhase)) {
        phase.files = phase.files?.filter((ref: any) => ref.value !== buildFileUuid);
      }
    }
    for (const [, group] of entriesOf(objects.PBXGroup)) {
      group.children = group.children?.filter((ref: any) => ref.value !== fileUuid);
    }
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(project.filepath, project.writeSync());
  }
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
