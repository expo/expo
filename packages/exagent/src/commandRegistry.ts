// @ref llp/0006-agent-native-cli-surface.rfc.md §The `exagent` launcher
// The whole command surface as data: which names exist, what loads them, and how one argv resolves
// to one of them. `cli.ts` reads the answer and does the I/O; nothing here prints or exits, so the
// resolution rules are unit-testable without spawning the CLI.
//
// Three kinds of name, and one rule each:
//
// - **Top-level** (`dev`, `status`) — a flat lazy map, one module per name.
// - **Groups** (`runtime:eval`, `skills:sync`) — a nested lazy map. `<group>:<action>` is the
//   canonical spelling; `<group> <action>` resolves to the same command, so an agent that types
//   the space form is never wrong. A group with a `defaultAction` runs it for the bare name.
// - **Forwarded** (`prebuild`, `login`) — a fixed list of the `expo` commands this CLI does not
//   wrap, run as a subprocess verbatim (`src/passthrough/`).
//
// Plus `commandAliases`, which is another name for one of the above rather than a fourth kind.
//
// The three lists are the whole surface: a name in none of them is a command neither CLI has, and
// it fails saying so. There is no open-ended fallback, so a typo is answered here instead of
// becoming an `expo` invocation that could not have meant anything.

import chalk from 'chalk';

import type { Command } from './types';

/** Loads one command module on demand, so `exagent --help` never pays for the whole CLI. */
export type CommandLoader = () => Promise<Command>;

/** One action of a group, e.g. the `eval` of `runtime:eval`. */
export interface CommandAction {
  /** One line, printed by the group help. */
  summary: string;
  load: CommandLoader;
}

/** One colon group, e.g. the `runtime` of `runtime:eval`. */
export interface CommandGroup {
  /** What the group is for, printed as the `Info` line of the group help. */
  summary: string;
  /**
   * Action the bare group name runs, e.g. `exagent checkpoint` runs `checkpoint:create`.
   * A group without one prints its help instead, because there is nothing obvious to do.
   */
  defaultAction?: string;
  /**
   * The command another CLI owns the bare group name for, e.g. `npx eas build` for `build`.
   *
   * Set it when the group name is also a verb someone will type on its own. `exagent build
   * --platform ios` is not a typo — it is a real command of a real CLI, aimed at the wrong one —
   * and the answer that helps is that command, with the caller's own flags on it, rather than a
   * listing of two actions that do something else (llp/0010 §Registry rules).
   */
  bareNameCommand?: string;
  actions: { [action: string]: CommandAction };
}

/**
 * Hand the action back to a command that reads it as its first argument.
 *
 * The commands of a group are one module with one `--help` block when the actions share their
 * options (`runtime`, `skills`); such a module parses its action out of `argv[0]`, exactly as the
 * space form always gave it. The registry strips the action while resolving, so this puts it back
 * and every command receives the same argv whichever spelling the caller used.
 */
export function withAction(action: string, load: CommandLoader): CommandLoader {
  return () => load().then((command) => (argv?: string[]) => command([action, ...(argv ?? [])]));
}

/** Commands with a name of their own. Add a new top-level command here. */
export const topLevelCommands: { [command: string]: CommandLoader } = {
  deploy: () => import('./deploy').then((i) => i.exagentDeploy),
  install: () => import('./install').then((i) => i.exagentInstall),
  navigate: () => import('./navigate').then((i) => i.exagentNavigate),
  new: () => import('./new').then((i) => i.exagentNew),
  start: () => import('./start').then((i) => i.exagentStart),
  status: () => import('./status').then((i) => i.exagentStatus),
};

