import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

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
      help: { type: 'boolean', short: 'h' },
    },
    allowPositionals: true,
  });
  if (values.help) {
    process.stdout.write(
      'Usage:\n' +
        '  npx expo-embedding init\n' +
        '  npx expo-embedding install <package...>\n\n' +
        'Options: --platform ios, --project <App.xcodeproj>, --target <App>, --frozen-lockfile (init only)\n' +
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
  if (values.platform && values.platform !== 'ios')
    throw new Error('This integration supports --platform ios.');
  const ios = await prepareIos(root, packageRoot, values);
  const isNewExpoProject = await prepareExpoProject(root, command, frozen);
  const manager = await installDependencies(root, frozen);
  if (command === 'install') await installPackages(root, manager, packages);
  try {
    await initializeIos(ios, packageRoot);
  } catch (error) {
    if (command === 'install') {
      throw new Error(
        `Dependency installation succeeded, but native setup did not finish. ${error instanceof Error ? error.message : error}\nFix the error above, then run init to retry native setup using the updated package manifest.`,
        { cause: error }
      );
    }
    throw error;
  }
  if (command === 'init' && isNewExpoProject) {
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
