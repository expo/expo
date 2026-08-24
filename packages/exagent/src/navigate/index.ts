import chalk from 'chalk';

import type { Command } from '../types';
import { assertWithOptionsArgs, printHelp } from '../utils/args';

export const exagentNavigate: Command = async (argv) => {
  const args = assertWithOptionsArgs(
    {
      // Types
      '--help': Boolean,
      // Aliases
      '-h': '--help',
    },
    {
      argv,
      // The remaining options are resolved by `resolveNavigateOptions`.
      permissive: true,
      command: 'navigate',
      // The options and the positional arguments are resolved together, per action,
      // by this command's own `resolve*Options`; a permissive parse cannot tell an
      // unrecognized flag from a positional argument, so it must not judge either.
      positionalArgs: 'own',
    }
  );

  if (args['--help']) {
    printHelp(
      `Open a route of the project in the app on a booted device`,
      chalk`npx exagent navigate {dim <route>}`,
      [
        `--scheme <scheme>       URL scheme of the app, instead of the one in app.json`,
        `--ios                   Open the link on the booted iOS simulator`,
        `--android               Open the link on the attached Android device`,
        `--app-id <id>           Application id of the target app`,
        `--dev-server-url <url>  Dev server to read (default: the project's own, then 8081)`,
        `--json                  Print the result as JSON`,
        `--no-route-check        Open the link without checking the route against the project`,
        `--no-followups          Skip the "Suggested next:" section of suggested follow-up commands`,
        `-h, --help              Usage info`,
      ].join('\n'),
      [
        '',
        chalk`  {dim $} npx exagent navigate /profile/42`,
        chalk`  {dim $} npx exagent navigate "/search?q=shoes" --ios`,
        chalk`  {dim $} npx exagent navigate /profile/42 --scheme myapp`,
        '',
        chalk`  The URL shape follows the app: Expo Go uses {bold exp://<host>/--/<route>}, a`,
        chalk`  development build uses {bold <scheme>://<route>}. Which app is running is read from`,
        chalk`  the dev server, so start it with {bold npx exagent dev --detach} first.`,
        '',
        chalk`  The dev server is found the way every runtime command finds it: the project's`,
        chalk`  dev-server lock, then the port in its {bold start.log}, then 8081 and the ports`,
        chalk`  {bold expo start} falls back to. This command drives a device, so the {bold Dev server}`,
        chalk`  line names the one it used — pass {bold --dev-server-url} to be exact.`,
        '',
        chalk`  The scheme is read from the {bold scheme} field of {bold app.json} or {bold app.config.json}. A`,
        chalk`  dynamic {bold app.config.js} is never evaluated, so pass {bold --scheme} for those projects.`,
        '',
        chalk`  With no platform flag, a booted iOS simulator is preferred on macOS, and an`,
        chalk`  attached Android device is used otherwise.`,
        '',
        chalk`  The route is checked against the project's routes first, so a route that does not`,
        chalk`  exist fails here instead of putting the app on the {bold Unmatched Route} screen and`,
        chalk`  reporting success. The routes are read from the files under the router directory`,
        chalk`  the way Expo Router reads them, and a dynamic route matches as a pattern:`,
        chalk`  {bold /users/42} resolves against {bold app/users/[id].tsx}. Pass {bold --no-route-check} to skip it.`,
        '',
      ].join('\n')
    );
  }

  // Load modules after the help prompt so `npx exagent navigate -h` shows as fast as possible.
  const { logCmdError } = require('../utils/errors') as typeof import('../utils/errors');
  const { findUpProjectRootOrAssert } =
    require('../utils/findUp') as typeof import('../utils/findUp');
  const { resolveNavigateOptions } =
    require('./resolveOptions') as typeof import('./resolveOptions');
  const { navigateAsync } = require('./navigateAsync') as typeof import('./navigateAsync');

  return (async () => {
    const options = resolveNavigateOptions(argv ?? []);
    const projectRoot = findUpProjectRootOrAssert(process.cwd());
    process.exitCode = await navigateAsync(projectRoot, options);
  })().catch(logCmdError);
};
