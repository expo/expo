// The files the suggested-command lint reads, and the sweep over them.
//
// Separated from the rules so the rules are testable on a string and the sweep is testable on a
// directory. Nothing here is clever: `src/**/*.ts` minus the tests, in a stable order, so a failure
// names the same file on every machine.

import fs from 'fs';
import path from 'path';

import { checkCommandMentions, type MentionCheckResult } from './checkCommandMentions';
import {
  extractFlagSpecs,
  mergeFlagSpecs,
  type CommandFlagSpec,
  type UnreadableParseCall,
} from './commandFlags';
import {
  extractCommandMentions,
  extractSuggestions,
  extractTextMentions,
  type CommandMention,
  type SuggestedCommand,
} from './commandMentions';
import { extractForeignFlags, type ForeignFlagUse } from './foreignFlags';

/**
 * Directory names the sweep never descends into.
 *
 * `lint` is this directory. Nothing in it is printed by the CLI — the commands it names are the
 * allowlist and the examples in these comments — so linting it would only ever be the lint
 * agreeing with itself.
 *
 * `deferred` is the v1 narrowing's reference shelf (llp/0016, `src/deferred/README.md`): code no
 * registry entry loads, kept verbatim so a command that returns is restored rather than rewritten.
 * Every file in it names a command the registry no longer resolves, which is the very thing this
 * lint fails on — and the point of the exclusion is that it keeps failing on it everywhere else.
 */
const SKIPPED_DIRECTORIES = new Set([
  '__tests__',
  '__mocks__',
  'node_modules',
  'build',
  'lint',
  'deferred',
]);

/**
 * Every `.ts` file under a root, excluding the tests, relative to that root and sorted.
 *
 * The tests are excluded because a test's fixtures are *supposed* to name commands that do not
 * exist — `src/__tests__/commandRegistry-test.ts` asserts what `@expo/agent-cli nonsense` answers — and a
 * lint that could not tell the two apart would be answered by deleting its own coverage.
 */
export function sourceFilesUnder(root: string): string[] {
  const found: string[] = [];
  const walk = (directory: string): void => {
    for (const entry of fs
      .readdirSync(directory, { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name))) {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        if (!SKIPPED_DIRECTORIES.has(entry.name)) {
          walk(full);
        }
      } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('-test.ts')) {
        found.push(path.relative(root, full));
      }
    }
  };
  walk(root);
  return found;
}

/**
 * Markdown that documents the command surface and so can go stale with it.
 *
 * The `AGENTS.md` managed block is not here because it is not a file: it is written by
 * `agents:setup` from `src/agents/content.ts`, which the source sweep already reads.
 */
const DOCUMENTED_FILES = ['README.md'];

export interface Sweep extends MentionCheckResult {
  /** Files read. */
  files: string[];
  mentions: CommandMention[];
  /** Whole `Try:` lines and `Next:` rungs, whichever CLI they name. */
  suggestions: SuggestedCommand[];
  /** The option list of every command whose parse could be read. */
  flagSpecs: Map<string, CommandFlagSpec>;
  /** The parse calls whose command name is computed, so their options are unchecked. */
  unreadableParses: UnreadableParseCall[];
  /** Every option this CLI puts on another CLI's command line. */
  foreignFlags: ForeignFlagUse[];
}

/**
 * Read every source under `root`, find every command it prints, and check them.
 *
 * @param root the `src` directory. Paths are reported relative to its parent, so a failure reads
 * `src/dev/stopAsync.ts:120` — the form an editor jumps to from the package directory.
 */
export function sweepSuggestedCommands(root: string): Sweep {
  const files = sourceFilesUnder(root);
  const packageRoot = path.dirname(root);
  const label = path.basename(root);
  const mentions: CommandMention[] = [];
  const suggestions: SuggestedCommand[] = [];
  const specs: CommandFlagSpec[] = [];
  const unreadableParses: UnreadableParseCall[] = [];
  const foreignFlags: ForeignFlagUse[] = [];

  for (const file of files) {
    const reported = path.join(label, file).split(path.sep).join('/');
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    mentions.push(...extractCommandMentions(reported, source));
    suggestions.push(...extractSuggestions(reported, source));
    const scan = extractFlagSpecs(reported, source);
    specs.push(...scan.specs);
    unreadableParses.push(...scan.unreadable);
    foreignFlags.push(...extractForeignFlags(reported, source));
  }

  const read = [...files];
  for (const file of DOCUMENTED_FILES) {
    const full = path.join(packageRoot, file);
    if (fs.existsSync(full)) {
      read.push(file);
      mentions.push(...extractTextMentions(file, fs.readFileSync(full, 'utf8')));
    }
  }

  const flagSpecs = mergeFlagSpecs(specs);
  return {
    files: read,
    mentions,
    suggestions,
    flagSpecs,
    unreadableParses,
    foreignFlags,
    ...checkCommandMentions(mentions, suggestions, flagSpecs),
  };
}
