// @ref llp/0012-build-explain.rfc.md
// `@expo/agent-cli inspect:build-log`, which the v1 narrowing renamed from `build:explain` (llp/0016): the
// `build` group it was in held one command that started nothing and one that waited on a build
// somebody else started, and `inspect` is the group named after what the caller is actually doing.
// The bare `build` verb is now a name this CLI does not have, answered by the absent-capability
// table in `src/commandRegistry.ts` with `npx eas build`.
//
// The directory is still `src/builds/` and not `src/inspect/`: it is what llp/0012 and the rule
// fixtures name throughout, and moving it would rewrite a hundred references to say nothing new.
// (`src/build/` was never available — the repository's `.gitignore` has `/packages/**/build/`.)

import { printCommandHelp } from '../help/format';
import type { CommandHelp } from '../help/types';
import { PROGRAM_PREFIX } from '../programName';
import type { Command } from '../types';
import { assertWithOptionsArgs } from '../utils/args';

export const inspectBuildLogHelp: CommandHelp = {
  command: 'inspect:build-log',
  usage: `${PROGRAM_PREFIX} inspect:build-log --file <path> | --stdin`,
  options: [
    `--file <path>          Read the log from this file`,
    `--stdin                Read the log from stdin. Implied when stdin is not a terminal`,
    `--platform ios|android Narrow the rules to one platform's phases`,
    `--context <n[:m]>      Lines of context around the match. Default: 8 before, 20 after`,
    `--all                  Report every match, not only the failing phase's first`,
    `--json                 Print the report as JSON`,
    `--no-followups         Skip the "Suggested next:" section of suggested follow-up commands`,
    `-h, --help             Usage info`,
  ],
  examples: [
    {
      run: `${PROGRAM_PREFIX} inspect:build-log --file ~/Downloads/xcodebuild.log`,
      gets: 'the failing phase, the line it failed on, and the lines around it',
    },
    {
      run: `${PROGRAM_PREFIX} inspect:build-log --stdin --json`,
      gets: 'the same from a piped log, as one object',
    },
    {
      run: `${PROGRAM_PREFIX} inspect:build-log --file build.log --all`,
      gets: 'every rule that matched, not only the failing phase’s first',
    },
  ],
  next: ['doctor', 'status'],
  json: {
    stdout: 'one object, and nothing else',
    stderr: 'progress and errors',
    keys: ['source', 'phases', 'failure', 'otherFailures', 'logTail', 'followups'],
  },
  notes: [
    `Deterministic extraction, not summarization: a capped rule table, each rule with a fixture`,
    `and a test. Every answer carries the line it came from.`,
    `Exit codes: 0 a report was produced, "no error located" included · 1 no report could be`,
    `produced · 22 what arrived is not text, most often a log still brotli-compressed.`,
    `"${PROGRAM_PREFIX} inspect:build-log <build-id>" is reserved and does not work yet: eas-cli has no`,
    `build:logs, so an EAS build's log has to be saved and passed with --file. Run`,
    `"npx eas build:view" for where those files are.`,
  ],
};

export const agentCliInspectBuildLog: Command = async (argv) => {
  const args = assertWithOptionsArgs(
    {
      // Types
      '--help': Boolean,
      // Aliases
      '-h': '--help',
    },
    {
      argv,
      // The rest is resolved by `resolveExplainOptions`, which reports a bad flag as a
      // CommandError.
      permissive: true,
      command: 'inspect:build-log',
      // The build-id positional is reserved rather than rejected here: `resolveExplainOptions`
      // owns the message that says why it does not work yet and what does.
      positionalArgs: 'own',
    }
  );

  if (args['--help']) {
    printCommandHelp(inspectBuildLogHelp);
  }

  // Load modules after the help prompt so `npx @expo/agent-cli inspect:build-log -h` shows as fast as possible.
  const { logCmdError } = require('../utils/errors') as typeof import('../utils/errors');
  const { resolveExplainOptions } =
    require('./explain/resolveOptions') as typeof import('./explain/resolveOptions');
  const { explainAsync } =
    require('./explain/explainAsync') as typeof import('./explain/explainAsync');

  return (async () => {
    const options = resolveExplainOptions(argv ?? [], {
      stdinIsTTY: !!process.stdin.isTTY,
      cwd: process.cwd(),
    });
    await explainAsync(options);
  })().catch(logCmdError);
};
