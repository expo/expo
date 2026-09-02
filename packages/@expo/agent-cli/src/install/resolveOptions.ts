import { PROGRAM_NAME, PROGRAM_PREFIX } from '../programName';
import { CommandError } from '../utils/errors';

/** Flags that `@expo/agent-cli install` handles itself and does not forward to `expo install`. */
const AGENT_CLI_ONLY_FLAGS = [
  '--no-agent-skills',
  '--no-skill-context',
  '--no-impact',
  '--no-followups',
  '--json',
];

/**
 * The flags `expo install` accepts, in its own order.
 *
 * Source of truth: `packages/@expo/cli/src/install/resolveOptions.ts` [observed — 2026-08-23]. A
 * hand-kept list, like `forwardedCommands` in `src/commandRegistry.ts`, and for the same reason:
 * the alternative is finding out that an argument was wrong *after* this command has started
 * rewriting the manifest.
 */
const EXPO_INSTALL_FLAGS = [
  '--check',
  '--dev',
  '--fix',
  '--npm',
  '--pnpm',
  '--yarn',
  '--bun',
  '-h',
  '--help',
];

/** Which skills to link after the install finishes. */
export type SyncScope =
  /** Only the packages named on the command line. */
  | 'packages'
  /** Every skill in the dependency graph, because the installed set is unknown. */
  | 'all'
  /** Nothing, because the user opted out or nothing was installed. */
  | 'none';

export interface InstallPlan {
  /** Arguments to append after `install` when spawning the `expo` CLI. */
  expoArgs: string[];
  /** Package specs named on the command line, e.g. `['@expo/ui@~1.0.0']`. */
  packages: string[];
  /** Link skills after a successful install, cleared by `--no-agent-skills`. */
  agentSkills: boolean;
  /** Print the installed packages' `SKILL.md`, cleared by `--no-skill-context`. */
  skillContext: boolean;
  /** Scope of the post-install skill sync. */
  syncScope: SyncScope;
  /** Classify what the named packages changed, cleared by `--no-impact`. */
  impact: boolean;
  /** Attach the state-aware next actions to the output, cleared by `--no-followups`. */
  followups: boolean;
  /** Print one JSON object instead of the human output (`--json`). */
  json: boolean;
  /** `--check` was passed, so nothing is installed and nothing changes. */
  check: boolean;
}

/**
 * Split `@expo/agent-cli install` arguments into the `expo install` passthrough and the
 * skill-sync decisions.
 *
 * `expo install` takes no flags with a separate value, so every argument that does not
 * start with `-` (before a `--` separator) is a package spec.
 *
 * Everything a caller can get wrong is decided **here**, before anything is spawned. A rejected
 * invocation used to reach `expo install` and be rejected there, by which time this command had
 * already acted on it [observed — friction run, 2026-08-23].
 *
 * @see llp/0003-knowledge-tools-and-skills.rfc.md §Skills shipped from Expo modules
 * @throws {CommandError} `BAD_ARGS` for a flag neither CLI has, or a pair that cannot both apply.
 */
export function resolveInstallPlan(argv: string[]): InstallPlan {
  const separatorIndex = argv.indexOf('--');
  // Everything after `--` belongs to the package manager, verbatim, and is not ours to judge.
  const own = separatorIndex >= 0 ? argv.slice(0, separatorIndex) : argv;
  assertKnownFlags(own);

  const check = own.includes('--check');
  const json = own.includes('--json');

  if (check && own.includes('--fix')) {
    throw badArgs(
      `--check and --fix cannot both apply, so nothing ran. Why: --check only reports what is out of date, and --fix rewrites it. How: pass one of them.`,
      `${PROGRAM_PREFIX} install --check`
    );
  }

  const positional = own.filter((arg) => !arg.startsWith('-'));

  // `--json` is this command's own flag now, so it is stripped from the forwarded arguments —
  // except in a `--check` run, where the answer *is* the Expo CLI's report and this command has
  // to be given it to embed.
  const expoArgs = argv.filter((arg) => !AGENT_CLI_ONLY_FLAGS.includes(arg));
  if (check && json) {
    expoArgs.push('--json');
  }

  const agentSkills = !own.includes('--no-agent-skills');

  let syncScope: SyncScope = 'none';
  if (agentSkills && !check) {
    syncScope = positional.length ? 'packages' : 'all';
  }

  return {
    expoArgs,
    packages: positional,
    agentSkills,
    // The skills travel in the JSON report instead of onto stdout, which that mode owns.
    skillContext: agentSkills && !json && !own.includes('--no-skill-context'),
    syncScope,
    // The impact of a full `expo install --fix` is not one package's impact, so the report only
    // runs for named packages. It is independent of the skill flags.
    impact: !own.includes('--no-impact') && !check && positional.length > 0,
    followups: !own.includes('--no-followups'),
    json,
    check,
  };
}

/**
 * Reject a flag neither this command nor `expo install` has.
 *
 * Only the arguments before `--`: what follows is the package manager's, and npm's flags are not
 * ours to enumerate.
 */
function assertKnownFlags(own: string[]): void {
  const known = [...AGENT_CLI_ONLY_FLAGS, ...EXPO_INSTALL_FLAGS];
  const unknown = own.find((arg) => arg.startsWith('-') && !known.includes(arg));
  if (!unknown) {
    return;
  }
  const forwarded = EXPO_INSTALL_FLAGS.filter((flag) => flag.startsWith('--') && flag !== '--help');
  throw badArgs(
    [
      `"${unknown}" is not an option of "${PROGRAM_NAME} install", so nothing ran.`,
      `Why: this command forwards to "expo install", which takes ${forwarded.join(', ')}; the wrapper adds ${AGENT_CLI_ONLY_FLAGS.join(', ')}. "${unknown}" is in neither set.`,
      `How: drop it, or hand it to the package manager instead — everything after a "--" separator is forwarded untouched, as in "${PROGRAM_PREFIX} install react -- ${unknown}".`,
    ].join('\n'),
    `${PROGRAM_PREFIX} install --help`
  );
}

function badArgs(message: string, suggestedCommand: string): CommandError {
  const error = new CommandError('BAD_ARGS', message);
  // Errors are prompts (llp/0006 §Errors are prompts): a bad invocation answers with a good one.
  error.suggestedCommand = suggestedCommand;
  return error;
}
