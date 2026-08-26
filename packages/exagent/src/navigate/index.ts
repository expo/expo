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
        `--cloud                 Open the link on this project's EAS Simulator session`,
        `--app-id <id>           Application id of the target app`,
        `--dev-server-url <url>  Dev server to read (default: the project's own, then 8081)`,
        `--print-url             Print the URL and open nothing; needs no device`,
        `--attach-timeout <dur>  How long to wait for the app to connect (default: 45s)`,
        `--no-wait-attach        Report what the device tool said, without waiting for the app`,
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
        chalk`  {dim $} npx exagent navigate / --print-url`,
        '',
        chalk`  {bold --print-url} resolves everything and opens nothing: the route check, the URL`,
        chalk`  shape, the Expo Go or development build decision, and the tunnel host when the dev`,
        chalk`  server has one. Use it when the device is not one this machine can drive — a cloud`,
        chalk`  simulator, a phone, somebody else's laptop — and hand the URL to whatever opens it.`,
        '',
        chalk`  A tunnelled dev server changes the host in that URL: {bold exp://<tunnel-host>} rather`,
        chalk`  than {bold exp://<lan-ip>:<port>}, which nothing off this network can load. The host is`,
        chalk`  read from what the dev server printed into its detached log, so it is known for a`,
        chalk`  {bold npx exagent dev --detach --tunnel} run and unknown for one started in a terminal.`,
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
        chalk`  {bold There is a third device: an EAS Simulator session}, which runs on Expo's cloud`,
        chalk`  rather than on this machine. It is used when there is no local device and this`,
        chalk`  project has a session running, and {bold --cloud} names it outright. A session is started`,
        chalk`  and stopped by the EAS CLI — {bold npx eas simulator:start --platform ios --type}`,
        chalk`  {bold agent-device} — and it bills until {bold npx eas simulator:stop}. It needs a signed-in`,
        chalk`  account; without one this command exits {bold 7} and says who has to sign in.`,
        '',
        chalk`  A cloud simulator {bold needs a tunnelled dev server}: {bold exp://127.0.0.1:<port>} names the`,
        chalk`  loopback of the machine that opens it, which there is a machine in a datacenter. A run`,
        chalk`  with a LAN or localhost URL is refused rather than opened onto an error screen.`,
        chalk`  The {bold Device} line and {bold deviceBackend} in {bold --json} say which of the three acted.`,
        '',
        chalk`  {bold On Android the dev server's port is forwarded onto the device first}, with`,
        chalk`  {bold adb reverse}. {bold exp://127.0.0.1:<port>} names the {bold device's} own loopback, so`,
        chalk`  without it an emulator loads the link against a port nothing listens on.`,
        '',
        chalk`  {bold The app is then waited for.} The device tool exits 0 for a link it merely accepted,`,
        chalk`  so this command waits for the app to register a debugger target on this platform`,
        chalk`  and exits {bold 22} when none does — an app stuck on an error screen is not a success.`,
        chalk`  On Android a stuck app is stopped and the link opened once more before that.`,
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
