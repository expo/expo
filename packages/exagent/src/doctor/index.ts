import chalk from 'chalk';

import type { Command } from '../types';
import { assertWithOptionsArgs, printHelp } from '../utils/args';

export const exagentDoctorCheck: Command = async (argv) => {
  const args = assertWithOptionsArgs(
    {
      // Types
      '--help': Boolean,
      '--json': Boolean,
      '--no-followups': Boolean,
      // Aliases
      '-h': '--help',
    },
    { argv }
  );

  if (args['--help']) {
    printHelp(
      `Diagnose this project by running expo-doctor, and normalize its report`,
      chalk`npx exagent doctor:check {dim [options]}`,
      [
        `--json            Print the whole report as JSON, expo-doctor's full text included`,
        `--no-followups    Leave the suggested follow-up commands out of the report`,
        `-h, --help        Usage info`,
      ].join('\n'),
      [
        '',
        chalk`  Read-only. It runs {bold expo-doctor --verbose} as a subprocess — the project's own copy`,
        chalk`  first, then {bold npx expo-doctor} — and reports the checks that failed with the advice`,
        chalk`  each of them gave. The exit code is expo-doctor's own: {bold 1} when any check failed.`,
        '',
        chalk`  expo-doctor has no {bold --json}, so the report is read back out of its prose and says how`,
        chalk`  well that went. {bold --json} carries a {bold parse} field ({bold full}, {bold best-effort} or {bold failed}) and`,
        chalk`  a {bold raw} field with everything expo-doctor printed, so nothing the parse missed is lost.`,
        '',
        chalk`  {bold npx exagent doctor} runs this command.`,
        '',
      ].join('\n')
    );
  }

  // Load modules after the help prompt so `npx exagent doctor:check -h` shows as fast as possible.
  const { logCmdError } = require('../utils/errors') as typeof import('../utils/errors');
  const { exitWithCodeAsync } = require('../exitCodes') as typeof import('../exitCodes');
  const { findUpProjectRootOrAssert } =
    require('../utils/findUp') as typeof import('../utils/findUp');
  const { printDoctorCheckAsync } = require('./doctorAsync') as typeof import('./doctorAsync');

  return (async () => {
    const projectRoot = findUpProjectRootOrAssert(process.cwd());
    const exitCode = await printDoctorCheckAsync(projectRoot, {
      json: !!args['--json'],
      followups: !args['--no-followups'],
    });
    if (exitCode !== 0) {
      await exitWithCodeAsync(exitCode);
    }
  })().catch(logCmdError);
};
