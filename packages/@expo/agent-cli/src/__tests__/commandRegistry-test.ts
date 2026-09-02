import {
  commandAliases,
  commandGroups,
  flagsWithoutActionMessage,
  flagsWithoutActionSuggestion,
  forwardedCommands,
  formatGroupHelp,
  formatTopLevelHelp,
  commandSummary,
  helpSections,
  isUnstableCommand,
  resolveCommand,
  suggestCommandNames,
  topLevelCommands,
  unknownCommandMessage,
  unknownCommandSuggestion,
  oneTimeSetup,
  withAction,
  workflow,
} from '../commandRegistry';
import { ON_RAMP_POINTER } from '../help/onRamp';
import type { CommandHelp } from '../help/types';
import type { Command } from '../types';

/**
 * Register a group for the length of one test, and put the registry back afterwards.
 *
 * The registry is data, so a resolution rule can be proved against a group that exists for three
 * lines rather than only against the real ones. Restoring rather than deleting matters: a name used
 * here may also be a real group (`config` is), and taking it out would leave every later test in
 * this file running against a registry with a command missing.
 */
/**
 * A help spec for a group that exists for the length of one test.
 *
 * The registry requires one on every action (llp/0024), and the resolution rules these tests are
 * about never load it — so it is the smallest object that type-checks, not a second template to
 * keep in step. `src/help/__tests__/template-test.ts` is what checks the real ones.
 */
function syntheticHelp(command: string): CommandHelp {
  return {
    command,
    usage: `npx @expo/agent-cli ${command}`,
    options: ['-h, --help   Usage info'],
    examples: [
      { run: `npx @expo/agent-cli ${command}`, gets: 'nothing; this command exists for one test' },
      { run: `npx @expo/agent-cli ${command} --help`, gets: 'this block' },
    ],
    next: ['status'],
  };
}

function withGroup(name: string, group: (typeof commandGroups)[string], test: () => void): void {
  const previous = commandGroups[name];
  commandGroups[name] = group;
  try {
    test();
  } finally {
    if (previous) {
      commandGroups[name] = previous;
    } else {
      delete commandGroups[name];
    }
  }
}

