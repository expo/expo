import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { readJSON } from './files';
import { printIntegrationInstructions } from './integration';
import { prepareIos, initializeIos } from './ios';
import { findAppRoot } from './scaffold';
import { prepareExpoProject, installDependencies, installPackages } from './setup';
import { usage } from './usage';

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    options: {
      'frozen-lockfile': { type: 'boolean' },
      project: { type: 'string' },
      target: { type: 'string' },
      platform: { type: 'string' },
      help: { type: 'boolean', short: 'h' },
      version: { type: 'boolean', short: 'v' },
    },
    allowPositionals: true,
  });
  const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  if (values.version) {
    const { version } = await readJSON(join(packageRoot, 'package.json'));
    process.stdout.write(`${version}\n`);
    return;
  }
  if (values.help) {
    process.stdout.write(usage);
    return;
  }
  const [command, ...packages] = positionals;
  if (
    (command !== 'init' && command !== 'install') ||
    (command !== 'install' && packages.length !== 0) ||
    (command === 'install' && packages.length === 0)
  ) {
    throw new Error(
      'Expected init or install <package...>. Run npx expo-embedding --help for usage.'
    );
  }
  const frozen = values['frozen-lockfile'] ?? false;
  if (command === 'install' && frozen) {
    throw new Error(
      'install changes dependencies and cannot use --frozen-lockfile. Use npx expo-embedding init --frozen-lockfile to reproduce a committed dependency tree.'
    );
  }

  const root = await findAppRoot(process.cwd());
  if (values.platform && values.platform !== 'ios')
    throw new Error('This integration supports --platform ios.');
  const ios = await prepareIos(root, packageRoot, values);
  await prepareExpoProject(root, command, frozen);
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
  if (command === 'init') {
    await printIntegrationInstructions(packageRoot, {
      root,
      platform: 'ios',
      selection: { project: ios.project, target: ios.target },
    });
  }
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
