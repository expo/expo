import chalk from 'chalk';

import type { Command } from '../types';
import { assertWithOptionsArgs, printHelp } from '../utils/args';

export const exagentDeploy: Command = async (argv) => {
  const args = assertWithOptionsArgs(
    {
      // Types
      '--help': Boolean,
      // Aliases
      '-h': '--help',
    },
    {
      argv,
      // The rest is resolved by `resolveDeployOptions`, which reports a bad flag as a CommandError.
      permissive: true,
      command: 'deploy',
      // The options and the positional arguments are resolved together, per action,
      // by this command's own `resolve*Options`; a permissive parse cannot tell an
      // unrecognized flag from a positional argument, so it must not judge either.
      positionalArgs: 'own',
    }
  );

  if (args['--help']) {
    printHelp(
      `Ship the project: the web app to EAS Hosting, the native app through launch.expo.dev`,
      chalk`npx exagent deploy`,
      [
        `--web                Deploy the web export to EAS Hosting`,
        `--native             Launch the native app with create-launch (launch.expo.dev)`,
        `--upload-root <dir>  Directory to upload for --native. Default: the project itself`,
        `--json               Print the result as JSON`,
        `--no-followups       Skip the "Suggested next:" section of suggested follow-up commands`,
        `-h, --help           Usage info`,
      ].join('\n'),
      [
        '',
        chalk`  With no target flag, a project that has web support deploys its web app.`,
        '',
        chalk`    {dim $} npx exagent deploy --web --json`,
        chalk`    {dim >} expo export --platform web && eas deploy --non-interactive`,
        '',
        chalk`  {bold --native} runs {bold create-launch} in a subprocess, which uploads your project source as`,
        chalk`  the signed in Expo user and answers with a launch URL. Opening that URL is a`,
        chalk`  required step: the store account, the signing and the submission for iOS and`,
        chalk`  Android happen in the browser.`,
        '',
        chalk`    {dim $} npx exagent deploy --native`,
        chalk`    {dim >} create-launch --json`,
        '',
        chalk`    {dim $} npx exagent deploy --native --upload-root ../..    {dim # an app in a monorepo}`,
        chalk`    {dim >} create-launch --json --project my-app          {dim # run from ../..}`,
        '',
        chalk`  Sign in once with {bold npx expo login}, or set {bold EXPO_TOKEN} on a machine that cannot.`,
        '',
      ].join('\n')
    );
  }

  // Load modules after the help prompt so `npx exagent deploy -h` shows as fast as possible.
  const { logCmdError } = require('../utils/errors') as typeof import('../utils/errors');
  const { findUpProjectRootOrAssert } =
    require('../utils/findUp') as typeof import('../utils/findUp');
  const { resolveDeployOptions } = require('./resolveOptions') as typeof import('./resolveOptions');
  const { deployAsync } = require('./deployAsync') as typeof import('./deployAsync');

  return (async () => {
    const options = resolveDeployOptions(argv ?? []);
    await deployAsync(findUpProjectRootOrAssert(process.cwd()), options);
  })().catch(logCmdError);
};