describe(resolveCommand, () => {
  it('resolves a top-level command, keeping the rest of the arguments', () => {
    expect(resolveCommand('status', ['--json'])).toEqual({
      kind: 'command',
      name: 'status',
      argv: ['--json'],
      load: expect.any(Function),
    });
  });

  // `dev` became a group so that `dev:stop` and `dev:logs` could join it as entries. The bare name
  // still runs the plan engine with every option it was given, which is what makes the promotion
  // invisible.
  describe('the dev group', () => {
    it('runs the plan engine for the bare name, with its options', () => {
      expect(resolveCommand('dev', ['--plan', '--json'])).toMatchObject({
        kind: 'command',
        name: 'dev:run',
        argv: ['--plan', '--json'],
      });
      expect(resolveCommand('dev', [])).toMatchObject({ kind: 'command', name: 'dev:run' });
    });

    it('resolves an action in both spellings', () => {
      expect(resolveCommand('dev:stop', ['--force'])).toMatchObject({
        kind: 'command',
        name: 'dev:stop',
        argv: ['--force'],
      });
      expect(resolveCommand('dev', ['stop', '--force'])).toMatchObject({
        kind: 'command',
        name: 'dev:stop',
        argv: ['--force'],
      });
    });

    // `dev` is this CLI's own verb rather than an `expo` command, so llp/0010 rule (b) does not
    // apply and the space form is available.
    it('is not a forwarded expo command', () => {
      expect(forwardedCommands).not.toContain('dev');
    });
  });

  it('resolves the colon form of a grouped command', () => {
    expect(resolveCommand('runtime:eval', ['globalThis.__DEV__'])).toMatchObject({
      kind: 'command',
      name: 'runtime:eval',
      argv: ['globalThis.__DEV__'],
    });
  });

  it('resolves the space form to the same command as the colon form', () => {
    expect(resolveCommand('runtime', ['eval', 'globalThis.__DEV__'])).toMatchObject({
      kind: 'command',
      name: 'runtime:eval',
      argv: ['globalThis.__DEV__'],
    });
  });

  it('resolves the space form of every action of every group', () => {
    for (const [group, { actions }] of Object.entries(commandGroups)) {
      // Except under a forwarded `expo` name, where the bare form is that command and the space
      // form is that command with an argument (llp/0010 §Registry rules, rule b).
      if (forwardedCommands.includes(group)) {
        continue;
      }
      for (const action of Object.keys(actions)) {
        expect(resolveCommand(group, [action])).toMatchObject({
          kind: 'command',
          name: `${group}:${action}`,
          argv: [],
        });
      }
    }
  });

  it('prints the group help for a group with no default action', () => {
    expect(resolveCommand('runtime', [])).toEqual({
      kind: 'group-help',
      group: 'runtime',
    });
    expect(resolveCommand('agents', [])).toEqual({
      kind: 'group-help',
      group: 'agents',
    });
  });

  it('prints the group help for a group asked for help', () => {
    expect(resolveCommand('skills', ['--help'])).toEqual({
      kind: 'group-help',
      group: 'skills',
    });
    expect(resolveCommand('doctor', ['-h'])).toEqual({
      kind: 'group-help',
      group: 'doctor',
    });
  });

  it('runs the default action of a bare group, with its flags', () => {
    expect(resolveCommand('skills', ['--agent', 'claude-code'])).toMatchObject({
      kind: 'command',
      name: 'skills:sync',
      argv: ['--agent', 'claude-code'],
    });
    expect(resolveCommand('doctor', ['--json'])).toMatchObject({
      kind: 'command',
      name: 'doctor:check',
      argv: ['--json'],
    });
  });

  // A silent group listing that exits 0 tells a driving agent its command worked, and it then
  // waits for output that is never coming (llp/0010 §Registry rules).
  it('fails on options with no action, for a group with no default action', () => {
    expect(resolveCommand('runtime', ['--json'])).toEqual({
      kind: 'flags-without-action',
      group: 'runtime',
      flags: ['--json'],
    });
    expect(resolveCommand('agents', ['--agent', 'claude-code'])).toEqual({
      kind: 'flags-without-action',
      group: 'agents',
      flags: ['--agent', 'claude-code'],
    });
  });

  // The options of such a group belong to its default action, so they run rather than fail.
  it('gives the options of a group with a default action to that action', () => {
    expect(resolveCommand('skills', ['--json'])).toMatchObject({
      kind: 'command',
      name: 'skills:sync',
      argv: ['--json'],
    });
    expect(resolveCommand('doctor', ['--json', '--no-followups'])).toMatchObject({
      kind: 'command',
      name: 'doctor:check',
      argv: ['--json', '--no-followups'],
    });
  });

  it('still lists the actions for a bare group, and for one asked for help', () => {
    expect(resolveCommand('runtime', [])).toEqual({
      kind: 'group-help',
      group: 'runtime',
    });
    expect(resolveCommand('runtime', ['--help'])).toEqual({
      kind: 'group-help',
      group: 'runtime',
    });
    expect(resolveCommand('runtime', ['-h', '--json'])).toEqual({
      kind: 'group-help',
      group: 'runtime',
    });
  });

  it('reports an unknown action of a known group, in both forms', () => {
    expect(resolveCommand('skills:nope', [])).toEqual({
      kind: 'unknown-action',
      group: 'skills',
      action: 'nope',
    });
    expect(resolveCommand('skills', ['nope'])).toEqual({
      kind: 'unknown-action',
      group: 'skills',
      action: 'nope',
    });
  });

  it('forwards every command of the fixed expo set', () => {
    for (const command of forwardedCommands) {
      expect(resolveCommand(command, ['--clean'])).toEqual({
        kind: 'passthrough',
        command,
        argv: ['--clean'],
      });
    }
  });

  // `expo export:web` has a colon and is still an `expo` command, so membership in the forwarded
  // set decides — not the shape of the name.
  it('forwards a colon-named expo command that is in the set', () => {
    expect(resolveCommand('export:web', [])).toMatchObject({
      kind: 'passthrough',
      command: 'export:web',
    });
  });

  // A group may be named after a forwarded `expo` command: `config` is one of both surfaces. The
  // bare name means what the `expo` command means, and the group owns only its colon forms
  // (llp/0010 §Registry rules).
  describe('a group named after a forwarded expo command', () => {
    const group = {
      summary: 'Synthetic group for the forwarded-name rule',
      actions: {
        doctor: {
          summary: 'Synthetic action',
          load: async () => (() => {}) as Command,
          help: async () => syntheticHelp('config:doctor'),
        },
      },
    };

    it('keeps the bare name forwarded to expo', () => {
      withGroup('config', group, () => {
        expect(resolveCommand('config', ['--type', 'public'])).toEqual({
          kind: 'passthrough',
          command: 'config',
          argv: ['--type', 'public'],
        });
        expect(resolveCommand('config', [])).toEqual({
          kind: 'passthrough',
          command: 'config',
          argv: [],
        });
      });
    });

    it('owns its colon forms', () => {
      withGroup('config', group, () => {
        expect(resolveCommand('config:doctor', ['--json'])).toMatchObject({
          kind: 'command',
          name: 'config:doctor',
          argv: ['--json'],
        });
        expect(resolveCommand('config:nope', [])).toEqual({
          kind: 'unknown-action',
          group: 'config',
          action: 'nope',
        });
      });
    });

    // The space form is the bare form with an argument, and the bare form is `expo config`.
    it('forwards the space form instead of resolving it', () => {
      withGroup('config', group, () => {
        expect(resolveCommand('config', ['doctor'])).toEqual({
          kind: 'passthrough',
          command: 'config',
          argv: ['doctor'],
        });
      });
    });

    it('leaves a group named after nothing forwarded alone', () => {
      expect(resolveCommand('runtime', ['eval', '1'])).toMatchObject({
        kind: 'command',
        name: 'runtime:eval',
      });
    });
  });

  // `config` used to be both a forwarded `expo` command and this CLI's group, which is the case
  // rule (b) was written for. The v1 narrowing moved that action to `inspect:config-plugins`
  // (llp/0016), so no group is named after a forwarded command any more — the rule is pinned by the
  // synthetic group above, and this block pins that the forward is now unconditional.
  describe('config, which is a forwarded expo command and nothing else', () => {
    it('forwards every form of it', () => {
      for (const argv of [['--type', 'introspect', '--json'], [], ['--help'], ['effective']]) {
        expect(resolveCommand('config', argv)).toEqual({
          kind: 'passthrough',
          command: 'config',
          argv,
        });
      }
    });

    it('is not a group of this CLI', () => {
      expect(commandGroups.config).toBeUndefined();
      expect(resolveCommand('config:why', [])).toEqual({
        kind: 'unknown-command',
        command: 'config:why',
      });
    });
  });

  describe('the inspect group', () => {
    it('owns both of its actions, in both spellings', () => {
      expect(resolveCommand('inspect:config-plugins', ['--json'])).toMatchObject({
        kind: 'command',
        name: 'inspect:config-plugins',
        argv: ['--json'],
      });
      expect(resolveCommand('inspect', ['build-log', '--stdin'])).toMatchObject({
        kind: 'command',
        name: 'inspect:build-log',
        argv: ['--stdin'],
      });
    });

    it('is not a forwarded expo command, so the space form is available', () => {
      expect(forwardedCommands).not.toContain('inspect');
    });
  });

  // `doctor` is free: `expo-doctor` is a separate bin and is in no `expo` command map, so the group
  // keeps both spellings and a default action.
  describe('the doctor group', () => {
    it('is not a forwarded expo command', () => {
      expect(forwardedCommands).not.toContain('doctor');
    });

    it('runs doctor:check for the bare name', () => {
      expect(resolveCommand('doctor', ['--json'])).toMatchObject({
        kind: 'command',
        name: 'doctor:check',
        argv: ['--json'],
      });
    });

    it('resolves both spellings of its action', () => {
      expect(resolveCommand('doctor:check', [])).toMatchObject({
        kind: 'command',
        name: 'doctor:check',
      });
      expect(resolveCommand('doctor', ['check'])).toMatchObject({
        kind: 'command',
        name: 'doctor:check',
        argv: [],
      });
    });
  });

  // `expo add` is `expo install`, so `@expo/agent-cli add` is `@expo/agent-cli install` — the wrapper with the
  // skill sync and the impact report, not a bare forward.
  it('resolves an alias to the command it names', () => {
    expect(resolveCommand('add', ['expo-camera'])).toEqual({
      kind: 'command',
      name: 'install',
      argv: ['expo-camera'],
      load: topLevelCommands.install!.load,
    });
    expect(forwardedCommands).not.toContain('add');
  });

  it('names every alias target, and nothing else', () => {
    for (const [alias, target] of Object.entries(commandAliases)) {
      // A target may be a top-level command or a group action; either way it must resolve to a
      // real command, and the alias itself may claim no name of its own anywhere.
      expect(resolveCommand(target, [])).toMatchObject({ kind: 'command' });
      expect(topLevelCommands[alias]).toBeUndefined();
      expect(forwardedCommands).not.toContain(alias);
      expect(commandGroups[alias]).toBeUndefined();
    }
  });

  // `start` has a top-level name, so its counterpart answers to one too [confirmed,
  // 2026-08-30]. The alias resolves to the dev server's stop, not the app's.
  it('resolves stop to dev:stop, with the caller’s own flags', () => {
    expect(resolveCommand('stop', ['--force', '--json'])).toMatchObject({
      kind: 'command',
      name: 'dev:stop',
      argv: ['--force', '--json'],
    });
  });

  // `context` was merged into `status --json`, which carries the whole probe.
  it('has no context command', () => {
    expect(resolveCommand('context', ['--json'])).toEqual({
      kind: 'unknown-command',
      command: 'context',
    });
  });

  it('fails on a command in no map, instead of forwarding it', () => {
    expect(resolveCommand('totally-unknown', ['--clean'])).toEqual({
      kind: 'unknown-command',
      command: 'totally-unknown',
    });
    expect(resolveCommand('bogus:thing', [])).toEqual({
      kind: 'unknown-command',
      command: 'bogus:thing',
    });
  });

  it('never forwards an action of a group it owns', () => {
    expect(resolveCommand('runtime:nope', [])).toEqual({
      kind: 'unknown-action',
      group: 'runtime',
      action: 'nope',
    });
  });

  // `start` and `install` are `expo` commands this CLI wraps, so they must resolve to the wrapper
  // and never to a bare forward.
  it('keeps the expo commands it wraps out of the forwarded set', () => {
    expect(forwardedCommands).not.toContain('start');
    expect(forwardedCommands).not.toContain('install');
    expect(resolveCommand('start', [])).toMatchObject({
      kind: 'command',
      name: 'start',
    });
    expect(resolveCommand('install', [])).toMatchObject({
      kind: 'command',
      name: 'install',
    });
  });

  // A *runnable* name of this CLI is never also a forwarded one, because then one invocation would
  // have two answers. A group *name* may collide, and rule (b) is what decides it: the bare form
  // forwards and only the colon forms are this CLI's, so `config` is a group name and never a
  // command an argv resolves to.
  it('names nothing runnable twice across the three maps', () => {
    const own = [
      ...Object.keys(topLevelCommands),
      ...Object.entries(commandGroups).flatMap(([group, { actions }]) =>
        Object.keys(actions).map((action) => `${group}:${action}`)
      ),
    ];

    for (const command of forwardedCommands) {
      expect(own).not.toContain(command);
    }
    expect(forwardedCommands).toHaveLength(new Set(forwardedCommands).size);
  });

  it('resolves a group name that is also a forwarded command to the forward', () => {
    for (const group of Object.keys(commandGroups)) {
      if (forwardedCommands.includes(group)) {
        expect(resolveCommand(group, [])).toEqual({
          kind: 'passthrough',
          command: group,
          argv: [],
        });
      }
    }
  });

  it('loads every registered command', async () => {
    const loaders = [
      ...Object.entries(topLevelCommands).map(
        ([name, { load }]) => [name, load] as [string, () => Promise<Command>]
      ),
      ...Object.entries(commandGroups).flatMap(([group, { actions }]) =>
        Object.entries(actions).map(
          ([action, { load }]) => [`${group}:${action}`, load] as [string, () => Promise<Command>]
        )
      ),
    ];

    for (const [name, load] of loaders) {
      expect(typeof (await load())).toBe(`function`);
      expect(name).toBeTruthy();
    }
  });
});

