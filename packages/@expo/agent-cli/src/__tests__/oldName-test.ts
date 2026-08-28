// @ref llp/0001-agentic-cli-on-expo-cli.rfc.md §Naming
// The old name is gone, and this is what keeps it gone.
//
// This package was called something else until the rename, and the old name was in 3431 places:
// help text, `Try:` lines, test assertions, LLP prose, env vars, the files it writes under
// `.expo/`, and the exported symbols. A sweep that misses one leaves a CLI that teaches a command
// nobody can run, and nothing else in this repository would fail for it — a name in a string is
// data, not a call.
//
// So the check is a grep over the package's own content plus the text the CLI actually prints,
// and it is case-insensitive: the name had three spellings (lower, Pascal inside identifiers, and
// SCREAMING for env vars) and a partial sweep leaves whichever one the author forgot.
//
// The needle is assembled from two halves rather than written out, because a test that fails on
// its own source is a test nobody can write. The same trick is why there is no allowlist: the one
// incidental collision this corpus had — a `SkillsAgent` fixture named for the Codex agent, whose
// last seven letters spell the old name — was renamed instead of excused. If this suite starts
// failing on a word that merely contains the letters, rename the word; an allowlist here would be
// a hole that the next real occurrence hides in.

import fs from 'fs';
import path from 'path';

import {
  commandGroups,
  formatGroupHelp,
  formatTopLevelHelp,
  topLevelCommands,
} from '../commandRegistry';
import { renderCommandHelp } from '../help/format';
import { formatWorkflowTopic } from '../help/workflow';
import type { CommandHelp } from '../help/types';

// The subject of this suite is the package on disk, so it reads the real one: the suite-wide `fs`
// mock is memfs, which has none of these files in it.
jest.unmock('fs');
jest.unmock('node:fs');

/** The name this package used to have, spelled so that this file does not contain it. */
const OLD_NAME = ['ex', 'agent'].join('');

const OLD_NAME_PATTERN = new RegExp(OLD_NAME, 'i');

const PACKAGE_ROOT = path.resolve(__dirname, '../..');

/**
 * Directories under a scanned root that are not the package's content.
 *
 * `build` is the ncc bundle and `.artifacts` is where a live run leaves its scratch projects —
 * both are generated, both are gitignored, and a stale one from before the rename would fail this
 * suite for a file nobody edits. `node_modules` is *not* here: the e2e fixtures ship committed
 * `node_modules` directories as test data, and the stub CLIs in them are content like any other.
 */
const SKIPPED_DIRECTORIES = new Set(['build', '.artifacts']);

/** Every file under `root`, relative to the package. */
function filesUnder(root: string): string[] {
  const found: string[] = [];
  const walk = (directory: string): void => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        if (!SKIPPED_DIRECTORIES.has(entry.name)) {
          walk(full);
        }
      } else if (entry.isFile()) {
        found.push(path.relative(PACKAGE_ROOT, full));
      }
    }
  };
  walk(path.join(PACKAGE_ROOT, root));
  return found.sort();
}

/** The text of a file, or null when it is not text at all (a fixture PNG, a keystore). */
function readTextOrNull(relative: string): string | null {
  const buffer = fs.readFileSync(path.join(PACKAGE_ROOT, relative));
  if (buffer.includes(0x00) && !buffer.subarray(0, 4).every((byte) => byte < 0x80)) {
    return null;
  }
  const text = buffer.toString('utf8');
  // A lone replacement character means the bytes were not UTF-8, i.e. not source.
  return text.includes('�') ? null : text;
}

/** Where the old name would be, as a `file:line` a reader can jump to. */
function occurrencesIn(relative: string, text: string): string[] {
  return text
    .split('\n')
    .map((line, index) => ({ line, number: index + 1 }))
    .filter(({ line }) => OLD_NAME_PATTERN.test(line))
    .map(({ line, number }) => `${relative}:${number}: ${line.trim().slice(0, 120)}`);
}

/** Every occurrence of the old name in the files under the given roots. */
function scan(roots: string[]): string[] {
  const found: string[] = [];
  for (const root of roots) {
    for (const relative of filesUnder(root)) {
      const text = readTextOrNull(relative);
      if (text != null) {
        found.push(...occurrencesIn(relative, text));
      }
    }
  }
  return found;
}

describe('the old name', () => {
  // A grep that reads nothing reports nothing, and a walk that silently stops — a renamed
  // directory, a skip rule that grew too wide — would turn this whole suite green by accident.
  // Floors, not exact counts: they grow with the package and only a collapse is the failure.
  it(`is looked for in the whole package`, () => {
    expect(filesUnder('src').length).toBeGreaterThan(400);
    expect(filesUnder('e2e').length).toBeGreaterThan(80);
    expect(filesUnder('e2e-live').length).toBeGreaterThan(20);
    expect(filesUnder('llp').length).toBeGreaterThan(20);
    expect(filesUnder('evals').length).toBeGreaterThan(5);
  });

  // The source, the three test tiers, the evals and the design corpus. Each is scanned as its own
  // case so a failure names the area rather than one list of everything.
  it.each([
    ['src', ['src']],
    ['e2e', ['e2e']],
    ['e2e-live', ['e2e-live']],
    ['evals', ['evals']],
    ['llp', ['llp']],
  ])('is gone from %s/', (_area, roots) => {
    expect(scan(roots)).toEqual([]);
  });

  it(`is gone from the package's own documents`, () => {
    const documents = ['README.md', 'CHANGELOG.md', 'AGENTS.md', 'CLAUDE.md', 'package.json'];
    const found = documents.flatMap((document) => {
      const text = readTextOrNull(document);
      return text == null ? [] : occurrencesIn(document, text);
    });
    expect(found).toEqual([]);
  });
});

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

// The grep above reads the source; this reads what the source *produces*. A help block is
// assembled from a registry entry, a template and a summary, so a name could survive in a place no
// single literal spells it.
describe('the help output', () => {
  it(`never prints the old name at the top level`, () => {
    expect(OLD_NAME_PATTERN.test(formatTopLevelHelp())).toBe(false);
  });

  it(`never prints the old name in the workflow map`, () => {
    expect(OLD_NAME_PATTERN.test(formatWorkflowTopic())).toBe(false);
  });

  it.each(Object.keys(commandGroups).map((group) => [group]))(
    'never prints the old name in `%s --help`',
    (group) => {
      expect(OLD_NAME_PATTERN.test(formatGroupHelp(group))).toBe(false);
    }
  );

  it.each(runnableNames().map((name) => [name]))(
    'never prints the old name in `%s --help`',
    async (name) => {
      const rendered = renderCommandHelp(name, await helpOf(name));
      expect(OLD_NAME_PATTERN.test(rendered)).toBe(false);
    }
  );
});
