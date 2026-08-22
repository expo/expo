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
    }
  );

  if (args['--help']) {
    printHelp(
      `Ship the project: the web app to EAS Hosting, the native app through EAS Build`,
      chalk`npx exagent deploy`,
      [
        `--web                  Deploy the web export to EAS Hosting`,
        `--native               Build the native app (needs --platform)`,
        `--platform <platform>  Native platform to build: ios or android`,
        `--profile <profile>    eas.json build profile for the native build. Default: production`,
        `--json                 Print the result as JSON`,
        `--no-followups         Skip the "Next:" section of suggested follow-up commands`,
        `-h, --help             Usage info`,
      ].join('\n'),
      [
        '',
        chalk`  With no target flag, a project that has web support deploys its web app.`,
        '',
        chalk`    {dim $} npx exagent deploy --web --json`,
        chalk`    {dim >} expo export --platform web && eas deploy --non-interactive`,
        '',
        chalk`    {dim $} npx exagent deploy --platform ios --profile preview`,
        chalk`    {dim >} eas build --platform ios --profile preview --non-interactive`,
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
