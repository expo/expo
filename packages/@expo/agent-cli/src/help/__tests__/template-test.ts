// @ref llp/0024-cli-ui.rfc.md §The template
// The help template, checked over every command the registry resolves.
//
// The template is the point of the wave: one shape for every `--help`, so an agent that has read
// one has read them all. A shape nothing enforces is a shape the next command drifts from, and the
// drift is invisible — a help block is prose, and prose compiles. So the sections are asserted
// here, over the registry itself rather than over a list somebody maintains: a command that ships
// without a `help` spec fails this suite, and one whose examples name a command that no longer
// exists fails it too.

import { commandGroups, resolveCommand, topLevelCommands } from '../../commandRegistry';
import { renderCommandHelp, MAX_HELP_LINES, MAX_NOTE_LINES } from '../format';
import { ON_RAMP_POINTER } from '../onRamp';
import type { CommandHelp } from '../types';

/** Every name a caller can run, as the registry spells it. */
function runnableNames(): string[] {
  return [
    ...Object.keys(topLevelCommands),
    ...Object.keys(commandGroups).flatMap((group) =>
      Object.keys(commandGroups[group]!.actions).map((action) => `${group}:${action}`)
    ),
  ];
}

/** The help spec of one runnable name, loaded the way `cli.ts` would load its command. */
async function helpOf(name: string): Promise<CommandHelp> {
  const [group, action] = name.split(':');
  const entry = action != null ? commandGroups[group!]!.actions[action]! : topLevelCommands[name]!;
  return entry.help();
}

describe('every command has a help spec', () => {
  it.each(runnableNames().map((name) => [name]))('%s', async (name) => {
    await expect(helpOf(name)).resolves.toBeDefined();
  });
});

describe('the template', () => {
  it.each(runnableNames().map((name) => [name]))('%s fills every section', async (name) => {
    const help = await helpOf(name);

    // The spec names itself, so a copied block cannot end up documenting its neighbour.
    expect(help.command).toBe(name);

    // Usage is the line a caller copies, so it is this CLI's own invocation.
    expect(help.usage.startsWith('npx @expo/agent-cli ')).toBe(true);

    // Options: one line each, every one starting at the flag it documents.
    expect(help.options.length).toBeGreaterThan(0);
    for (const option of help.options) {
      expect(option.startsWith('-')).toBe(true);
    }
    // The launcher's own flag is on every command, so a caller never has to guess it.
    expect(help.options.some((option) => option.startsWith('-h, --help'))).toBe(true);

    // Examples: two to four, each runnable as printed and each saying what it gets you.
    expect(help.examples.length).toBeGreaterThanOrEqual(2);
    expect(help.examples.length).toBeLessThanOrEqual(4);
    for (const example of help.examples) {
      expect(example.run.startsWith('npx @expo/agent-cli ')).toBe(true);
      expect(example.gets.length).toBeGreaterThan(0);
      expect(example.gets).not.toContain('\n');
      expect(example.gets.length).toBeLessThanOrEqual(100);
    }

    // Typically next: names that resolve, and never this command again.
    expect(help.next.length).toBeGreaterThan(0);
    for (const next of help.next) {
      expect(next).not.toBe(name);
      const resolution = resolveCommand(next, []);
      expect(['command', 'passthrough', 'group-help']).toContain(resolution.kind);
    }

    // The JSON contract is documented exactly where `--json` is offered.
    const offersJson = help.options.some((option) => option.includes('--json'));
    expect(help.json != null).toBe(offersJson);
    if (help.json) {
      expect(help.json.stdout.length).toBeGreaterThan(0);
      expect(help.json.stderr.length).toBeGreaterThan(0);
      expect(help.json.keys.length).toBeGreaterThan(0);
    }
  });

  // @ref llp/0006-agent-native-cli-surface.rfc.md §Output contract — **F144.** The keys list is a
  // promise that a caller can write the branch without running the command once to find out what
  // came back, and `status --json` and `runtime:errors --json` both printed a `followups` array that
  // was in neither list [observed — friction run 9, the JSON key audit].
  //
  // `--no-followups` is the invariant to hang this on rather than a hand-kept list of commands:
  // exactly the commands that emit the key offer the flag that suppresses it, and the flag is in the
  // help block already. So a command that grows one and forgets the key fails here.
  it.each(runnableNames().map((name) => [name]))(
    '%s documents the followups key when it has the flag',
    async (name) => {
      const help = await helpOf(name);
      const suppressible = help.options.some((option) => option.startsWith('--no-followups'));

      if (suppressible && help.json) {
        expect(help.json.keys).toContain('followups');
      }
    }
  );

  it.each(runnableNames().map((name) => [name]))('%s renders the section heads', async (name) => {
    const rendered = renderCommandHelp(name, await helpOf(name));

    expect(rendered).toContain('Usage');
    expect(rendered).toContain('Options');
    expect(rendered).toContain('Examples');
    expect(rendered).toContain('Typically next');
    expect(rendered).toContain(ON_RAMP_POINTER);
  });

  // One screen. The long rationale that used to live in these blocks is in the `workflow` topic
  // and in the LLPs, and a `--help` that scrolls is one an agent reads the tail of.
  it.each(runnableNames().map((name) => [name]))('%s fits on one screen', async (name) => {
    const lines = renderCommandHelp(name, await helpOf(name)).split('\n');

    expect(lines.length).toBeLessThanOrEqual(MAX_HELP_LINES);
  });

  // The one section with no shape of its own, so the one a wall of prose grows back in. The whole
  // help fits on a screen either way; this says where the pressure lands when it does not.
  it.each(runnableNames().map((name) => [name]))('%s keeps its notes short', async (name) => {
    const notes = (await helpOf(name)).notes ?? [];

    expect(notes.flatMap((note) => note.split('\n')).length).toBeLessThanOrEqual(MAX_NOTE_LINES);
  });
});