describe(withAction, () => {
  it('hands the action back to the command as its first argument', async () => {
    let seen: string[] | undefined;
    const load = withAction('eval', async () => {
      return ((argv) => {
        seen = argv;
      }) as Command;
    });

    (await load())(['globalThis.__DEV__']);

    expect(seen).toEqual(['eval', 'globalThis.__DEV__']);
  });

  it('passes the action alone when the command got no arguments', async () => {
    let seen: string[] | undefined;
    const load = withAction('sync', async () => {
      return ((argv) => {
        seen = argv;
      }) as Command;
    });

    (await load())();

    expect(seen).toEqual(['sync']);
  });
});

// @ref llp/0016-v1-scope.rfc.md §Experimental is per command
// The mark is a claim about one command, so the set of commands carrying it is the assertable
// half of it. Wave 36 graduated five of the six the narrowing marked, against the record each one
// had by then; this list is what a sixth graduation, or a seventh mark, has to come here to change.
describe(isUnstableCommand, () => {
  // The canonical names, because that is what the help prints and what `isUnstableCommand` reads.
  const marked = [
    ...Object.keys(topLevelCommands),
    ...Object.entries(commandGroups).flatMap(([group, { actions }]) =>
      Object.keys(actions).map((action) => `${group}:${action}`)
    ),
  ].filter(isUnstableCommand);

  it('is on inspect:config-plugins and on nothing else', () => {
    expect(marked).toEqual(['inspect:config-plugins']);
  });

  it('answers for the colon form, which is what the help prints', () => {
    expect(isUnstableCommand('inspect:config-plugins')).toBe(true);
    expect(isUnstableCommand('inspect:build-log')).toBe(false);
    expect(isUnstableCommand('smoke')).toBe(false);
    expect(isUnstableCommand('runtime:tree')).toBe(false);
    expect(isUnstableCommand('runtime:tap')).toBe(false);
    expect(isUnstableCommand('runtime:type')).toBe(false);
  });
});

