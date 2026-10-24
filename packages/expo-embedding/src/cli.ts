import { readdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { prepareAndroidWorkspace } from './android';
import { prepareAndroid, hoistAndroidDependencies, initializeAndroid } from './android-setup';
import { exists } from './files';
import { prepareIos, initializeIos } from './ios';
import { findAppRoot } from './scaffold';
import { prepareExpoProject, installDependencies, installPackages } from './setup';

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    options: {
      'frozen-lockfile': { type: 'boolean' },
      project: { type: 'string' },
      target: { type: 'string' },
      platform: { type: 'string' },
      'migrate-activity': { type: 'string' },
      'configure-host': { type: 'boolean' },
      help: { type: 'boolean', short: 'h' },
    },
    allowPositionals: true,
  });
  if (values.help) {
    process.stdout.write(
      'Usage:\n' +
        '  npx expo-embedding init\n' +
        '  npx expo-embedding install <package...>\n\n' +
        'Options: --platform ios|android, --project <App.xcodeproj>, --target <App>, --frozen-lockfile (init only)\n' +
        '         --migrate-activity=appcompat (Android: authorize Activity/theme edits without prompting)\n' +
        '         --configure-host (Android: also create/register or wire the Application)\n' +
        'CI=1 disables prompts but does not authorize host edits.\n' +
        'init creates expo/ with a Main scene when no Expo app exists.\n' +
        'Successful setup remembers the project and target.\n'
    );
    return;
  }
  const [command, ...packages] = positionals;
  if (
    (command !== 'init' && command !== 'install') ||
    (command === 'init' && packages.length !== 0) ||
    (command === 'install' && packages.length === 0)
  ) {
    throw new Error('Expected init or install <package...>. Run with --help for usage.');
  }
  const frozen = values['frozen-lockfile'] ?? false;
  if (command === 'install' && frozen) {
    throw new Error(
      'install changes dependencies and cannot use --frozen-lockfile. Use init --frozen-lockfile to reproduce a committed dependency tree.'
    );
  }

  const root = await findAppRoot(process.cwd());
  const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const hasIos = (await readdir(root)).some((name) => name.endsWith('.xcodeproj'));
  const hasAndroid =
    (await exists(join(root, 'settings.gradle.kts'))) ||
    (await exists(join(root, 'settings.gradle')));
  const platform =
    values.platform ?? (hasAndroid && !hasIos ? 'android' : !hasAndroid ? 'ios' : undefined);
  if (platform !== 'ios' && platform !== 'android')
    throw new Error('Select a native platform with --platform ios or --platform android.');
  if (
    values['migrate-activity'] !== undefined &&
    (platform !== 'android' || values['migrate-activity'] !== 'appcompat')
  )
    throw new Error('Use --migrate-activity=appcompat only with Android setup.');
  if (values['configure-host'] && platform !== 'android')
    throw new Error('Use --configure-host only with Android setup.');

  const ios = platform === 'ios' ? await prepareIos(root, packageRoot, values) : undefined;
  const hostChanges = platform === 'android' ? await prepareAndroid(root, values) : [];
  const isNewExpoProject = await prepareExpoProject(root, command, frozen, platform);
  if (platform === 'android') await prepareAndroidWorkspace(root, frozen);
  const manager = await installDependencies(
    root,
    frozen,
    platform === 'android' ? root : undefined
  );
  if (platform === 'android') await hoistAndroidDependencies(root, frozen);
  if (command === 'install') await installPackages(root, manager, packages);
  try {
    if (ios) await initializeIos(ios, packageRoot);
    else await initializeAndroid(root, packageRoot, hostChanges);
  } catch (error) {
    if (command === 'install') {
      throw new Error(
        `Dependency installation succeeded, but native setup did not finish. ${error instanceof Error ? error.message : error}\nFix the error above, then run init to retry native setup using the updated package manifest.`,
        { cause: error }
      );
    }
    throw error;
  }
  if (ios && command === 'init' && isNewExpoProject) {
    process.stdout.write(
      'SwiftUI: import expoappbrownfield, own an ExpoHost, forward the app delegate with ExpoBrownfieldAppDelegate,\n' +
        'attach .expoHost(host) to your root view, and display ExpoScene(name: "Main").frame(height: 240).\n'
    );
  }
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
