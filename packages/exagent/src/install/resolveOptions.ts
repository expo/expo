/** Flags that `exagent install` handles itself and does not forward to `expo install`. */
const EXAGENT_ONLY_FLAGS = [
  '--no-agent-skills',
  '--no-skill-context',
  '--no-impact',
  '--no-followups',
  '--no-checkpoint',
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
  /** Snapshot the project before `expo install` runs, cleared by `--no-checkpoint`. */
  checkpoint: boolean;
}

/**
 * Split `exagent install` arguments into the `expo install` passthrough and the
 * skill-sync decisions.
 *
 * `expo install` takes no flags with a separate value, so every argument that does not
 * start with `-` (before a `--` separator) is a package spec.
 *
 * @see llp/0003-knowledge-tools-and-skills.rfc.md §Migration
 */
export function resolveInstallPlan(argv: string[]): InstallPlan {
  const expoArgs = argv.filter((arg) => !EXAGENT_ONLY_FLAGS.includes(arg));
  const separatorIndex = argv.indexOf('--');
  const positional = (separatorIndex >= 0 ? argv.slice(0, separatorIndex) : argv).filter(
    (arg) => !arg.startsWith('-')
  );

  const agentSkills = !argv.includes('--no-agent-skills');
  // `--check` only reports outdated versions, so there is nothing new to link.
  const installsNothing = argv.includes('--check');

  let syncScope: SyncScope = 'none';
  if (agentSkills && !installsNothing) {
    syncScope = positional.length ? 'packages' : 'all';
  }

  return {
    expoArgs,
    packages: positional,
    agentSkills,
    skillContext: agentSkills && !argv.includes('--no-skill-context'),
    syncScope,
    // The impact of a full `expo install --fix` is not one package's impact, so the report only
    // runs for named packages. It is independent of the skill flags.
    impact: !argv.includes('--no-impact') && !installsNothing && positional.length > 0,
    followups: !argv.includes('--no-followups'),
    // `--check` changes nothing, so there is nothing to snapshot for.
    checkpoint: !argv.includes('--no-checkpoint') && !installsNothing,
  };
}
