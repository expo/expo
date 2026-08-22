import { Command } from 'commander';
import path from 'path';

import { normalizeDirectory, resolveExamplesAsync, runInit } from './init.js';

type InitCommandOptions = {
  dir?: string;
  directory?: string;
  examples?: string[];
  visualIntelligence?: boolean;
};

const TEMPLATES_DIRECTORY_NAME = 'templates';

/**
 * Matches create-expo-module's interactive mode detection.
 * Non-interactive when CI is set, EXPO_NONINTERACTIVE is set, or stdin is not a TTY.
 */
export function isInteractive(): boolean {
  const ci = process.env.CI;
  if (ci === '1' || ci?.toLowerCase() === 'true') {
    return false;
  }
  if (process.env.EXPO_NONINTERACTIVE) {
    return false;
  }
  if (!process.stdin.isTTY) {
    return false;
  }
  return true;
}

/** Printed before the examples are picked, since it says what picking one gets you. */
function printScaffoldIntro(directory: string): void {
  console.log(
    `App Intents are declared in Swift, compiled into your app target. expo-app-intents\n` +
      `scaffolds example Swift into ${directory}/ and hands invocations to JavaScript.\n`
  );
}

async function runInitCommand(options: InitCommandOptions): Promise<void> {
  const interactive = isInteractive();
  const directory = normalizeDirectory(options.directory ?? options.dir);
  printScaffoldIntro(directory);
  const { examples, visualIntelligence } = await resolveExamplesAsync(
    interactive,
    options.examples,
    options.visualIntelligence ?? false
  );

  await runInit({
    projectRoot: process.cwd(),
    directory,
    examples,
    visualIntelligence,
    templatesDir:
      process.env.EXPO_APP_INTENTS_TEMPLATES_DIR ??
      path.join(__dirname, '..', '..', TEMPLATES_DIRECTORY_NAME),
  });
}

const program = new Command();

program.name('expo-app-intents').description('Add Apple App Intents support to Expo apps.');

program
  .command('init')
  .description('Add Expo App Intents inline-module Swift files to the current Expo app.')
  .option('-d, --dir <directory>', 'Directory for the generated App Intents inline module.')
  .option('--directory <directory>', 'Alias for --dir.')
  .option(
    '--examples <examples...>',
    'Example native code to scaffold. Use "all", or choose any of: minimal, counter, ' +
      'restaurant, mail.'
  )
  .option(
    '--visual-intelligence',
    'Extend the mail example with Spotlight indexing, a Transferable export, and an open intent.'
  )
  .action(runInitCommand);

program.parseAsync(process.argv).catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