describe(formatGroupHelp, () => {
  // One marked action beside one that graduated is the case the per-command rule was written for:
  // the tag is on the line it is about, and the footnote is under the section that has it.
  it('tags only the action that carries the mark', () => {
    const help = formatGroupHelp('inspect');

    expect(help).toMatch(/config-plugins.*\[experimental\]/);
    expect(help).not.toMatch(/build-log.*\[experimental\]/);
    expect(help).toContain('experimental commands may change or vanish');
  });

  it('prints no footnote for a group whose actions have all graduated', () => {
    const help = formatGroupHelp('runtime');

    expect(help).not.toContain('[experimental]');
    expect(help).not.toContain('experimental commands may change or vanish');
  });

  it('lists every action of the group in its canonical colon form', () => {
    const help = formatGroupHelp('runtime');

    expect(help).toContain('runtime:eval');
    expect(help).toContain('runtime:errors');
    expect(help).toContain('runtime:reload');
    expect(help).toContain('Evaluate JavaScript in the running app');
  });

  it('names the command a bare group runs', () => {
    expect(formatGroupHelp('skills')).toContain('npx @expo/agent-cli skills');
    expect(formatGroupHelp('skills')).toContain('skills:sync');
  });
});

// `@expo/agent-cli build --platform ios` is the worst thing a group named after another CLI's verb could
// do: `build` is a real verb of a real CLI, and printing a listing and exiting 0 would tell a
// driving agent it had started a build (llp/0010 §Registry rules).
describe('a group whose name is another CLI’s verb', () => {
  const group = {
    summary: 'Synthetic group named after another CLI’s verb',
    bareNameCommand: 'npx eas build',
    actions: {
      explain: {
        summary: 'Synthetic action',
        load: async () => (() => {}) as Command,
        help: async () => syntheticHelp('build:explain'),
      },
    },
  };

  it('fails on the bare name with options, instead of listing its actions', () => {
    withGroup('build', group, () => {
      expect(resolveCommand('build', ['--platform', 'ios'])).toEqual({
        kind: 'flags-without-action',
        group: 'build',
        flags: ['--platform', 'ios'],
      });
    });
  });

  it('still answers the bare name, and the help flag, with the listing', () => {
    withGroup('build', group, () => {
      expect(resolveCommand('build', [])).toEqual({ kind: 'group-help', group: 'build' });
      expect(resolveCommand('build', ['--help'])).toEqual({ kind: 'group-help', group: 'build' });
    });
  });

  it('names the command the caller was reaching for, with their own flags', () => {
    withGroup('build', group, () => {
      const message = flagsWithoutActionMessage('build', ['--platform', 'ios']);

      expect(message).toContain('"@expo/agent-cli build --platform ios"');
      expect(message).toContain('"npx eas build"');
      expect(flagsWithoutActionSuggestion('build', ['--platform', 'ios'])).toBe(
        'npx eas build --platform ios'
      );
    });
  });
});

