// @ref llp/0006-agent-native-cli-surface.rfc.md §The `@expo/agent-cli` launcher
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

import { ON_RAMP_FOOTER, ON_RAMP_POINTER, ON_RAMP_TOPIC } from './help/onRamp';
import type { CommandHelp } from './help/types';
import { PROGRAM_NAME, PROGRAM_PREFIX } from './programName';
import type { Command } from './types';
import { color } from './utils/color';

/** Loads one command module on demand, so `@expo/agent-cli --help` never pays for the whole CLI. */
export type CommandLoader = () => Promise<Command>;

/**
 * Loads one command's help spec on demand.
 *
 * Separate from {@link CommandLoader} and pointing at the same module: the spec is data
 * (`src/help/types.ts`), so the template test can load every one of them and check the sections
 * without running a command or spawning a process. Required on every entry, so a new command
 * cannot ship with a `--help` that is whatever its author felt like writing.
 */
export type HelpLoader = () => Promise<CommandHelp>;

/**
 * Whether a command may change or vanish, which is a property of the **command** and not of the
 * group it is in.
 *
 * Per action on purpose: `inspect` is a group a stable action can join, and marking the group would
 * say the opposite of what is meant about the ones that follow. The help prints an `[experimental]`
 * tag on the line and one footnote per section that has any, so a reader learns it where they learn
 * the command rather than in a release note.
 *
 * `true` or absent — never `false`. A command that is not marked is the ordinary case, and a
 * `unstable: false` beside twenty entries with nothing would read as a claim somebody made rather
 * than as the default.
 *
 * **The mark comes off against a record, not against a feeling** (llp/0016-v1-scope.rfc.md §Experimental is per command).
 * One command carries it: `inspect:config-plugins`.
 */
export type Unstable = true;

/** One action of a group, e.g. the `eval` of `runtime:eval`. */
export interface CommandAction {
  /** One line, printed by the group help and by the top-level listing. */
  summary: string;
  load: CommandLoader;
  /** @see HelpLoader */
  help: HelpLoader;
  /** @see Unstable */
  unstable?: Unstable;
}

/** One command with a name of its own, e.g. `smoke`. */
export interface TopLevelCommand {
  /**
   * One line, printed by the top-level listing.
   *
   * Here rather than in the command's own {@link CommandHelp}, so the listing can print it without
   * loading twenty command modules — and so the sentence a caller reads in the listing is the same
   * sentence they read at the head of that command's help.
   */
  summary: string;
  load: CommandLoader;
  /** @see HelpLoader */
  help: HelpLoader;
  /** @see Unstable */
  unstable?: Unstable;
}