/** Commands that belong to a group. Add a new action, or a new group, here. */
export const commandGroups: { [group: string]: CommandGroup } = {
  agents: {
    summary: 'Set this project up for coding agents',
    actions: {
      setup: {
        summary: 'Link the agent skills and maintain the managed block of AGENTS.md',
        load: () => import('./agents').then((i) => i.exagentAgentsSetup),
      },
    },
  },
  build: {
    summary: 'Work with the EAS builds this project already has',
    // No `defaultAction`: `exagent build --platform ios` means `eas build`, and running an
    // action of this group for it would be a command nobody asked for. See `bareNameCommand`.
    bareNameCommand: 'npx eas build',
    actions: {
      wait: {
        summary: 'Wait for a build to finish, and exit with what it did',
        load: () => import('./builds').then((i) => i.exagentBuildWait),
      },
    },
  },
  checkpoint: {
    summary: 'Snapshot the project, so a later change can be undone',
    defaultAction: 'create',
    actions: {
      create: {
        summary: 'Snapshot the files git tracks in this project',
        load: () => import('./checkpoint').then((i) => i.exagentCheckpointCreate),
      },
      list: {
        summary: 'List the checkpoints recorded for this project',
        load: () => import('./checkpoint').then((i) => i.exagentCheckpointList),
      },
      undo: {
        summary: 'Restore the project to a checkpoint',
        load: () => import('./checkpoint').then((i) => i.exagentCheckpointUndo),
      },
    },
  },
  // `config` is also a forwarded `expo` command, so this group owns its colon forms only and
  // `exagent config` stays `expo config` (llp/0010 §Registry rules, rule b).
  config: {
    summary: 'Read the native configuration the config plugins produce',
    actions: {
      effective: {
        summary: 'What the config plugins actually produced, per platform',
        load: () => import('./config').then((i) => i.exagentConfigEffective),
      },
    },
  },
  // `dev` is a group with a default action rather than a top-level command, so `exagent dev` runs
  // the plan engine exactly as before while `dev:wait` joins it as one entry. Promoting a name
  // this way costs nothing at the call site: a group with a `defaultAction` gives it every option.
  dev: {
    summary: 'Get this app onto a device, and wait for its dev server to be ready',
    defaultAction: 'run',
    actions: {
      run: {
        summary: 'Decide what must run to get this app on a device, print the plan, then run it',
        load: () => import('./dev').then((i) => i.exagentDev),
      },
      wait: {
        summary: `Wait until the dev server has finished bundling, and say whose bundle it is`,
        load: () => import('./dev/wait').then((i) => i.exagentDevWait),
      },
    },
  },
  doctor: {
    summary: 'Diagnose the project with expo-doctor',
    defaultAction: 'check',
    actions: {
      check: {
        summary: 'Run the expo-doctor checks and normalize the report',
        load: () => import('./doctor').then((i) => i.exagentDoctorCheck),
      },
    },
  },
  runtime: {
    summary: `Read and drive the running app over the dev server's debugger connection`,
    actions: {
      eval: {
        summary: 'Evaluate JavaScript in the running app',
        load: withAction('eval', () => import('./runtime').then((i) => i.exagentRuntime)),
      },
      errors: {
        summary: 'Collect runtime errors over a time window',
        load: withAction('errors', () => import('./runtime').then((i) => i.exagentRuntime)),
      },
      network: {
        summary: `Collect the app's HTTP requests over a time window`,
        load: withAction('network', () => import('./runtime').then((i) => i.exagentRuntime)),
      },
    },
  },
  skills: {
    summary: 'Link agent skills from installed npm packages',
    defaultAction: 'sync',
    actions: {
      sync: {
        summary: 'Link the skills of the installed packages into the agent directories',
        load: withAction('sync', () => import('./skills').then((i) => i.exagentSkills)),
      },
      list: {
        summary: 'List the skills the installed packages ship',
        load: withAction('list', () => import('./skills').then((i) => i.exagentSkills)),
      },
      show: {
        summary: `Print the SKILL.md of a package`,
        load: withAction('show', () => import('./skills').then((i) => i.exagentSkills)),
      },
      clean: {
        summary: 'Remove the managed skill links',
        load: withAction('clean', () => import('./skills').then((i) => i.exagentSkills)),
      },
    },
  },
};

/**
 * Other names for a command above, as `alias -> command`.
 *
 * These exist for parity: `expo add` is `expo install` under another name, so `exagent add` has to
 * be `exagent install` — the wrapper with the skill sync and the impact report — and not a bare
 * forward that quietly does less than the command it looks like. An alias resolves to its target's
 * name, so the event stream and the follow-ups only ever name the command that ran.
 *
 * An alias is documented in its target's `--help`, not as a command of its own: the top-level
 * listing names capabilities, and an alias adds none.
 */