// The v1 narrowing emptied the real `build` group — `build:wait` deferred, `build:explain` renamed
// to `inspect:build-log` — so the bare verb is now a name this CLI does not have, and the answer
// comes from the absent-capability table instead of from a group listing (llp/0016).
describe('the build verb, which this CLI no longer groups anything under', () => {
  it('is in none of the three maps', () => {
    expect(commandGroups.build).toBeUndefined();
    expect(resolveCommand('build', ['--platform', 'ios'])).toEqual({
      kind: 'unknown-command',
      command: 'build',
    });
  });

  // @ref llp/0024-cli-ui.rfc.md §The on-ramp
  // Three wrong spellings of one right line, and none of them is a typo. `help:workflow` is the
  // colon convention applied to a command that takes a positional topic; `workflow` is the topic
  // name tried as a verb; `how-to` and `--how-to` are what this topic was called for one
  // unpublished day. Edit distance reaches none of them, so the absent-capability table is the only
  // thing that can answer.
  it('sends every near-miss spelling of the on-ramp to the one that works', () => {
    for (const typed of ['help:workflow', 'workflow', 'help:how-to', 'how-to', '--how-to']) {
      expect(unknownCommandMessage(typed)).toContain(ON_RAMP_POINTER);
      expect(unknownCommandSuggestion(typed)).toBe(ON_RAMP_POINTER);
    }
  });

  it('answers with the CLI that does start a build, and with the log reader that stayed', () => {
    const message = unknownCommandMessage('build');

    expect(message).toContain('npx eas build');
    expect(message).toContain('npx @expo/agent-cli inspect:build-log');
    expect(unknownCommandSuggestion('build')).toBe('npx eas build');
  });
});