/** One colon group, e.g. the `runtime` of `runtime:eval`. */
export interface CommandGroup {
  /** What the group is for, printed as the `Info` line of the group help. */
  summary: string;
  /**
   * Action the bare group name runs, e.g. `@expo/agent-cli doctor` runs `doctor:check`.
   * A group without one prints its help instead, because there is nothing obvious to do.
   */
  defaultAction?: string;
  /**
   * The command another CLI owns the bare group name for, e.g. `npx eas build` for `build`.
   *
   * Set it when the group name is also a verb someone will type on its own. `@expo/agent-cli build
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
export const topLevelCommands: { [command: string]: TopLevelCommand } = {
  deploy: {
    summary: 'Ship the web app, or launch the native one',
    load: () => import('./deploy').then((i) => i.agentCliDeploy),
    help: () => import('./deploy').then((i) => i.deployHelp),
  },
  // The on-ramp, as a command rather than only as a flag. An agent that has been handed this CLI
  // and nothing else types the word it knows — `help` — and the answer has to be the loop, not a
  // suggestion to read something else (llp/0024 §The on-ramp).
  help: {
    summary: `Learn the workflow, or one command's help`,
    load: () => import('./help').then((i) => i.agentCliHelp),
    help: () => import('./help').then((i) => i.helpHelp),
  },
  install: {
    summary: 'Install packages, and link the skills they ship',
    load: () => import('./install').then((i) => i.agentCliInstall),
    help: () => import('./install').then((i) => i.installHelp),
  },
  navigate: {
    summary: 'Open a route in the app on a booted device',
    load: () => import('./navigate').then((i) => i.agentCliNavigate),
    help: () => import('./navigate').then((i) => i.navigateHelp),
  },
  new: {
    summary: 'Create a new Expo project without a terminal',
    load: () => import('./new').then((i) => i.agentCliNew),
    help: () => import('./new').then((i) => i.newHelp),
  },
  // A capability only this CLI has, so it gets a verb of its own (llp/0006 naming rule).
  smoke: {
    summary: 'Prove the app boots, on a device',
    load: () => import('./smoke').then((i) => i.agentCliSmoke),
    help: () => import('./smoke').then((i) => i.smokeHelp),
  },
  start: {
    summary: 'expo start, plus a sync of the agent skills',
    load: () => import('./start').then((i) => i.agentCliStart),
    help: () => import('./start').then((i) => i.startHelp),
  },
  status: {
    summary: 'Where the project is now, and what to run next',
    load: () => import('./status').then((i) => i.agentCliStatus),
    help: () => import('./status').then((i) => i.statusHelp),
  },
  // A capability only this CLI has gets a verb of its own (llp/0006 naming rule): `expo` has no
  // `typecheck` in its command map [observed — `packages/@expo/cli/src/index.ts`, 2026-08-23], so
  // there is no `expo` behaviour for this name to have to match.
  typecheck: {
    summary: `Type-check with the project's own compiler`,
    load: () => import('./typecheck').then((i) => i.agentCliTypecheck),
    help: () => import('./typecheck').then((i) => i.typecheckHelp),
  },
};

/** Commands that belong to a group. Add a new action, or a new group, here. */
export const commandGroups: { [group: string]: CommandGroup } = {
  agents: {
    summary: 'Set this project up for coding agents',
    actions: {
      setup: {
        summary: 'Write AGENTS.md and link the agent skills',
        load: () => import('./agents').then((i) => i.agentCliAgentsSetup),
        help: () => import('./agents').then((i) => i.agentsSetupHelp),
      },
    },
  },
  // Read-only questions about a project that is not running. The two actions were `inspect:build-log`
  // and `inspect:config-plugins`, under two groups named after other CLIs' verbs; one group named after
  // what the caller is doing holds them and every read-only answer that follows.
  //
  // The group is not marked unstable — one of its actions is, individually. A group-level mark
  // would say something about the stable actions that join it later, which is the opposite of what
  // is meant (see {@link Unstable}), and this group is now the case that shows it: two actions,
  // one graduated and one not, on one listing (llp/0016-v1-scope.rfc.md §Experimental is per command).
  inspect: {
    summary: 'Read what this project produced, without running it',
    actions: {
      'build-log': {
        summary: 'Say what failed in a build log',
        load: () => import('./builds').then((i) => i.agentCliInspectBuildLog),
        help: () => import('./builds').then((i) => i.inspectBuildLogHelp),
      },
      // The only `[experimental]` command (llp/0016 §Experimental is per command).
      'config-plugins': {
        summary: 'What the config plugins produced',
        load: () => import('./config').then((i) => i.agentCliInspectConfigPlugins),
        help: () => import('./config').then((i) => i.inspectConfigPluginsHelp),
        unstable: true,
      },
    },
  },
  // `dev` is a group with a default action rather than a top-level command, so `@expo/agent-cli dev` runs
  // the plan engine exactly as before while `dev:stop` and `dev:logs` join it as entries. Promoting
  // a name this way costs nothing at the call site: a group with a `defaultAction` gives it every
  // option.
  dev: {
    summary: 'Get this app onto a device, and manage the dev server it runs against',
    defaultAction: 'run',
    actions: {
      run: {
        summary: 'Get this app onto a device: plan it, then run it',
        load: () => import('./dev').then((i) => i.agentCliDev),
        help: () => import('./dev').then((i) => i.devRunHelp),
      },
      stop: {
        summary: `Stop this project's dev server`,
        load: () => import('./dev/stop').then((i) => i.agentCliDevStop),
        help: () => import('./dev/stop').then((i) => i.devStopHelp),
      },
      logs: {
        summary: 'Read what the detached dev server printed',
        load: () => import('./dev/logs').then((i) => i.agentCliDevLogs),
        help: () => import('./dev/logs').then((i) => i.devLogsHelp),
      },
    },
  },
  doctor: {
    summary: 'Diagnose the project with expo-doctor',
    defaultAction: 'check',
    actions: {
      check: {
        summary: 'Run expo-doctor and normalize its report',
        load: () => import('./doctor').then((i) => i.agentCliDoctorCheck),
        help: () => import('./doctor').then((i) => i.doctorCheckHelp),
      },
    },
  },
  runtime: {
    summary: `Read and drive the running app over the dev server's debugger connection`,
    actions: {
      eval: {
        summary: 'Evaluate JavaScript in the running app',
        load: withAction('eval', () => import('./runtime').then((i) => i.agentCliRuntime)),
        help: () => import('./runtime').then((i) => i.runtimeEvalHelp),
      },
      errors: {
        summary: 'Collect runtime errors over a time window',
        load: withAction('errors', () => import('./runtime').then((i) => i.agentCliRuntime)),
        help: () => import('./runtime').then((i) => i.runtimeErrorsHelp),
      },
      // Interaction commands (llp/0018). Each takes different options and has its own `--help`.
      tree: {
        summary: 'What is on screen, ready for a tap',
        load: () => import('./runtime/interact/tree').then((i) => i.agentCliRuntimeTree),
        help: () => import('./runtime/interact/tree').then((i) => i.runtimeTreeHelp),
      },
      tap: {
        summary: 'Tap the element carrying a testID',
        load: () => import('./runtime/interact/tap').then((i) => i.agentCliRuntimeTap),
        help: () => import('./runtime/interact/tap').then((i) => i.runtimeTapHelp),
      },
      type: {
        summary: 'Type into the input with a testID',
        load: () => import('./runtime/interact/type').then((i) => i.agentCliRuntimeType),
        help: () => import('./runtime/interact/type').then((i) => i.runtimeTypeHelp),
      },
      // Two actions with modules of their own, like `dev:stop`: they drive the app rather than
      // read it, so they take different options and print different reports, and folding them
      // into the shared `runtime` module would give one `--help` block three subjects.
      reload: {
        summary: 'Reload the app onto the code on disk now',
        load: () => import('./runtime/reload').then((i) => i.agentCliReload),
        help: () => import('./runtime/reload').then((i) => i.runtimeReloadHelp),
      },
      stop: {
        summary: 'Stop the app on the device it runs on',
        load: () => import('./runtime/stop').then((i) => i.agentCliRuntimeStop),
        help: () => import('./runtime/stop').then((i) => i.runtimeStopHelp),
      },
    },
  },
  skills: {
    summary: 'Link agent skills from installed npm packages',
    defaultAction: 'sync',
    actions: {
      sync: {
        summary: `Link the installed packages' skills`,
        load: withAction('sync', () => import('./skills').then((i) => i.agentCliSkills)),
        help: () => import('./skills').then((i) => i.skillsSyncHelp),
      },
      list: {
        summary: 'List the skills the installed packages ship',
        load: withAction('list', () => import('./skills').then((i) => i.agentCliSkills)),
        help: () => import('./skills').then((i) => i.skillsListHelp),
      },
      show: {
        summary: `Print the SKILL.md of a package`,
        load: withAction('show', () => import('./skills').then((i) => i.agentCliSkills)),
        help: () => import('./skills').then((i) => i.skillsShowHelp),
      },
      clean: {
        summary: 'Remove the managed skill links',
        load: withAction('clean', () => import('./skills').then((i) => i.agentCliSkills)),
        help: () => import('./skills').then((i) => i.skillsCleanHelp),
      },
    },
  },
};

/**
 * Other names for a command above, as `alias -> command`.
 *
 * These exist for parity: `expo add` is `expo install` under another name, so `@expo/agent-cli add` has to
 * be `@expo/agent-cli install` — the wrapper with the skill sync and the impact report — and not a bare
 * forward that quietly does less than the command it looks like. An alias resolves to its target's
 * name, so the event stream and the follow-ups only ever name the command that ran.
 *
 * An alias is documented in its target's `--help`, and it may also be listed in the top-level
 * sections where its absence would be a hole a reader trips on — `stop` sits under `start`
 * [confirmed, 2026-08-30] — with a summary that names whose name the work happens under.
 */
export const commandAliases: { [alias: string]: string } = {
  add: 'install',
  // `start` has a top-level name, so its counterpart answers to one too [confirmed,
  // 2026-08-30]. It stops the DEV SERVER: the ambiguity worth a sentence is `runtime:stop`,
  // which stops the app on the device, and `dev:stop`'s help says which is which.
  stop: 'dev:stop',
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
/**
 * The forwarded commands that act on the machine's session rather than on the project.
 *
 * A partition of {@link forwardedCommands}, not a separate surface. They read and write
 * `~/.expo/state.json`, which exists whether or not the current directory has an Expo app in it —
 * so unlike `prebuild` or `export`, "there is no project CLI here" is not a reason for them to
 * fail. `src/passthrough/auth.ts` is what they do instead.
 */
export const authCommands: string[] = ['login', 'logout', 'register', 'whoami'];

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
  // Auth. Forwarded like the rest, but what they act on is the machine rather than the project,
  // so they have a second CLI to fall back to — see `authCommands`.
  ...authCommands,
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
 * 1. **Options without an action are an error, not help.** `@expo/agent-cli <group> --json` used to print
 *    the group listing and exit 0, which an agent reads as "that worked" — a silent no-op is the
 *    one answer a driving agent cannot recover from. A group that declares a `defaultAction` is
 *    unaffected: there the options belong to that action, and it runs with them.
 * 2. **A group cannot capture the bare form of a forwarded `expo` command.** A group named after
 *    one — `config`, say — owns its colon forms (`config:doctor`) and nothing else: `@expo/agent-cli
 *    config` stays `expo config`, because the bare name means what the `expo` command means
 *    (llp/0006 naming rule). The space form is unavailable for such a group, so
 *    `@expo/agent-cli config doctor` forwards two arguments to `expo config` rather than resolving here.
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
    // `@expo/agent-cli <group> --help` is about the group, so it lists the actions instead of running one.
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

  const entry = topLevelCommands[command];
  if (entry) {
    return { kind: 'command', name: command, argv, load: entry.load };
  }

  const aliased = commandAliases[command];
  if (aliased) {
    // Re-resolve under the target's own name, so an alias may point at a group action
    // (`stop` -> `dev:stop`) as well as at a top-level command, and every downstream rule —
    // events, follow-ups, help — sees only the name that ran.
    return resolveCommand(aliased, argv);
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

/**
 * The one-line summary of one runnable name.
 *
 * The registry is the only place a summary is written. The top-level listing prints it without
 * loading a command module, and `src/help/format.ts` prints the same string at the head of that
 * command's `--help` — so the sentence that made a caller pick the command is the sentence they
 * read when they get there.
 */
export function commandSummary(name: string): string {
  // An alias listed in the help says whose name the work happens under, so a reader who later
  // sees `dev:stop` in a report knows it was this command [confirmed, 2026-08-30].
  const aliased = commandAliases[name];
  if (aliased) {
    return `${commandSummary(aliased)} (alias of ${aliased})`;
  }
  const [group, action] = name.split(':');
  if (action != null) {
    return commandGroups[group!]!.actions[action]!.summary;
  }
  const bare = commandGroups[name];
  if (bare?.defaultAction) {
    return bare.actions[bare.defaultAction]!.summary;
  }
  return topLevelCommands[name]!.summary;
}

/** One rung of the workflow map: a command line, and what running it gets you. */
export interface WorkflowRung {
  /** The command as a caller types it after `npx @expo/agent-cli`, e.g. `dev --detach`. */
  run: string;
  /** What it gets you, in the present tense. Short enough to sit in a column. */
  gets: string;
}

/** One step of the workflow, and the commands that do it. */
export interface WorkflowStep {
  /**
   * What the step **is**, as a plain phrase: `Check the project`, `Edit and reload`.
   *
   * @ref llp/0024-cli-ui.rfc.md §The workflow map
   * Not a label. The first version of this map read `orient · run · iterate · gate · ship · once`,
   * which is a vocabulary a reader has to be taught before the map means anything [confirmed —
   * 2026-08-28: "i'm not clear specifically what they mean"]. The rule the wording is held
   * to: **if a title needs a legend, it is the wrong title.**
   */
  title: string;
  rungs: WorkflowRung[];
}

/**
 * What to run, in order, as the top-level help and the `workflow` topic both state it.
 *
 * @ref llp/0024-cli-ui.rfc.md §The workflow map
 * The listing below says which commands exist. It cannot say which one to run first, and that is
 * the question an agent handed this CLI actually has [confirmed, 2026-08-28: "should find
 * help a way let agent to know the typical workflow"]. So this comes before the listing, and it is
 * five numbered steps because five is how many there are between an unopened project and a
 * released one.
 *
 * Every rung resolves against the registry — a unit test checks it — so the map cannot come to name
 * a command that has been renamed out from under it.
 */
export const workflow: WorkflowStep[] = [
  {
    title: 'Check the project',
    rungs: [{ run: 'status', gets: 'what this project is, and what to run next' }],
  },
  {
    title: 'Start the app',
    rungs: [
      { run: 'dev --detach', gets: 'start the dev server, keep this terminal' },
      { run: 'navigate /', gets: 'open a route in the app on a device' },
    ],
  },
  {
    title: 'Edit and reload',
    rungs: [
      { run: 'runtime:reload', gets: 'after your edit, run the code on disk' },
      { run: 'runtime:errors', gets: 'what the app threw, over a time window' },
      // `runtime:tree` earns its rung: the walk needed a testID before it could tap one, and a map
      // that names `runtime:tap <testID>` without saying where a testID comes from is a map that
      // sends the reader off to guess [found by the wave-34 naive-agent walk].
      { run: 'runtime:tree', gets: 'what is on screen, and its testIDs' },
      { run: 'runtime:tap <testID>', gets: 'tap it; --verify says what changed' },
    ],
  },
  {
    title: "Verify before you're done",
    rungs: [
      { run: 'smoke', gets: 'bundle, boot and error window, one exit code' },
      { run: 'typecheck', gets: 'the type errors neither of those can see' },
      { run: 'doctor', gets: 'what expo-doctor finds wrong with the setup' },
    ],
  },
  {
    // `Deploy` rather than `Release`: the step, the help group (`Deployment`) and the command
    // itself then share one word [confirmed, 2026-08-28].
    title: 'Deploy',
    rungs: [{ run: 'deploy', gets: 'publish the web app to EAS Hosting' }],
  },
];

/**
 * The commands run once per project rather than once per change.
 *
 * Kept out of {@link workflow} rather than added as a sixth step, because it is not one: a reader
 * following the numbers is following a sequence, and "create a project" does not come after
 * "release". It prints under the numbered steps, unnumbered.
 */
export const oneTimeSetup: WorkflowStep = {
  title: 'One-time setup',
  rungs: [
    { run: 'new <directory>', gets: 'create a project' },
    { run: 'install <package>', gets: 'add it at the version this SDK wants' },
    { run: 'agents:setup', gets: 'write AGENTS.md, link the agent skills' },
  ],
};

/** One section of the top-level listing: a job an agent has, and the commands that do it. */
export interface HelpSection {
  title: string;
  commands: string[];
  /**
   * Print the commands as one wrapped comma list instead of one line each.
   *
   * For the sections whose commands belong to another CLI: this registry has no summary to print
   * beside them, and eleven names each followed by nothing is a third of the screen saying nothing.
   */
  wrapped?: boolean;
  /** One line under the commands, for a section that needs it. */
  note?: string;
}

/**
 * The advertised surface, grouped by the job at hand rather than alphabetically: a flat list of
 * thirty names says nothing about which one to reach for. A unit test pins that every command in
 * the registry appears here, so a new command cannot ship undiscoverable.
 */
export const helpSections: HelpSection[] = [
  {
    title: 'Develop',
    commands: ['dev', 'dev:logs', 'dev:stop', 'start', 'stop', 'install', 'typecheck'],
    note: 'dev blocks this terminal; dev --detach does not, and dev:logs reads what it printed.',
  },
  {
    title: 'Understand the project',
    commands: ['status', 'doctor', ...actionNames('inspect')],
    note: 'Nothing here runs the project.',
  },
  { title: 'Debug a running app', commands: ['smoke', 'navigate', ...actionNames('runtime')] },
  { title: 'Create a project', commands: ['new'] },
  { title: 'Deployment', commands: ['deploy'] },
  { title: 'Agent setup', commands: [...actionNames('agents'), ...actionNames('skills')] },
  { title: 'Learn', commands: ['help'] },
  {
    title: 'Account',
    commands: authCommands,
    wrapped: true,
    // The long version of this — which of the two CLIs runs where, and that `whoami --json` is
    // answered here rather than forwarded — is in `src/passthrough/auth.ts`, next to the code that
    // decides it. A listing is for finding the command, not for its edge cases.
    note: 'No project needed: they act on the ~/.expo session the expo and eas CLIs share.',
  },
  {
    title: 'Expo CLI (fallback to npx expo <command>)',
    commands: forwardedCommands.filter((command) => !authCommands.includes(command)),
    wrapped: true,
  },
];

/** Width the help wraps a long command list at, so the Expo CLI section stays readable. */
const HELP_WIDTH = 80;

/** Column the one-line summaries start at, measured from the start of the command name. */
const SUMMARY_COLUMN = 24;

/** What an unstable command's line carries, and the sentence a section carrying one ends with. */
const EXPERIMENTAL_TAG = '[experimental]';
const EXPERIMENTAL_NOTE = 'experimental commands may change or vanish';

/**
 * Whether one runnable name is marked unstable.
 *
 * Reads the same two maps `resolveCommand` reads, so a command cannot be tagged in the help and
 * untagged in the registry. A bare group name answers for its default action, which is the command
 * that name runs; a group name with no default action runs nothing and is never tagged.
 */
export function isUnstableCommand(name: string): boolean {
  const [group, action] = name.split(':');
  if (action != null) {
    return commandGroups[group!]?.actions[action]?.unstable === true;
  }
  const entry = commandGroups[name];
  if (entry?.defaultAction) {
    return entry.actions[entry.defaultAction]?.unstable === true;
  }
  return topLevelCommands[name]?.unstable === true;
}

/** One command as a wrapped list prints it: the name, plus the tag when it has one. */
function helpName(command: string): string {
  return isUnstableCommand(command) ? `${command} ${EXPERIMENTAL_TAG}` : command;
}

/**
 * One line per command: the name in a column, then what it is for.
 *
 * The prose that used to sit under a section — three sentences about what `dev` blocks, five about
 * which CLI answers `whoami` — is gone from here. A listing answers "which command", and every
 * command's own `--help` answers the rest in the same shape (`src/help/format.ts`). A wall of prose
 * inside a list is the thing that made this screen unreadable [confirmed, 2026-08-28].
 */
function commandLines(commands: string[], indent: string): string {
  return commands
    .flatMap((command) => {
      const tag = isUnstableCommand(command) ? ` ${EXPERIMENTAL_TAG}` : '';
      const head = `${indent}${color.command(command.padEnd(SUMMARY_COLUMN))}`;
      const width = HELP_WIDTH - indent.length - SUMMARY_COLUMN;
      const wrapped = wrapText(`${commandSummary(command)}${tag}`, width);
      return wrapped.map((line, index) =>
        index === 0 ? `${head}${line}` : `${indent}${' '.repeat(SUMMARY_COLUMN)}${line}`
      );
    })
    .join('\n');
}

/** Break one sentence onto lines no longer than `width`, on spaces. */
function wrapText(text: string, width: number): string[] {
  const lines: string[] = [];
  for (const word of text.split(' ')) {
    const last = lines.length - 1;
    if (lines.length && `${lines[last]} ${word}`.length <= width) {
      lines[last] = `${lines[last]} ${word}`;
    } else {
      lines.push(word);
    }
  }
  return lines.length ? lines : [''];
}

/**
 * The rung column, sized to the longest rung anywhere in the workflow.
 *
 * One width across the numbered steps and the setup block, so the "what it gets you" column starts
 * in one place and the whole map reads as one table.
 */
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

/** What this CLI is for, in one line, at the head of the top-level help. */
export const CLI_SUMMARY = 'get an Expo app running on a device, change it, check it, and ship it';

/**
 * The `@expo/agent-cli --help` screen: the loop first, then every command by the job it does.
 *
 * @ref llp/0024-cli-ui.rfc.md §The workflow map
 * The order is the argument. A caller who does not know this CLI cannot use a listing — they do not
 * know which of thirty names comes first — so the loop is above it, and the on-ramp that teaches
 * the whole protocol is named twice: once under the map, and once at the foot of every command's
 * own help.
 */
export function formatTopLevelHelp(): string {
  const sections = helpSections
    .map(({ title, commands, note, wrapped }) =>
      [
        `    ${color.heading(title)}`,
        wrapped ? wrapCommands(commands.map(helpName), '      ') : commandLines(commands, '      '),
        note ? `      ${color.muted(note)}` : null,
        // One footnote per section that has any, rather than one at the bottom of the listing: a
        // reader who took in the Inspect block and stopped reading has still been told.
        commands.some(isUnstableCommand) ? `      ${color.muted(EXPERIMENTAL_NOTE)}` : null,
      ]
        .filter((line) => line != null)
        .join('\n')
    )
    .join('\n');

  return `
  ${color.command(`${PROGRAM_NAME}`)} — ${CLI_SUMMARY}

  ${color.heading('Usage')}
    ${color.muted('$')} ${PROGRAM_PREFIX} <command> [options]

  ${ON_RAMP_FOOTER}
    ${color.muted('what to run in order, the exit codes, and the --json contract')}

  ${color.heading('Commands')}
${sections}

  ${color.heading('Options')}
    --version, -v   Version number
    --help, -h      Usage info

  The options, examples and JSON keys of one command
    ${color.muted('$')} ${PROGRAM_PREFIX} status --help
`;
}

/** The `@expo/agent-cli <group>` listing: what the group is for, and the actions it has. */
export function formatGroupHelp(name: string): string {
  const group = commandGroups[name]!;
  // One column for the names, so the summaries line up whatever the longest action is called.
  const width = Math.max(...actionNames(name).map((action) => action.length)) + 3;
  const actions = actionNames(name)
    .map((action, index) => {
      const summary = Object.values(group.actions)[index]!.summary;
      const tag = isUnstableCommand(action) ? ` ${color.muted(EXPERIMENTAL_TAG)}` : '';
      return `    ${color.command(action.padEnd(width))}${summary}${tag}`;
    })
    .join('\n');
  const experimental = actionNames(name).some(isUnstableCommand)
    ? `\n\n    ${color.muted(EXPERIMENTAL_NOTE)}`
    : '';
  const bare = group.defaultAction
    ? `\n\n    ${color.command(`${PROGRAM_PREFIX} ${name}`)} runs ${color.command(`${name}:${group.defaultAction}`)}, whose options are below.`
    : '';
  // The example names an action the reader has *not* just been shown the options of: for a group
  // with a default action, `cli.ts` prints that action's own help right under this listing.
  const example =
    actionNames(name).find((action) => action !== `${name}:${group.defaultAction}`) ??
    actionNames(name)[0];

  return `
  ${color.command(name)} — ${group.summary}

  ${color.heading('Usage')}
    ${color.muted('$')} ${PROGRAM_PREFIX} ${name}:${color.muted('<action> [options]')}

  ${color.heading('Actions')}
${actions}${experimental}${bare}

  For the options of one action, run it with the ${color.heading('--help')} flag
    ${color.muted('$')} ${PROGRAM_PREFIX} ${example} --help

  ${ON_RAMP_FOOTER}
`;
}

/**
 * The error for a known group asked for an action it does not have. Printed under the group
 * listing, so the reader sees the alternatives and then what to do about it.
 */
export function unknownActionMessage(group: string, action: string): string {
  return (
    `"${action}" is not an action of "${PROGRAM_NAME} ${group}". ` +
    `The actions of the ${group} group are the ones listed above: ${actionNames(group).join(', ')}. ` +
    `Run one of those, or "${PROGRAM_PREFIX} ${group} --help" for what each of them does.`
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
    `"${PROGRAM_NAME} ${group} ${flags.join(' ')}" names no action, so nothing ran. ` +
    `The ${group} group has no default action: its options belong to one of its actions, not to the group itself, so there is nothing here for ${flags[0]} to apply to. ` +
    (bare
      ? `"${PROGRAM_NAME} ${group}" is not the command that starts one — that is "${bare}", which takes these options. `
      : '') +
    `Run one of ${actionNames(group).join(', ')} with those options, or "${PROGRAM_PREFIX} ${group} --help" for what each of them does.`
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
  return bare ? [bare, ...flags].join(' ') : `${PROGRAM_PREFIX} ${group} --help`;
}

/**
 * Every name this CLI resolves: its own commands, the canonical name of every group action, the
 * aliases, and the forwarded `expo` set. The candidate pool for a nearest-match suggestion.
 */
export function allCommandNames(): string[] {
  return [
    ...Object.keys(topLevelCommands),
    // The bare group name too: it is a name that resolves, whether to a default action or to the
    // listing, so it is a name a caller can be one letter away from.
    ...Object.keys(commandGroups).flatMap((group) => [group, ...actionNames(group)]),
    ...Object.keys(commandAliases),
    ...forwardedCommands,
  ];
}

/** How many names an unknown command is answered with. Three is a hint; ten is a second listing. */
const MAX_SUGGESTIONS = 3;

/**
 * Edits above which two names are simply different words rather than one of them mistyped.
 *
 * Scaled by length, because two edits in `dev` is a different command and two edits in
 * `inspect:config-plugins` is a typo.
 */
function maxEditsFor(name: string): number {
  return name.length <= 5 ? 1 : 2;
}

/**
 * The registry names closest to one that does not exist.
 *
 * Two rules, in order, because they answer two different mistakes:
 *
 * 1. **The action name on its own.** `@expo/agent-cli sync` is not a typo — it is a caller that knows what
 *    it wants and does not know which group owns it, and the answer is every group that has an
 *    action by that name: `skills:sync`. Exact, so it never guesses.
 * 2. **A small number of edits.** `@expo/agent-cli stauts` is the other mistake, and Levenshtein is what
 *    recognises it. Ordered by distance, then by the registry's own order, so the answer is stable.
 *
 * Pure and exported for the test table: the value of a suggestion is entirely in which names it
 * picks, and that is only checkable by pinning them.
 *
 * @ref llp/0006-agent-native-cli-surface.rfc.md §Errors are prompts
 */
export function suggestCommandNames(command: string): string[] {
  const query = command.toLowerCase();
  const names = allCommandNames();

  // Rule 1: `<group>:<action>` whose action is exactly the name that was typed.
  const suffixMatches = names.filter((name) => name.slice(name.indexOf(':') + 1) === query);

  // Rule 2: the rest, near enough to be a mistyping of one of them.
  const nearMatches = names
    .filter((name) => !suffixMatches.includes(name))
    .map((name) => ({ name, distance: editDistance(query, name.toLowerCase()) }))
    .filter(({ name, distance }) => distance <= maxEditsFor(name))
    .sort((a, b) => a.distance - b.distance)
    .map(({ name }) => name);

  return [...suffixMatches, ...nearMatches].slice(0, MAX_SUGGESTIONS);
}

/** Levenshtein distance, one row of the matrix at a time. */
function editDistance(a: string, b: string): number {
  if (a === b) {
    return 0;
  }
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(
        previous[j]! + 1,
        row[j - 1]! + 1,
        previous[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    previous = row;
  }
  return previous[b.length]!;
}

/**
 * A capability a caller reaches for that this CLI does not have, and what does the job instead.
 *
 * The nearest-match rules above answer a *typo*; this table answers a *wrong assumption*, which
 * they cannot: `@expo/agent-cli logs` is spelled correctly, is nothing like any name in the registry, and
 * so is answered with "is in none of them" and a link to the full listing — leaving the reader to
 * work out from thirty names whether a log command exists at all. Saying that it does not, and
 * naming the two commands that answer what a log is read for, is one hop instead of three.
 *
 * Only for names whose absence is worth stating. A name nobody reaches for does not belong here.
 *
 * @ref llp/0006-agent-native-cli-surface.rfc.md §Errors are prompts
 */
const absentCapabilities: {
  [name: string]: { absent: string; instead: string; suggestedCommand: string };
} = {
  // `dev:logs` exists now, so the bare name is a caller one hop away from it rather than one
  // reaching for a capability this CLI does not have. The other two commands stay in the answer:
  // a log is read for three different questions, and only one of them is "what did it print".
  // `@expo/agent-cli build --platform ios` is a real command of a real CLI aimed at the wrong one. It used
  // to be answered by a `build` group with a `bareNameCommand` (llp/0010 §Registry rules (c)); the
  // v1 narrowing left that group with nothing in it — `build:wait` deferred, `build:explain` renamed
  // to `inspect:build-log` — so the answer moved here, where a name this CLI does not have belongs.
  build: {
    absent: `starting a build is the EAS CLI's job, not this one's`,
    instead: `Run "npx eas build" with the flags you meant to pass here — this CLI wraps no build verb, and never did. What it has is "${PROGRAM_PREFIX} inspect:build-log", which reads the log a finished build left behind and says what failed in it.`,
    suggestedCommand: 'npx eas build',
  },
  logs: {
    absent: `the log this CLI keeps is the dev server's, and it is "${PROGRAM_PREFIX} dev:logs"`,
    instead: `That reads what a dev server started with "${PROGRAM_PREFIX} dev --detach" has printed. For the two questions a log is more often opened for: "${PROGRAM_PREFIX} smoke" says whether the bundler finished, whether this project compiles and whether the app came up, and "${PROGRAM_PREFIX} runtime:errors" collects what the running app threw over a time window.`,
    suggestedCommand: `${PROGRAM_PREFIX} dev:logs`,
  },
};
// The singular is the same mistake, and the same answer.
absentCapabilities.log = absentCapabilities.logs!;

// @ref llp/0024-cli-ui.rfc.md §The on-ramp
// The spellings of the on-ramp that are not the on-ramp, and there are three kinds.
//
// **The colon form** is the first thing an agent that has learned this CLI's naming convention
// types [found by the wave-34 naive-agent walk]: `help` is a top-level command with a positional
// topic rather than a group, so `help:workflow` is in none of the three maps. **The bare word** is
// a caller who read the topic's name and tried it as a verb. **The old name** is `how-to`, which
// this topic was called for one unpublished day; anybody who read it then is one hop from the line
// that works, which is the whole job of this table.
//
// Edit distance cannot reach any of them — `workflow` is nine edits from every name in the
// registry — so the table is the only thing that can answer.
const onRampRecovery = {
  absent: `the on-ramp is a topic you ask "help" for by name`,
  instead: `Run "${ON_RAMP_POINTER}". "help" takes a positional topic — not a colon action, and not a flag — and anything that is not a topic is read as a command name, so "${PROGRAM_PREFIX} help <command>" prints that command's own help.`,
  suggestedCommand: ON_RAMP_POINTER,
};
for (const spelling of [
  `help:${ON_RAMP_TOPIC}`,
  ON_RAMP_TOPIC,
  'help:how-to',
  'how-to',
  '--how-to',
]) {
  absentCapabilities[spelling] = onRampRecovery;
}

/** The error for a name in none of the three maps. */
export function unknownCommandMessage(command: string): string {
  const absent = absentCapabilities[command.toLowerCase()];
  if (absent) {
    return (
      `"${PROGRAM_NAME} ${command}" is not a command, and ${absent.absent}. ` +
      `${absent.instead} ` +
      `Run "${PROGRAM_PREFIX} --help" for the whole list.`
    );
  }

  const suggestions = suggestCommandNames(command);
  // The closest names come before the "run --help" fallback: a caller that typed `wait` wants
  // `dev:logs`, not a listing of thirty commands to find it in again.
  const didYouMean = suggestions.length
    ? `The closest ${suggestions.length === 1 ? 'name is' : 'names are'} ${suggestions
        .map((name) => `"${PROGRAM_PREFIX} ${name}"`)
        .join(', ')}. `
    : '';
  return (
    `"${PROGRAM_NAME} ${command}" is not a command. ` +
    `${PROGRAM_NAME} runs its own commands, the actions of its command groups (${Object.keys(
      commandGroups
    ).join(
      ', '
    )}), and a fixed set of ${forwardedCommands.length} expo commands it forwards; "${command}" is in none of them, so neither CLI has it. ` +
    didYouMean +
    `Run "${PROGRAM_PREFIX} --help" for the whole list.`
  );
}

/**
 * The command to put on the `Try:` line of an {@link unknownCommandMessage}.
 *
 * One close name is a recovery an agent can run; several are a choice it has to make, and the
 * message above already lists them, so the last line stays the full listing.
 */
export function unknownCommandSuggestion(command: string): string {
  const absent = absentCapabilities[command.toLowerCase()];
  if (absent) {
    return absent.suggestedCommand;
  }

  const suggestions = suggestCommandNames(command);
  return suggestions.length === 1
    ? `${PROGRAM_PREFIX} ${suggestions[0]} --help`
    : `${PROGRAM_PREFIX} --help`;
}
