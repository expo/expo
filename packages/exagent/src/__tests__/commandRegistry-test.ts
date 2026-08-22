import {
  commandGroups,
  formatGroupHelp,
  formatTopLevelHelp,
  helpSections,
  resolveCommand,
  topLevelCommands,
  withAction,
} from '../commandRegistry';
import type { Command } from '../types';

describe(resolveCommand, () => {
  it('resolves a top-level command, keeping the rest of the arguments', () => {
    expect(resolveCommand('dev', ['--plan', '--json'])).toEqual({
      kind: 'command',
      name: 'dev',
      argv: ['--plan', '--json'],
      load: expect.any(Function),
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

  it('never forwards a colon command to the expo CLI', () => {
    expect(resolveCommand('export:web', ['--clean'])).toEqual({
      kind: 'unknown-group',
      command: 'export:web',
      group: 'export',
    });
  });

  it('forwards a command it does not implement to the expo CLI', () => {
    expect(resolveCommand('prebuild', ['--clean'])).toEqual({
      kind: 'passthrough',
      command: 'prebuild',
      argv: ['--clean'],
    });
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

  it('names the forwarding rule', () => {
    expect(formatTopLevelHelp()).toContain('forwarded to expo <command>');
  });
});

// The sections are the whole advertised surface: a command missing from them is a command an agent
// reading `exagent --help` never learns about.
describe('helpSections', () => {
  it('names commands that all resolve', () => {
    for (const { commands } of helpSections) {
      for (const command of commands) {
        const [token, ...rest] = command.split(' ');
        expect(resolveCommand(token!, rest)).toMatchObject({ kind: 'command' });
      }
    }
  });

  it('covers every registered command, and names none of them twice', () => {
    const advertised = helpSections.flatMap((section) => section.commands);
    expect(advertised).toHaveLength(new Set(advertised).size);

    for (const command of Object.keys(topLevelCommands)) {
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
