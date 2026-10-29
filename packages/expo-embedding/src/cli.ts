import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { prepareIos, initializeIos } from './ios';
import { findAppRoot } from './scaffold';
import { prepareExpoProject, installDependencies, installPackages } from './setup';
import { printSkill } from './skill';
import { usage } from './usage';

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    options: {
      'frozen-lockfile': { type: 'boolean' },
      project: { type: 'string' },
      target: { type: 'string' },
      platform: { type: 'string' },
      json: { type: 'boolean' },
      help: { type: 'boolean', short: 'h' },
    },
    allowPositionals: true,
  });
  if (values.help) {
    process.stdout.write(usage);
    return;
  }
  const [command, ...packages] = positionals;
  if (
    (command !== 'init' && command !== 'install' && command !== 'skill') ||
    (command !== 'install' && packages.length !== 0) ||
    (command === 'install' && packages.length === 0)
  ) {
    throw new Error(
      'Expected init, install <package...>, or skill. Run npx expo-embedding --help for usage.'
    );
  }
  if (values.json && command !== 'skill')
    throw new Error('--json is only supported by npx expo-embedding skill.');
  if (command === 'skill' && values['frozen-lockfile'])
    throw new Error(
      'skill only accepts --json and host selection options. Run npx expo-embedding --help for usage.'
    );
  const frozen = values['frozen-lockfile'] ?? false;
  if (command === 'install' && frozen) {
    throw new Error(
      'install changes dependencies and cannot use --frozen-lockfile. Use npx expo-embedding init --frozen-lockfile to reproduce a committed dependency tree.'
    );
  }

  const root = await findAppRoot(process.cwd());
  const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  if (values.platform && values.platform !== 'ios')
    throw new Error('This integration supports --platform ios.');
  const ios = await prepareIos(root, packageRoot, values);
  if (command === 'skill') {
    await printSkill(packageRoot, values.json ?? false, {
      root,
      platform: 'ios',
      selection: {
        project: ios.project,
        target: ios.target,
      },
      changes: [],
      preview:
        'SwiftUI source wiring is described below. Generated Xcode changes require running npx expo-embedding init with installed dependencies; no generated diff is available in this read-only report.',
    });
    return;
  }
  const isNewExpoProject = await prepareExpoProject(root, command, frozen);
  const manager = await installDependencies(root, frozen);
  if (command === 'install') await installPackages(root, manager, packages);
  try {
    await initializeIos(ios, packageRoot);
  } catch (error) {
    if (command === 'install') {
      throw new Error(
        `Dependency installation succeeded, but native setup did not finish. ${error instanceof Error ? error.message : error}\nFix the error above, then run npx expo-embedding init to retry native setup using the updated package manifest.`,
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
