// Deferred from v1 (2026-08-26) — kept as reference, imported by nothing; see llp/0017 §doctor:fix
//
import chalk from 'chalk';

import { PROGRAM_NAME, PROGRAM_PREFIX } from '../../programName';
import type { Command } from '../../types';
import { assertWithOptionsArgs, printHelp } from '../../utils/args';

export const agentCliDoctorFix: Command = async (argv) => {
  const args = assertWithOptionsArgs(
    {
      // Types
      '--tier': String,
      '--apply': Boolean,
      '--platform': String,
      '--allow-machine-wide': Boolean,
      '--yes': Boolean,
      '--no-checkpoint': Boolean,
      '--help': Boolean,
      '--json': Boolean,
      '--no-followups': Boolean,
      // Aliases
      '-h': '--help',
      '-y': '--yes',
    },
    {
      argv,
      command: 'doctor:fix',
      // @ref llp/0010-agent-conventions.rfc.md §Registry rules. This command deletes
      // things, so an argument it silently dropped would be the worst place in the CLI for one.
      positionalArgs: 'none',
      strayHint: 'pass --tier <safe|moderate|aggressive> to choose how much is reset.',
    }
  );

  if (args['--help']) {
    printHelp(
      `Reset this project's caches and build state. Dry run by default`,
      chalk`${PROGRAM_PREFIX} doctor:fix {dim [options]}`,
      [
        `--tier <name>          safe, moderate or aggressive. Tiers are cumulative. Default: safe`,
        `--apply                Actually do it. Without this, nothing is touched.`,
        `--platform <name>      ios, android or all. Default: the platforms with native dirs`,
        `--allow-machine-wide   Include the steps that affect every project on this machine`,
        `-y, --yes              Consent up front to a reset that would otherwise stop`,
        `--no-checkpoint        Do not snapshot the tracked files before applying`,
        `--json                 Print the plan and the results as one JSON object`,
        `--no-followups         Leave the suggested follow-up commands out of the report`,
        `-h, --help             Usage info`,
      ].join('\n'),
      [
        '',
        chalk`  {bold The dry run is the default.} {bold ${PROGRAM_NAME} dev} executes what it plans; this does not,`,
        chalk`  because {bold dev} adds things and this deletes them. Read the plan, then pass {bold --apply}.`,
        '',
        chalk`  {bold safe}        .expo/web/cache, .expo/dev/logs, node_modules/.cache, this project's`,
        chalk`              Metro file map in $TMPDIR, and {bold watchman watch-del} for this project.`,
        chalk`  {bold moderate}    also $TMPDIR/metro-cache, a node_modules reinstall with the project's own`,
        chalk`              package manager, ios/Pods with {bold pod install}, and android/build.`,
        chalk`  {bold aggressive}  also {bold expo prebuild --clean} on a CNG project, this app's DerivedData`,
        chalk`              directory, and {bold watchman watch-del-all}.`,
        '',
        chalk`  Steps that affect every project on this machine — $TMPDIR/metro-cache, DerivedData,`,
        chalk`  {bold watch-del-all} — are skipped unless {bold --allow-machine-wide} is passed.`,
        '',
        chalk`  {bold Deliberately not done:} {bold npm cache clean --force} and {bold yarn cache clean}. Both are`,
        chalk`  machine-wide and cost minutes of re-downloading, and a corrupt package-manager cache`,
        chalk`  is not what a stale bundle is. The troubleshooting docs list them; this leaves them`,
        chalk`  to you.`,
        '',
        chalk`  A checkpoint is taken before {bold --apply} at moderate and above. It holds {bold tracked files}`,
        chalk`  {bold only}: node_modules, ios/Pods, .expo and the Metro caches are gitignored, so`,
        chalk`  {bold checkpoint:undo} cannot bring them back. The reinstall steps are what do.`,
        '',
        chalk`  Exit codes: {bold 0} for a dry run and for an apply whose steps all worked, {bold 20} when an`,
        chalk`  applied step failed, {bold 1} for a bad argument or a project with uncommitted native`,
        chalk`  changes ({bold DOCTOR_FIX_DIRTY_NATIVE}).`,
        '',
      ].join('\n')
    );
  }

  // Load modules after the help prompt so `npx @expo/agent-cli doctor:fix -h` shows as fast as possible.
  const { logCmdError } = require('../../utils/errors') as typeof import('../../utils/errors');
  const { exitWithCodeAsync } = require('../../exitCodes') as typeof import('../../exitCodes');
  const { findUpProjectRootOrAssert } =
    require('../../utils/findUp') as typeof import('../../utils/findUp');
  const { printDoctorFixAsync } = require('./fixAsync') as typeof import('./fixAsync');
  const { resolvePlatforms, resolveTier } =
    require('./resolveFixOptions') as typeof import('./resolveFixOptions');

  return (async () => {
    const projectRoot = findUpProjectRootOrAssert(process.cwd());
    const exitCode = await printDoctorFixAsync(projectRoot, {
      tier: resolveTier(args['--tier']),
      apply: !!args['--apply'],
      platforms: resolvePlatforms(args['--platform']),
      allowMachineWide: !!args['--allow-machine-wide'],
      yes: !!args['--yes'],
      checkpoint: args['--no-checkpoint'] ? false : undefined,
      json: !!args['--json'],
      followups: !args['--no-followups'],
    });
    if (exitCode !== 0) {
      await exitWithCodeAsync(exitCode);
    }
  })().catch(logCmdError);
};
