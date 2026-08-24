import chalk from 'chalk';

import type { Command } from '../types';
import {
  assertWithOptionsArgs,
  DURATION_HELP_NOTE,
  DURATION_METAVAR,
  printHelp,
} from '../utils/args';

export const exagentDevWait: Command = async (argv) => {
  const args = assertWithOptionsArgs(
    {
      // Types
      '--help': Boolean,
      // Aliases
      '-h': '--help',
    },
    {
      argv,
      // The remaining options are resolved by `resolveDevWaitOptions`, which owns their errors.
      permissive: true,
    }
  );

  if (args['--help']) {
    printHelp(
      `Wait until the dev server has finished bundling, and say whose bundle it is`,
      chalk`npx exagent dev:wait {dim [options]}`,
      [
        `--timeout ${DURATION_METAVAR}   How long to wait in total (default: 2m)`,
        `--require-app           Also wait for an app to attach to the dev server`,
        `--dev-server-url <url>  Dev server to wait on (default: the project's own, then 8081)`,
        `--json                  Print the result as JSON`,
        `--no-followups          Skip the "Suggested next:" section of suggested follow-up commands`,
        `-h, --help              Usage info`,
      ].join('\n'),
      [
        '',
        chalk`  {dim $} npx exagent dev:wait`,
        chalk`  {dim $} npx exagent dev:wait --require-app --timeout 60s --json`,
        '',
        `  ${DURATION_HELP_NOTE}`,
        '',
        chalk`  The dev server answers {bold GET /status} only once its bundler has finished, so this`,
        chalk`  command holds one request open rather than polling. It is the gate to put before`,
        chalk`  anything that reads the running app: {bold runtime:eval}, {bold runtime:errors} and`,
        chalk`  {bold navigate} all need a bundle that exists.`,
        '',
        chalk`  The dev server also names the project it serves, so this reports whether the server`,
        chalk`  that answered is {bold this} project's — the one thing a port scan cannot prove. Pass`,
        chalk`  {bold --dev-server-url} when two projects are running at once.`,
        '',
        chalk`  Exit codes: {bold 0} ready · {bold 22} the wait expired, so try a longer {bold --timeout} ·`,
        chalk`  {bold 20} something answered that is not an Expo dev server · {bold 1} no dev server at all.`,
        '',
      ].join('\n')
    );
  }

  // Load modules after the help prompt so `npx exagent dev:wait -h` shows as fast as possible.
  const { logCmdError } = require('../utils/errors') as typeof import('../utils/errors');
  const { findUpProjectRootOrCwd } = require('../utils/findUp') as typeof import('../utils/findUp');
  const { EXIT_OK, exitWithCodeAsync } = require('../exitCodes') as typeof import('../exitCodes');
  const { resolveDevWaitOptions } =
    require('./resolveWaitOptions') as typeof import('./resolveWaitOptions');

  return (async () => {
    const options = resolveDevWaitOptions(argv ?? []);
    // The non-asserting lookup: with `--dev-server-url` this command works against any dev server,
    // so being outside a project is not an error — it only means there is no lock to ask and no
    // project root to compare the dev server's own against.
    const projectRoot = findUpProjectRootOrCwd(process.cwd());

    const { devWaitAsync } = require('./waitAsync') as typeof import('./waitAsync');
    const code = await devWaitAsync(projectRoot, options);
    if (code !== EXIT_OK) {
      // An outcome, not an error: it has already printed everything it has to say, and the code is
      // what the caller branches on (llp/0010 §Exit codes).
      await exitWithCodeAsync(code);
    }
  })().catch(logCmdError);
};