export const commandAliases: { [alias: string]: string } = {
  add: 'install',
};

/**
 * The `expo` commands this CLI forwards, and the whole of what it forwards.
 *
 * A fixed set, not a fallback: an unrecognized command is a typo far more often than it is a new
 * `expo` command, and forwarding it made the typo the `expo` CLI's problem to report. The cost is
 * that this list has to be kept in step by hand.
 *
 * Source of truth: the `commands` map of `packages/@expo/cli/src/index.ts` [observed —
 * 2026-08-22], in its own order, minus `start` and `install`, which this CLI wraps.
 */
export const forwardedCommands: string[] = [
  // Project commands
  'run',
  'run:ios',
  'run:android',
  'prebuild',
  'config',
  'export',
  'export:web',
  'export:embed',
  'serve',
  // Auxiliary commands. `add` is missing on purpose: it is `expo install` under another name, so
  // it is an alias of this CLI's `install` wrapper (see `commandAliases`).
  'customize',
  'lint',
  // Auth
  'login',
  'logout',
  'register',
  'whoami',
];

/** What one argv resolved to. Every case is something `cli.ts` can act on without deciding again. */
export type CommandResolution =
  /** A command of this CLI, with the arguments it owns. */
  | { kind: 'command'; name: string; argv: string[]; load: CommandLoader }
  /** A bare group, or a group asked for help: print its actions and exit 0. */
  | { kind: 'group-help'; group: string }
  /** A known group with an action it does not have: the listing, plus an error. */
  | { kind: 'unknown-action'; group: string; action: string }
  /** A group with options but no action, and no default action to give them to: an error. */
  | { kind: 'flags-without-action'; group: string; flags: string[] }
  /** One of the `expo` commands above, forwarded verbatim. */
  | { kind: 'passthrough'; command: string; argv: string[] }
  /** In none of the three maps, so neither CLI has it. */
  | { kind: 'unknown-command'; command: string };

// @ref llp/0010-agent-conventions.rfc.md §Registry rules — rules 1 and 2 below.
/**
 * Resolve the command an invocation names.
 *
 * Our own names win, then the forwarded `expo` set, and anything left is an error. Membership in a
 * map decides — never the shape of the name — because `expo export:web` has a colon too.
 *
 * Two rules of the resolution order are worth naming:
 *
 * 1. **Options without an action are an error, not help.** `exagent <group> --json` used to print
 *    the group listing and exit 0, which an agent reads as "that worked" — a silent no-op is the
 *    one answer a driving agent cannot recover from. A group that declares a `defaultAction` is
 *    unaffected: there the options belong to that action, and it runs with them.
 * 2. **A group cannot capture the bare form of a forwarded `expo` command.** A group named after
 *    one — `config`, say — owns its colon forms (`config:doctor`) and nothing else: `exagent
 *    config` stays `expo config`, because the bare name means what the `expo` command means
 *    (llp/0006 naming rule). The space form is unavailable for such a group, so
 *    `exagent config doctor` forwards two arguments to `expo config` rather than resolving here.
 *
 * @param command The first positional argument, e.g. `runtime:eval` or `runtime`.
 * @param argv Everything after it, with the help flag already normalized into it by `cli.ts`.
 */
