#!/usr/bin/env node
import chalk from 'chalk';

import type { Command } from '../index';
import { assertArgs, getProjectRoot, printHelp } from '../utils/args';
import { logCmdError } from '../utils/errors';

export const expoStart: Command = async (argv) => {
  const args = assertArgs(
    {
      // Types
      '--help': Boolean,
      '--clear': Boolean,
      '--max-workers': Number,
      '--no-dev': Boolean,
      '--minify': Boolean,
      '--https': Boolean,
      '--private-key-path': String,
      '--port': Number,
      '--dev-client': Boolean,
      '--scheme': String,
      '--android': Boolean,
      '--ios': Boolean,
      '--web': Boolean,
      '--host': String,
      '--tunnel': String,
      '--lan': Boolean,
      '--localhost': Boolean,
      '--offline': Boolean,
      '--go': Boolean,
      // Aliases
      '-h': '--help',
      '-c': '--clear',
      '-p': '--port',
      '-a': '--android',
      '-i': '--ios',
      '-w': '--web',
      '-m': '--host',
      '-d': '--dev-client',
      '-g': '--go',
      // Alias for adding interop with the Metro docs and RedBox errors.
      '--reset-cache': '--clear',
    },
    normalizeTunnelArgs(argv)
  );

  if (args['--help']) {
    printHelp(
      `Start a local dev server for the app`,
      chalk`npx expo start {dim <dir>}`,
      [
        chalk`<dir>                           Directory of the Expo project. {dim Default: Current working directory}`,
        `-a, --android                   Open on a connected Android device`,
        `-i, --ios                       Open in an iOS simulator`,
        `-w, --web                       Open in a web browser`,
        ``,
        chalk`-d, --dev-client                Launch in a custom native app`,
        chalk`-g, --go                        Launch in Expo Go`,
        ``,
        `-c, --clear                     Clear the bundler cache`,
        `--max-workers <number>          Maximum number of tasks to allow Metro to spawn`,
        `--no-dev                        Bundle in production mode`,
        `--minify                        Minify JavaScript`,
        ``,
        chalk`-m, --host <string>             Dev server hosting type. {dim Default: lan}`,
        chalk`                                {bold lan}: Use the local network`,
        chalk`                                {bold tunnel}: Use any network through an Expo tunnel`,
        chalk`                                {bold localhost}: Connect to the dev server over localhost`,
        `--tunnel [provider]             Use a tunnel. Default: expo (Legacy option: ngrok)`,
        `--lan                           Same as --host lan`,
        `--localhost                     Same as --host localhost`,
        ``,
        `--offline                       Skip network requests and use anonymous manifest signatures`,
        chalk`--https                         Start the dev server with https protocol. {bold Deprecated in favor of --tunnel}`,
        `--scheme <scheme>               Custom URI protocol to use when launching an app`,
        chalk`-p, --port <number>             Port to start the dev server on (does not apply to web). {dim Default: 8081}`,
        ``,
        chalk`--private-key-path <path>       Path to private key for code signing. {dim Required to sign development manifests when the project is configured with an expo-updates code signing certificate.}`,
        `-h, --help                      Usage info`,
      ].join('\n'),
      [
        '',
        chalk`  {bold AGENTS:}`,
        '',
        chalk`  Setting {bold CI=1} turns off file watching and Fast Refresh, so code changes won't reach`,
        chalk`  the app until the dev server restarts. Don't set it for local development.`,
        '',
        chalk`  Inspect structured events from running or stopped {bold expo start} processes:`,
        chalk`    {dim $} npx expo command:ps "start" --json`,
        chalk`    {dim $} npx expo command:events <session-id>`,
        chalk`  Add {bold --tail} to follow live events. See the command overview for usage and examples:`,
        chalk`    {dim $} npx expo command --help`,
        '',
      ].join('\n')
    );
  }

  const projectRoot = getProjectRoot(args);

  // NOTE(cedric): `./resolveOptions` loads the expo config when using dev clients, this needs to be initialized before that
  const { loadEnvFiles } = await import('../utils/nodeEnv.js');
  loadEnvFiles(projectRoot, {
    mode: !args['--no-dev'] ? 'development' : 'production',
  });

  const { resolveOptionsAsync } = await import('./resolveOptions.js');
  const options = await resolveOptionsAsync(projectRoot, args).catch(logCmdError);

  if (options.offline) {
    const { disableNetwork } = await import('../api/settings.js');
    disableNetwork();
  }

  const { startAsync } = await import('./startAsync.js');
  return startAsync(projectRoot, options, { webOnly: false }).catch(logCmdError);
};

/** Preserve the optional project directory when --tunnel is used without a provider. */
function normalizeTunnelArgs(argv: string[] = process.argv.slice(2)): string[] {
  const normalized: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--') {
      normalized.push(...argv.slice(i));
      break;
    }
    if (argv[i] === '--tunnel') {
      const provider = argv[i + 1];
      if (provider === 'ngrok' || provider === 'expo') {
        normalized.push(`--tunnel=${provider}`);
        i++;
      } else {
        normalized.push('--tunnel=expo');
      }
    } else {
      normalized.push(argv[i]!);
    }
  }
  return normalized;
}
