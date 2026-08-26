// @ref llp/0011-impact-and-freshness.rfc.md
// The `impact` command. A top-level verb rather than a group, per the llp/0006 naming rule: `expo`
// has no `impact` command, so there is no behaviour for this name to have to match, and there is
// only one thing it does.
//
// The name is used twice in this repository. `src/project/impact.ts` classifies one *package* —
// "what must rerun after installing this?" — and this classifies one *change*. They answer the
// same question at two scales and deliberately share the word; the module names are what tell them
// apart, and llp/0011 §Two things called impact says so once.

import chalk from 'chalk';

import type { Command } from '../types';
import { assertWithOptionsArgs, printHelp } from '../utils/args';

export const exagentImpact: Command = async (argv) => {
  const args = assertWithOptionsArgs(
    {
      // Types
      '--help': Boolean,
      // Aliases
      '-h': '--help',
    },
    {
      argv,
      // The rest is resolved by `resolveImpactOptions`, which reports a bad flag as a
      // CommandError with the what / why / how the rest of this CLI has.
      permissive: true,
      command: 'impact',
      // The options and the positional arguments are resolved together by this command's own
      // `resolveImpactOptions`; a permissive parse cannot tell an unrecognized flag from a
      // positional argument, so it must not judge either. The resolver rejects a stray one.
      positionalArgs: 'own',
    }
  );

  if (args['--help']) {
    printHelp(
      `Report what a change costs: a reload, a Metro restart, or a new native build`,
      chalk`npx exagent impact {dim [options]}`,
      [
        `--platform ios|android|all  Platform to classify. Default: the platforms this project targets`,
        `--build <id>           Compare against an EAS build's fingerprint (server ground truth)`,
        `--profile <name>       eas.json build profile, reported with the result`,
        `--preset <name>        Fingerprint preset: strict, balanced (default), relaxed`,
        `--assert <class>       Exit 20 when the real class is stronger than this one`,
        `--json                 Print the report as JSON`,
        `--no-followups         Skip the "Suggested next:" section of suggested follow-up commands`,
        `-h, --help             Usage info`,
      ].join('\n'),
      [
        '',
        chalk`  {bold The three classes}, weakest first:`,
        '',
        chalk`    {bold js-only}                Fast Refresh picks it up. Nothing restarts.`,
        chalk`    {bold dev-client-compatible}  The installed app still runs this; Metro restarts.`,
        chalk`    {bold needs-native-build}     The native surface moved. Build again.`,
        '',
        chalk`  {bold OTA safety is reported separately, and is never the class.} A fingerprint`,
        chalk`  answers "does the native binary differ"; whether an update published now reaches`,
        chalk`  builds that can run it is a {bold runtimeVersion} question, and the two coincide only`,
        chalk`  under {bold policy: "fingerprint"}. Read the {bold ota} section, not the class.`,
        '',
        chalk`  {bold Exit codes} — {bold 0} always, because this is information rather than judgment,`,
        chalk`  except under {bold --assert}:`,
        '',
        chalk`     {bold 0}   a report was produced (and the assertion held, if one was made)`,
        chalk`    {bold 20}   {bold --assert} was given and the real class is stronger than it`,
        chalk`     {bold 1}   this command could not do its job: bad flag, no fingerprint CLI`,
        '',
        chalk`    {dim $} npx exagent impact --assert js-only --json || echo "needs more than a reload"`,
        '',
        chalk`  The default compares the working tree against the last native build {bold exagent dev}`,
        chalk`  recorded. For a build made in the cloud, {bold --build <id>} is server ground truth and`,
        chalk`  needs no local record. List recent builds with`,
        chalk`  {bold npx eas build:list --limit 5 --json --non-interactive}.`,
        '',
      ].join('\n')
    );
  }

  // Load modules after the help prompt so `npx exagent impact -h` shows as fast as possible.
  const { logCmdError } = require('../utils/errors') as typeof import('../utils/errors');
  const { findUpProjectRootOrAssert } =
    require('../utils/findUp') as typeof import('../utils/findUp');
  const { resolveImpactOptions } =
    require('./resolveOptions') as typeof import('./resolveOptions');
  const { impactAsync } = require('./impactAsync') as typeof import('./impactAsync');

  return (async () => {
    const options = resolveImpactOptions(argv ?? []);
    await impactAsync(findUpProjectRootOrAssert(process.cwd()), options);
  })().catch(logCmdError);
};