export function resolveCommand(command: string, argv: string[]): CommandResolution {
  // A colon spells one of our groups, unless the whole name is a command `expo` owns.
  if (command.includes(':') && !forwardedCommands.includes(command)) {
    const separator = command.indexOf(':');
    const groupName = command.slice(0, separator);
    const action = command.slice(separator + 1);
    const entry = commandGroups[groupName];
    if (entry) {
      const target = entry.actions[action];
      // An action of a group we own is never forwarded, whether or not the group has it.
      return target
        ? {
            kind: 'command',
            name: `${groupName}:${action}`,
            argv,
            load: target.load,
          }
        : { kind: 'unknown-action', group: groupName, action };
    }
  }

  // Rule 2: the bare name of a forwarded `expo` command is that command, whatever this CLI groups
  // under the same name. Its colon forms were resolved above, where the forwarded set is checked
  // against the whole name and so never matches `<group>:<action>`.
  const group = forwardedCommands.includes(command) ? undefined : commandGroups[command];
  if (group) {
    // The action of the space form is the argument right after the group name: `skills list`, the
    // way `skills:list` puts it. A flag there is the bare form with options, not a bad action.
    const next = argv[0];
    if (next != null && !next.startsWith('-')) {
      const target = group.actions[next];
      if (!target) {
        return { kind: 'unknown-action', group: command, action: next };
      }
      return {
        kind: 'command',
        name: `${command}:${next}`,
        argv: argv.slice(1),
        load: target.load,
      };
    }
    // `exagent <group> --help` is about the group, so it lists the actions instead of running one.
    if (argv.includes('--help') || argv.includes('-h')) {
      return { kind: 'group-help', group: command };
    }
    if (!group.defaultAction) {
      // Rule 1: a bare group is answerable and prints its actions; the same group with options is
      // an invocation that named no action, and there is nothing to give the options to.
      return next == null
        ? { kind: 'group-help', group: command }
        : { kind: 'flags-without-action', group: command, flags: argv };
    }
    return {
      kind: 'command',
      name: `${command}:${group.defaultAction}`,
      argv,
      load: group.actions[group.defaultAction]!.load,
    };
  }

  const load = topLevelCommands[command];
  if (load) {
    return { kind: 'command', name: command, argv, load };
  }

  const aliased = commandAliases[command];
  if (aliased) {
    return {
      kind: 'command',
      name: aliased,
      argv,
      load: topLevelCommands[aliased]!,
    };
  }

  if (forwardedCommands.includes(command)) {
    return { kind: 'passthrough', command, argv };
  }

  return { kind: 'unknown-command', command };
}

/** The canonical names of every action of a group, e.g. `['runtime:eval', ...]`. */
function actionNames(group: string): string[] {
  return Object.keys(commandGroups[group]!.actions).map((action) => `${group}:${action}`);
}

/** One section of the top-level help: a job an agent has, and the commands that do it. */
export interface HelpSection {
  title: string;
  commands: string[];
  /** One line under the commands, for a section that needs it. */
  note?: string;
}

/**
 * The advertised surface, grouped by the job at hand rather than alphabetically: a flat list of
 * thirty names says nothing about which one to reach for. A unit test pins that every command in
 * the registry appears here, so a new command cannot ship undiscoverable.
 */
export const helpSections: HelpSection[] = [
  { title: 'Develop', commands: ['dev', 'dev:wait', 'start', 'install', 'status'] },
  {
    title: 'Inspect the project',
    commands: ['config:effective', 'doctor'],
    note: 'exagent config (bare) is expo config; only config:effective is this CLI',
  },
  { title: 'Create', commands: ['new'] },
  {
    title: 'Deployment',
    commands: ['deploy', ...actionNames('build')],
    note: 'Builds are started with npx eas build; build:wait attaches to one that exists.',
  },
  { title: 'Debug a running app', commands: [...actionNames('runtime'), 'navigate'] },
  { title: 'Agent setup', commands: [...actionNames('agents'), ...actionNames('skills')] },
  { title: 'Checkpoints', commands: ['checkpoint', 'checkpoint:list', 'checkpoint:undo'] },
  {
    title: 'Expo CLI (fallback to npx expo <command>)',
    commands: forwardedCommands,
  },
];

/** Width the help wraps a long command list at, so the Expo CLI section stays readable. */
const HELP_WIDTH = 80;

/** One comma-separated list of commands, wrapped onto as many indented lines as it needs. */
function wrapCommands(commands: string[], indent: string): string {
  const lines: string[] = [];
  for (const command of commands) {
    const last = lines.length - 1;
    const candidate = lines.length ? `${lines[last]}, ${command}` : `${indent}${command}`;
    if (lines.length && candidate.length <= HELP_WIDTH) {
      lines[last] = candidate;
    } else {
      // The comma stays on the line that is full, so a wrapped list still reads as one list.
      if (lines.length) {
        lines[last] += ',';
      }
      lines.push(`${indent}${command}`);
    }
  }
  return lines.join('\n');
}