describe(flagsWithoutActionMessage, () => {
  it('quotes the command back, and names the actions the options could belong to', () => {
    const message = flagsWithoutActionMessage('runtime', ['--json']);

    expect(message).toContain('"@expo/agent-cli runtime --json"');
    expect(message).toContain('no default action');
    expect(message).toContain('runtime:eval');
    expect(message).toContain('runtime:reload');
    expect(message).toContain('npx @expo/agent-cli runtime --help');
  });

  // Only a group that named another CLI's command has one to point at.
  it('sends a group without another CLI behind it to its own help', () => {
    expect(flagsWithoutActionSuggestion('runtime', ['--json'])).toBe(
      'npx @expo/agent-cli runtime --help'
    );
    expect(flagsWithoutActionMessage('runtime', ['--json'])).not.toContain('npx eas');
  });
});

describe(formatTopLevelHelp, () => {
  it('groups the commands into sections', () => {
    const help = formatTopLevelHelp();

    for (const section of helpSections) {
      expect(help).toContain(section.title);
      for (const command of section.commands) {
        expect(help).toContain(command);
      }
    }
  });

  it('names the forwarded expo commands and where they go', () => {
    const help = formatTopLevelHelp();

    expect(help).toContain('Expo CLI (fallback to npx expo <command>)');
    expect(help).toContain('Expo CLI (fallback to npx expo <command>)');
    for (const command of forwardedCommands) {
      expect(help).toContain(command);
    }
  });

  it('sections the commands by the job they do', () => {
    const help = formatTopLevelHelp();

    expect(help).toContain('Develop');
    expect(help).toContain('Understand the project');
    expect(help).toContain('Debug a running app');
    expect(help).toContain('Create a project');
    expect(help).toContain('Deployment');
    expect(help).toContain('Agent setup');
    expect(help).toContain('Learn');
  });

  // @ref llp/0024-cli-ui.rfc.md §The workflow map
  // The listing says which commands exist; only the map says which one to run first. That map
  // lives in `help workflow` alone [confirmed, 2026-08-28: "move this to help workflow"],
  // so the top-level screen carries the pointer, above the listing, and not the map itself.
  it('points at the on-ramp above the listing, and does not repeat the map', () => {
    const help = formatTopLevelHelp();

    expect(help).not.toContain('What to run, in order');
    expect(help).toContain(ON_RAMP_POINTER);
    expect(help.indexOf(ON_RAMP_POINTER)).toBeLessThan(help.indexOf('Commands'));
  });

  // @ref llp/0024-cli-ui.rfc.md §The workflow map
  // The rule the titles are held to: **if a title needs a legend, it is the wrong title.** That is
  // a judgment rather than a property, so the titles are pinned here — changing one is then a
  // deliberate act with this rule in front of the person doing it, which is the most a test can
  // offer. The first version read `orient · run · iterate · gate · ship · once`, which is a
  // vocabulary rather than an instruction [confirmed, 2026-08-28: "i'm not clear
  // specifically what they mean"].
  it('titles the steps with plain phrases rather than labels', () => {
    expect([...workflow, oneTimeSetup].map(({ title }) => title)).toEqual([
      'Check the project',
      'Start the app',
      'Edit and reload',
      "Verify before you're done",
      'Deploy',
      'One-time setup',
    ]);
  });

  // The property half of the same rule, which does not need updating when a title is reworded: a
  // title is a phrase in sentence case, and never one of the six words that failed.
  it('never goes back to the one-word labels', () => {
    const retired = ['orient', 'run', 'iterate', 'gate', 'ship', 'once'];
    for (const { title } of [...workflow, oneTimeSetup]) {
      expect(retired).not.toContain(title.toLowerCase());
      expect(title).toMatch(/^[A-Z][a-z]/);
      expect(title).not.toMatch(/[:_]/);
    }
  });

  // One line per command, so the screen is scannable: a summary long enough to wrap turns the
  // listing back into the wall of prose this replaced.
  it('gives every command a summary that fits on its line', () => {
    const width = 80 - '      '.length - 24;
    for (const { title, commands, wrapped } of helpSections) {
      if (wrapped) {
        continue;
      }
      for (const command of commands) {
        const tag = isUnstableCommand(command) ? ' [experimental]' : '';
        // The section and the command are in the assertion so a failure names which line wrapped.
        expect({ title, command, over: (commandSummary(command) + tag).length > width }).toEqual({
          title,
          command,
          over: false,
        });
      }
    }
  });
});

