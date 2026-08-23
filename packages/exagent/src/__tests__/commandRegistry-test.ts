import {
  commandAliases,
  commandGroups,
  flagsWithoutActionMessage,
  flagsWithoutActionSuggestion,
  forwardedCommands,
  formatGroupHelp,
  formatTopLevelHelp,
  helpSections,
  resolveCommand,
  topLevelCommands,
  withAction,
} from '../commandRegistry';
import type { Command } from '../types';

/**
 * Register a group for the length of one test, and take it out again.
 *
 * The registry is data, so a rule about a group that does not exist yet is proved with one that
 * exists for three lines — the alternative is waiting for the first real `config`-shaped group and
 * discovering the rule was never wired.
 */
function withGroup(name: string, group: (typeof commandGroups)[string], test: () => void): void {
  commandGroups[name] = group;
  try {
    test();
  } finally {
    delete commandGroups[name];
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

  // `dev` became a group so that `dev:wait` could join it as one entry. The bare name still runs
  // the plan engine with every option it was given, which is what makes the promotion invisible.
  describe('the dev group', () => {
    it('runs the plan engine for the bare name, with its options', () => {
      expect(resolveCommand('dev', ['--plan', '--json'])).toMatchObject({
        kind: 'command',
        name: 'dev:run',
        argv: ['--plan', '--json'],
      });
      expect(resolveCommand('dev', [])).toMatchObject({ kind: 'command', name: 'dev:run' });
    });

    it('resolves the readiness gate in both spellings', () => {
      expect(resolveCommand('dev:wait', ['--require-app'])).toMatchObject({
        kind: 'command',
        name: 'dev:wait',
        argv: ['--require-app'],
      });
      expect(resolveCommand('dev', ['wait', '--require-app'])).toMatchObject({
        kind: 'command',
        name: 'dev:wait',
        argv: ['--require-app'],
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
    expect(resolveCommand('runtime', [])).toEqual({ kind: 'group-help', group: 'runtime' });
    expect(resolveCommand('agents', [])).toEqual({ kind: 'group-help', group: 'agents' });
  });

  it('prints the group help for a group asked for help', () => {
    expect(resolveCommand('skills', ['--help'])).toEqual({ kind: 'group-help', group: 'skills' });
    expect(resolveCommand('checkpoint', ['-h'])).toEqual({
      kind: 'group-help',
      group: 'checkpoint',
    });
  });

  it('runs the default action of a bare group, with its flags', () => {
    expect(resolveCommand('skills', ['--agent', 'claude-code'])).toMatchObject({
      kind: 'command',
      name: 'skills:sync',
      argv: ['--agent', 'claude-code'],
    });
    expect(resolveCommand('checkpoint', ['--label', 'before the edit'])).toMatchObject({
      kind: 'command',
      name: 'checkpoint:create',
      argv: ['--label', 'before the edit'],
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
    expect(resolveCommand('checkpoint', ['--json', '--label', 'x'])).toMatchObject({
      kind: 'command',
      name: 'checkpoint:create',
      argv: ['--json', '--label', 'x'],
    });
  });

  it('still lists the actions for a bare group, and for one asked for help', () => {
    expect(resolveCommand('runtime', [])).toEqual({ kind: 'group-help', group: 'runtime' });
    expect(resolveCommand('runtime', ['--help'])).toEqual({ kind: 'group-help', group: 'runtime' });
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
      actions: { doctor: { summary: 'Synthetic action', load: async () => (() => {}) as Command } },
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

  // `expo add` is `expo install`, so `exagent add` is `exagent install` — the wrapper with the
  // skill sync and the impact report, not a bare forward.
  it('resolves an alias to the command it names', () => {
    expect(resolveCommand('add', ['expo-camera'])).toEqual({
      kind: 'command',
      name: 'install',
      argv: ['expo-camera'],
      load: topLevelCommands.install,
    });
    expect(forwardedCommands).not.toContain('add');
  });

  it('names every alias target, and nothing else', () => {
    for (const [alias, target] of Object.entries(commandAliases)) {
      expect(topLevelCommands[target]).toBeDefined();
      expect(topLevelCommands[alias]).toBeUndefined();
      expect(forwardedCommands).not.toContain(alias);
      expect(commandGroups[alias]).toBeUndefined();
    }
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
    expect(resolveCommand('start', [])).toMatchObject({ kind: 'command', name: 'start' });
    expect(resolveCommand('install', [])).toMatchObject({ kind: 'command', name: 'install' });
  });

  it('names nothing twice across the three maps', () => {
    const own = [
      ...Object.keys(topLevelCommands),
      ...Object.keys(commandGroups),
      ...Object.entries(commandGroups).flatMap(([group, { actions }]) =>
        Object.keys(actions).map((action) => `${group}:${action}`)
      ),
    ];

    for (const command of forwardedCommands) {
      expect(own).not.toContain(command);
    }
    expect(forwardedCommands).toHaveLength(new Set(forwardedCommands).size);
  });

  it('loads every registered command', async () => {
    const loaders = [
      ...Object.entries(topLevelCommands),
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

describe(formatGroupHelp, () => {
  it('lists every action of the group in its canonical colon form', () => {
    const help = formatGroupHelp('runtime');

    expect(help).toContain('runtime:eval');
    expect(help).toContain('runtime:errors');
    expect(help).toContain('runtime:network');
    expect(help).toContain('Evaluate JavaScript in the running app');
  });

  it('names the command a bare group runs', () => {
    expect(formatGroupHelp('skills')).toContain('npx exagent skills');
    expect(formatGroupHelp('skills')).toContain('skills:sync');
  });
});

// `exagent build --platform ios` is the worst thing a `build` group could do: `build` is a real
// verb of a real CLI, and printing a listing and exiting 0 would tell a driving agent it had
// started a build (llp/0010 §Registry rules).
describe('a group whose name is another CLI’s verb', () => {
  it('fails on the bare name with options, instead of listing its actions', () => {
    expect(resolveCommand('build', ['--platform', 'ios'])).toEqual({
      kind: 'flags-without-action',
      group: 'build',
      flags: ['--platform', 'ios'],
    });
  });

  it('still answers the bare name, and the help flag, with the listing', () => {
    expect(resolveCommand('build', [])).toEqual({ kind: 'group-help', group: 'build' });
    expect(resolveCommand('build', ['--help'])).toEqual({ kind: 'group-help', group: 'build' });
  });

  it('resolves its actions in both spellings', () => {
    expect(resolveCommand('build:wait', ['abc', '--json'])).toMatchObject({
      kind: 'command',
      name: 'build:wait',
      argv: ['abc', '--json'],
    });
    expect(resolveCommand('build', ['wait', 'abc'])).toMatchObject({
      kind: 'command',
      name: 'build:wait',
      argv: ['abc'],
    });
  });

  it('names the command the caller was reaching for, with their own flags', () => {
    const message = flagsWithoutActionMessage('build', ['--platform', 'ios']);

    expect(message).toContain('"exagent build --platform ios"');
    expect(message).toContain('"npx eas build"');
    expect(flagsWithoutActionSuggestion('build', ['--platform', 'ios'])).toBe(
      'npx eas build --platform ios'
    );
  });
});

describe(flagsWithoutActionMessage, () => {
  it('quotes the command back, and names the actions the options could belong to', () => {
    const message = flagsWithoutActionMessage('runtime', ['--json']);

    expect(message).toContain('"exagent runtime --json"');
    expect(message).toContain('no default action');
    expect(message).toContain('runtime:eval');
    expect(message).toContain('runtime:network');
    expect(message).toContain('npx exagent runtime --help');
  });

  // Only a group that named another CLI's command has one to point at.
  it('sends a group without another CLI behind it to its own help', () => {
    expect(flagsWithoutActionSuggestion('runtime', ['--json'])).toBe('npx exagent runtime --help');
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
    expect(help).toContain('Create');
    expect(help).toContain('Deployment');
    expect(help).toContain('Debug a running app');
    expect(help).toContain('Agent setup');
    expect(help).toContain('Checkpoints');
  });
});

// The sections are the whole advertised surface: a command missing from them is a command an agent
// reading `exagent --help` never learns about.
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
        // A default action may be advertised as the bare group name instead, e.g. `checkpoint`.
        const names =
          action === defaultAction ? [`${group}:${action}`, group] : [`${group}:${action}`];
        expect(names.some((name) => advertised.includes(name))).toBe(true);
      }
    }
  });
});
