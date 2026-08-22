// @ref llp/0006-agent-native-cli-surface.rfc.md §The `exagent` launcher
// The whole command surface as data: which names exist, what loads them, and how one argv resolves
// to one of them. `cli.ts` reads the answer and does the I/O; nothing here prints or exits, so the
// resolution rules are unit-testable without spawning the CLI.
//
// Two kinds of name, and one rule each:
//
// - **Top-level** (`dev`, `status`) — a flat lazy map, one module per name.
// - **Groups** (`runtime:eval`, `skills:sync`) — a nested lazy map. `<group>:<action>` is the
//   canonical spelling; `<group> <action>` resolves to the same command, so an agent that types
//   the space form is never wrong. A group with a `defaultAction` runs it for the bare name.
//
// A name with a colon is always one of ours: it is never forwarded to the `expo` CLI, because no
// `expo` command has a colon in it. Anything else that is not in the maps is one of the `expo`
// CLI's own commands and is forwarded verbatim (`src/passthrough/`).

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
  context: () => import('./context').then((i) => i.exagentContext),
  deploy: () => import('./deploy').then((i) => i.exagentDeploy),
  dev: () => import('./dev').then((i) => i.exagentDev),
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

/** What one argv resolved to. Every case is something `cli.ts` can act on without deciding again. */
export type CommandResolution =
  /** A command of this CLI, with the arguments it owns. */
  | { kind: 'command'; name: string; argv: string[]; load: CommandLoader }
  /** A bare group, or a group asked for help: print its actions and exit 0. */
  | { kind: 'group-help'; group: string }
  /** A known group with an action it does not have: the listing, plus an error. */
  | { kind: 'unknown-action'; group: string; action: string }
  /** A colon command whose group does not exist. Never forwarded — `expo` has no colon commands. */
  | { kind: 'unknown-group'; command: string; group: string }
  /** Not one of ours, so it is one of the `expo` CLI's own commands. */
  | { kind: 'passthrough'; command: string; argv: string[] };

/**
 * Resolve the command an invocation names.
 *
 * @param command The first positional argument, e.g. `runtime:eval` or `runtime`.
 * @param argv Everything after it, with the help flag already normalized into it by `cli.ts`.
 */
export function resolveCommand(command: string, argv: string[]): CommandResolution {
  // A colon names one of our groups, whether or not the group exists.
  if (command.includes(':')) {
    const separator = command.indexOf(':');
    const group = command.slice(0, separator);
    const action = command.slice(separator + 1);
    const entry = commandGroups[group];
    if (!entry) {
      return { kind: 'unknown-group', command, group };
    }
    const target = entry.actions[action];
    if (!target) {
      return { kind: 'unknown-action', group, action };
    }
    return { kind: 'command', name: `${group}:${action}`, argv, load: target.load };
  }

  const group = commandGroups[command];
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
    if (argv.includes('--help') || argv.includes('-h') || !group.defaultAction) {
      return { kind: 'group-help', group: command };
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

  return { kind: 'passthrough', command, argv };
}

/** The canonical names of every action of a group, e.g. `['runtime:eval', ...]`. */
function actionNames(group: string): string[] {
  return Object.keys(commandGroups[group]!.actions).map((action) => `${group}:${action}`);
}

/** One section of the top-level help: a job an agent has, and the commands that do it. */
export interface HelpSection {
  title: string;
  commands: string[];
}

/**
 * The advertised surface, grouped by the job at hand rather than alphabetically: a flat list of
 * fifteen names says nothing about which one to reach for. A unit test pins that every command in
 * the registry appears here, so a new command cannot ship undiscoverable.
 */
export const helpSections: HelpSection[] = [
  { title: 'Develop', commands: ['dev', 'start', 'install', 'status', 'context'] },
  { title: 'Create & ship', commands: ['new', 'deploy'] },
  {
    title: 'Runtime (needs a running app)',
    commands: [...actionNames('runtime'), 'navigate'],
  },
  { title: 'Agent setup', commands: [...actionNames('agents'), ...actionNames('skills')] },
  { title: 'Safety', commands: ['checkpoint', 'checkpoint:list', 'checkpoint:undo'] },
];

/** The `exagent --help` listing: every command, by the job it does. */
export function formatTopLevelHelp(): string {
  const sections = helpSections
    .map(({ title, commands }) => chalk`    {bold ${title}}\n      ${commands.join(', ')}`)
    .join('\n');

  return chalk`
  {bold Usage}
    {dim $} npx exagent <command>

  {bold Commands}
${sections}

    Anything else is forwarded to {bold expo <command>}.

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

/** The error for a colon command whose group does not exist. */
export function unknownGroupMessage(command: string, group: string): string {
  return (
    `"exagent ${command}" is not a command. ` +
    `A colon names one of exagent's own command groups, and "${group}" is not one of them: the groups are ${Object.keys(
      commandGroups
    ).join(', ')}. ` +
    `Run "npx exagent --help" for the full list. A command without a colon is forwarded to the project's expo CLI, but this one was not: no expo command has a colon in its name.`
  );
}