// @ref llp/0024-cli-ui.rfc.md §The workflow map
// The map is data, so a rename that leaves it behind is caught here rather than by a reader
// running a rung and being told the command does not exist.
describe('workflow', () => {
  it('names commands that all resolve', () => {
    for (const { rungs } of [...workflow, oneTimeSetup]) {
      for (const { run } of rungs) {
        const [command, ...rest] = run.split(' ');
        expect(resolveCommand(command!, rest).kind).toMatch(/^(command|passthrough)$/);
      }
    }
  });
});

// The sections are the whole advertised surface: a command missing from them is a command an agent
// reading `@expo/agent-cli --help` never learns about.
// llp/0006 naming rule: a capability only this CLI has gets a verb of its own, and a name shared
// with an `expo` command has to behave like that command. `typecheck` is the first, so it must not
// be in the forwarded set — `expo` has no command by that name to forward to.
describe('typecheck', () => {
  it('is a top-level command of this CLI, not a forwarded one', () => {
    expect(resolveCommand('typecheck', ['--json'])).toMatchObject({
      kind: 'command',
      name: 'typecheck',
      argv: ['--json'],
    });
    expect(forwardedCommands).not.toContain('typecheck');
  });
});

describe('helpSections', () => {
  it('names commands that all resolve to something runnable', () => {
    for (const { commands } of helpSections) {
      for (const command of commands) {
        const [token, ...rest] = command.split(' ');
        expect(resolveCommand(token!, rest).kind).toMatch(/^(command|passthrough)$/);
      }
    }
  });

  it('covers every registered command, and names none of them twice', () => {
    const advertised = helpSections.flatMap((section) => section.commands);
    expect(advertised).toHaveLength(new Set(advertised).size);

    for (const command of [...Object.keys(topLevelCommands), ...forwardedCommands]) {
      expect(advertised).toContain(command);
    }
    for (const [group, { actions, defaultAction }] of Object.entries(commandGroups)) {
      for (const action of Object.keys(actions)) {
        // A default action may be advertised as the bare group name instead, e.g. `doctor`.
        const names =
          action === defaultAction ? [`${group}:${action}`, group] : [`${group}:${action}`];
        expect(names.some((name) => advertised.includes(name))).toBe(true);
      }
    }
  });
});