/** The `exagent --help` listing: every command, by the job it does. */
export function formatTopLevelHelp(): string {
  const sections = helpSections
    .map(({ title, commands, note }) =>
      [
        chalk`    {bold ${title}}`,
        wrapCommands(commands, '      '),
        note ? chalk`      {dim ${note}}` : null,
      ]
        .filter((line) => line != null)
        .join('\n')
    )
    .join('\n');

  return chalk`
  {bold Usage}
    {dim $} npx exagent <command>

  {bold Commands}
${sections}

  {bold Options}
    --version, -v   Version number
    --help, -h      Usage info

  For more info run a command with the {bold --help} flag
    {dim $} npx exagent skills:sync --help
`;
}

/** The `exagent <group>` listing: what the group is for, and the actions it has. */
export function formatGroupHelp(name: string): string {
  const group = commandGroups[name]!;
  // One column for the names, so the summaries line up whatever the longest action is called.
  const width = Math.max(...actionNames(name).map((action) => action.length)) + 3;
  const actions = actionNames(name)
    .map(
      (action, index) =>
        chalk`    {bold ${action.padEnd(width)}}${Object.values(group.actions)[index]!.summary}`
    )
    .join('\n');
  const bare = group.defaultAction
    ? chalk`\n\n    {bold npx exagent ${name}} runs {bold ${name}:${group.defaultAction}}.`
    : '';

  return chalk`
  {bold Info}
    ${group.summary}

  {bold Usage}
    {dim $} npx exagent ${name}:{dim <action> [options]}

  {bold Actions}
${actions}${bare}

  For the options of one action, run it with the {bold --help} flag
    {dim $} npx exagent ${actionNames(name)[0]} --help
`;
}

/**
 * The error for a known group asked for an action it does not have. Printed under the group
 * listing, so the reader sees the alternatives and then what to do about it.
 */
export function unknownActionMessage(group: string, action: string): string {
  return (
    `"${action}" is not an action of "exagent ${group}". ` +
    `The actions of the ${group} group are the ones listed above: ${actionNames(group).join(', ')}. ` +
    `Run one of those, or "npx exagent ${group} --help" for what each of them does.`
  );
}

/**
 * The error for a group given options but no action (llp/0010 §Registry rules).
 *
 * What, why, how, in that order: the flags are quoted back so the reader sees their own command,
 * the reason names the missing half, and the way out is the list of actions those flags could
 * have belonged to — or, for a group whose name is another CLI's verb, that CLI's command with
 * these very flags on it, because that is what the caller was reaching for.
 */
export function flagsWithoutActionMessage(group: string, flags: string[]): string {
  const bare = commandGroups[group]?.bareNameCommand;
  return (
    `"exagent ${group} ${flags.join(' ')}" names no action, so nothing ran. ` +
    `The ${group} group has no default action: its options belong to one of its actions, not to the group itself, so there is nothing here for ${flags[0]} to apply to. ` +
    (bare
      ? `"exagent ${group}" is not the command that starts one — that is "${bare}", which takes these options. `
      : '') +
    `Run one of ${actionNames(group).join(', ')} with those options, or "npx exagent ${group} --help" for what each of them does.`
  );
}

/**
 * The command to put on the `Try:` line of a {@link flagsWithoutActionMessage}.
 *
 * The other CLI's command with the caller's own flags when the group has one, so the recovery is a
 * paste rather than a re-read; the group's help otherwise.
 */
export function flagsWithoutActionSuggestion(group: string, flags: string[]): string {
  const bare = commandGroups[group]?.bareNameCommand;
  return bare ? [bare, ...flags].join(' ') : `npx exagent ${group} --help`;
}

/** The error for a name in none of the three maps. */
export function unknownCommandMessage(command: string): string {
  return (
    `"exagent ${command}" is not a command. ` +
    `exagent runs its own commands, the actions of its command groups (${Object.keys(
      commandGroups
    ).join(
      ', '
    )}), and a fixed set of ${forwardedCommands.length} expo commands it forwards; "${command}" is in none of them, so neither CLI has it. ` +
    `Run "npx exagent --help" for the whole list.`
  );
}