// @ref llp/0006-agent-native-cli-surface.rfc.md §Errors are prompts
// A name that is in no map is answered with the names that are closest to it. The value of the
// feature is entirely in *which* names it picks, so the table pins them.
describe(suggestCommandNames, () => {
  it.each([
    // The action name on its own resolves now — `stop` is an alias of `dev:stop` — so this row
    // matters only for near-misses; the alias joins the list it used to be the question for.
    ['stop', ['dev:stop', 'runtime:stop', 'stop']],
    ['sync', ['skills:sync']],
    ['setup', ['agents:setup']],
    ['config-plugins', ['inspect:config-plugins']],
    ['build-log', ['inspect:build-log']],
    // A small number of edits away from a name that exists.
    ['stauts', ['status']],
    ['deploi', ['deploy']],
    ['isntall', ['install']],
    ['prebiuld', ['prebuild']],
    // The action-name rule: `logs` is the action of `dev:logs`, so a caller who knows what they
    // want and not which group owns it is answered exactly. `login` is two edits away and is never
    // offered — that would be a confident wrong guess.
    ['logs', ['dev:logs']],
    ['zzzzzzzz', []],
  ])('answers %p with %p', (command, expected) => {
    expect(suggestCommandNames(command)).toEqual(expected);
  });

  it('never answers with more than three names', () => {
    expect(suggestCommandNames('run').length).toBeLessThanOrEqual(3);
  });

  // A short name is held to one edit; a long one may be two away and still be the same word.
  it('scales the edit budget with the length of the name', () => {
    // Two names are one edit from `dew`, and both are offered: a tie is answered honestly.
    expect(suggestCommandNames('dew')).toEqual(['new', 'dev']);
    expect(suggestCommandNames('dxx')).toEqual([]);
  });
});

describe(unknownCommandMessage, () => {
  it('names the closest commands', () => {
    const message = unknownCommandMessage('stop');

    expect(message).toContain('"@expo/agent-cli stop" is not a command');
    expect(message).toContain('npx @expo/agent-cli dev:stop');
    expect(message).toContain('npx @expo/agent-cli runtime:stop');
  });

  it('says nothing about close names when there are none', () => {
    expect(unknownCommandMessage('zzzzzzzz')).not.toContain('closest');
  });

  // F11 leftover, now that `dev:logs` exists: the bare name is still not a command, and the answer
  // names the one that is — plus the two commands a log is more often opened for.
  it('names dev:logs and the two questions a log is opened for', () => {
    for (const name of ['logs', 'log', 'LOGS']) {
      const message = unknownCommandMessage(name);

      expect(message).toContain(`"@expo/agent-cli ${name}" is not a command`);
      expect(message).toContain('npx @expo/agent-cli dev:logs');
      expect(message).toContain('npx @expo/agent-cli smoke');
      expect(message).toContain('npx @expo/agent-cli runtime:errors');
    }
  });
});

describe(unknownCommandSuggestion, () => {
  it('recovers into the one close name', () => {
    expect(unknownCommandSuggestion('stauts')).toBe('npx @expo/agent-cli status --help');
  });

  it('falls back to the listing when the answer is a choice', () => {
    expect(unknownCommandSuggestion('stop')).toBe('npx @expo/agent-cli --help');
    expect(unknownCommandSuggestion('zzzzzzzz')).toBe('npx @expo/agent-cli --help');
  });

  it('recovers a missing capability into the command that answers it', () => {
    expect(unknownCommandSuggestion('logs')).toBe('npx @expo/agent-cli dev:logs');
  });
});
