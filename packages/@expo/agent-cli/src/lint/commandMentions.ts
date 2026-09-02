// @ref llp/0006-agent-native-cli-surface.rfc.md §Errors are prompts
// @ref llp/0009-smart-followups.rfc.md §The follow-up block
// Every `npx @expo/agent-cli …` this CLI hands a caller, found in the source that produces it.
//
// The drift this exists to catch: a `Try:` line, a follow-up `command`, or a `How:` sentence names
// a command that used to exist. Nothing fails when that happens — the string is data, not a call —
// so the CLI goes on confidently telling an agent to run something that answers `UNKNOWN_COMMAND`,
// and the agent spends its recovery hop on a second error instead of on the fix. Renaming a command
// is exactly when this happens, and renaming a command is a thing this CLI has done twice.
//
// A registry of "all message-producing builders" would not catch it: the builders are ordinary
// functions all over the tree and a new one is a new function, not a new registry entry. So the
// sweep is over the *source* instead, which has the property a registry cannot have — a string
// nobody remembered to register is still in it.
//
// This module is test-support: nothing under `src/cli.ts` imports it, so it is type-checked and
// linted with the rest of `src/` and never reaches the published bundle.

import ts from 'typescript';

import { PROGRAM_NAME, PROGRAM_PREFIX } from '../programName';

/**
 * The prefix a runnable mention of this CLI starts with.
 *
 * The same constant the CLI prints with, not a copy of it: the sweep's whole job is to check the
 * lines this CLI hands a caller, and a prefix that could disagree with the one those lines are
 * built from would make the sweep read zero mentions and pass.
 */
export const MENTION_PREFIX = PROGRAM_PREFIX;

/**
 * The interpolations that are not unknowns: this CLI's own name, in both of its printed forms.
 *
 * @ref llp/0024-cli-ui.rfc.md §The program names itself — a printed command is written
 * `` `${PROGRAM_PREFIX} dev:stop` ``, so the *source* no longer spells the prefix this sweep looks
 * for, and reading these two spans as opaque `${…}` would hide every mention in the package from
 * the check. Substituting the value the CLI will print restores exactly what the sweep used to see,
 * and it stays right under a rename because both sides read the one module.
 *
 * By the expression as written, not by resolving the import: the sweep parses one file at a time
 * with no type checker, and these two names are not shadowed anywhere in this package.
 */
const KNOWN_INTERPOLATIONS: ReadonlyMap<string, string> = new Map([
  ['PROGRAM_PREFIX', PROGRAM_PREFIX],
  ['PROGRAM_NAME', PROGRAM_NAME],
]);

/**
 * What an interpolation is printed as in the text of a mention.
 *
 * A `${…}` is a real argument the lint cannot read — `npx @expo/agent-cli skills:show ${pkg}` is a correct
 * command whose last word is only knowable at runtime — so it is kept as one opaque token rather
 * than dropped. Angle brackets would collide with the placeholder rule, and a bare `?` would be
 * indistinguishable from a literal one.
 */
export const INTERPOLATION_TOKEN = '${…}';

/**
 * What an interpolation is *scanned* as, before it is printed.
 *
 * A private-use code point rather than {@link INTERPOLATION_TOKEN} itself, because the printed
 * form contains braces and braces end a mention — a `chalk` template delimits with them. Scanning
 * on the printed form would cut `npx @expo/agent-cli skills:show ${pkg}` at the interpolation.
 */
const INTERPOLATION_MARK = '\uE000';

/**
 * What kind of thing the mention is, which is what decides how strictly it is read.
 *
 * The two command-carrying roles are the ones an agent *runs*: the `Try:` line and the `Next:`
 * block are the last thing a failing and a succeeding command print, and both are read as
 * instructions. A mention in prose is a sentence about a command, and a usage line is a form to
 * fill in — a `<route>` is correct in both and wrong in the two below.
 */
export type MentionRole =
  /** The value of `CommandError.suggestedCommand`, printed as the `Try:` line. */
  | 'suggested-command'
  /** The `command` field of a {@link import('../followups/types').FollowUp}. */
  | 'followup-command'
  /** Anywhere else: a `How:` sentence, a `--help` usage line, a summary. */
  | 'message';

/** One `npx @expo/agent-cli …` occurrence, and where it came from. */
export interface CommandMention {
  /** Path as the sweep was given it, e.g. `src/dev/stopAsync.ts`. */
  file: string;
  /** 1-based line of the start of the mention, so an editor jumps to it. */
  line: number;
  role: MentionRole;
  /** The command as it would be run, prefix included, with interpolations as one token. */
  text: string;
  /** The whole string literal it was found in, for the failure message to quote. */
  literal: string;
  /** The command name, e.g. `dev:stop`. Null when nothing followed the prefix. */
  command: string | null;
  /** Everything after the command name, split on whitespace. */
  args: string[];
  /** Whether any part of the mention came from a `${…}`. */
  dynamic: boolean;
}

/**
 * Characters that end a mention, because prose resumes at them.
 *
 * The codebase delimits a command inside a sentence with quotes or backticks
 * (`Run "npx @expo/agent-cli dev:stop" for …`), and `chalk` templates delimit with braces, so those are
 * the boundaries. The shell operators are boundaries too: a suggestion may be two commands joined
 * by `&&`, and each half is a command of its own to check rather than a long argument list for the
 * first of them.
 */
const MENTION_TERMINATORS = new Set([
  '"',
  "'",
  '`',
  '\n',
  '{',
  '}',
  '(',
  ')',
  '#',
  '|',
  '&',
  ';',
  '\\',
]);

/** Punctuation a mention may end on because a sentence did, e.g. `"npx @expo/agent-cli status".` */
const TRAILING_PUNCTUATION = /[.,;:!?\s]+$/;

/**
 * Every `npx @expo/agent-cli …` in the string literals of one TypeScript source.
 *
 * Only string literals: a mention in a comment is documentation for the next reader of this file,
 * and holding a comment to the same standard as a printed `Try:` line would make the lint an
 * argument about prose. What the CLI *says* is what is checked.
 *
 * @param file the path to report, which is what a failure prints.
 * @param source the file's text.
 */
export function extractCommandMentions(file: string, source: string): CommandMention[] {
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const mentions: CommandMention[] = [];

  const visit = (node: ts.Node): void => {
    const literal = readLiteral(node);
    if (literal != null) {
      const role = roleOf(node);
      for (const found of mentionsIn(literal)) {
        mentions.push({
          file,
          // The offset within the literal is not a source offset — an escape is one character in
          // the cooked text and two in the file — so the line is the line the literal starts on.
          // For a multi-line template that is the head, which is close enough to jump to.
          line: sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1,
          role,
          literal: printable(literal),
          ...found,
        });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);

  return mentions;
}

/**
 * One whole string a command hands its caller as the thing to run next.
 *
 * The commands are not all this CLI's: a `Try:` line is `npx eas login` as often as it is
 * `npx @expo/agent-cli status`, and `npx eas build --profile <profile>` is exactly as unrunnable as
 * `npx @expo/agent-cli navigate <route>` would be. So the placeholder rule is checked over these — every
 * suggestion, whatever CLI it names — while the registry rules are checked over the
 * {@link CommandMention}s, which are only the ones this CLI can resolve.
 */
export interface SuggestedCommand {
  file: string;
  line: number;
  role: Exclude<MentionRole, 'message'>;
  /** The whole literal, with interpolations as one token. */
  text: string;
}

/**
 * Every string this source hands a caller as a next command.
 *
 * The outermost literal of each one: a `${…}` inside a suggestion is part of that suggestion, not a
 * suggestion of its own, and counting the ` --submission` of a conditional as a command to check
 * would be counting a fragment.
 */
export function extractSuggestions(file: string, source: string): SuggestedCommand[] {
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const suggestions: SuggestedCommand[] = [];

  const visit = (node: ts.Node): void => {
    const literal = readLiteral(node);
    if (literal != null) {
      const role = roleOf(node);
      if (role !== 'message') {
        suggestions.push({
          file,
          line: sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1,
          role,
          text: printable(literal),
        });
        // Nothing inside a suggestion is a second suggestion.
        return;
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);

  return suggestions;
}

/**
 * Every `npx @expo/agent-cli …` in a plain-text file, e.g. the README.
 *
 * The same cut as in a string literal, one line at a time — a markdown file has no literals to
 * find, and its command lines are delimited by backticks and newlines exactly as the CLI's own are.
 */
export function extractTextMentions(file: string, text: string): CommandMention[] {
  const mentions: CommandMention[] = [];
  text.split('\n').forEach((line, index) => {
    for (const found of mentionsIn(line)) {
      mentions.push({
        file,
        line: index + 1,
        role: 'message',
        literal: line.trim(),
        ...found,
      });
    }
  });
  return mentions;
}

/**
 * The cooked text of a string-ish node, with interpolations as {@link INTERPOLATION_MARK}.
 *
 * A `TemplateExpression`'s own `${…}` expressions are separate nodes, so the walk reaches any
 * literal nested in one on its own and nothing is counted twice.
 */
function readLiteral(node: ts.Node): string | null {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }
  if (ts.isTemplateExpression(node)) {
    return (
      node.head.text +
      node.templateSpans.map((span) => spanText(span.expression) + span.literal.text).join('')
    );
  }
  return null;
}

/** What one `${…}` contributes to the scanned text: its value when it is known, a mark when not. */
function spanText(expression: ts.Expression): string {
  return KNOWN_INTERPOLATIONS.get(expression.getText()) ?? INTERPOLATION_MARK;
}

/** The scanned form of a string, as a reader of a failure message should see it. */
function printable(scanned: string): string {
  return scanned.split(INTERPOLATION_MARK).join(INTERPOLATION_TOKEN);
}

/**
 * What the literal is used as, read from the syntax around it.
 *
 * Syntax rather than a naming convention, because the two roles that matter are both *contracts*:
 * `suggestedCommand` is the field `logCmdError` prints as `Try:`, and a `command` sitting beside a
 * `why` is a `FollowUp`. Anything a builder returns through either of those reaches a caller as an
 * instruction, however the function that built it is named.
 */
function roleOf(node: ts.Node): MentionRole {
  for (let current: ts.Node | undefined = node; current; current = current.parent) {
    if (ts.isPropertyAssignment(current)) {
      const name = propertyName(current.name);
      if (name === 'suggestedCommand') {
        return 'suggested-command';
      }
      // A `command` next to a `why` in the same object is a `FollowUp`; a `command` on its own is
      // something else's field (`NeedsHuman.command`, a spawn descriptor) and is left alone.
      if (name === 'command' && isFollowUpObject(current.parent)) {
        return 'followup-command';
      }
      // The first enclosing property decides. A nested object under `suggestedCommand` does not
      // exist, and walking past this one would let an outer property claim an inner string.
      return 'message';
    }
    if (
      ts.isBinaryExpression(current) &&
      current.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
      ts.isPropertyAccessExpression(current.left) &&
      current.left.name.text === 'suggestedCommand'
    ) {
      return 'suggested-command';
    }
  }
  return 'message';
}

/** Whether an object literal is a `FollowUp`, i.e. carries the `why` that only it has. */
function isFollowUpObject(node: ts.Node): boolean {
  return (
    ts.isObjectLiteralExpression(node) &&
    node.properties.some(
      (property) => ts.isPropertyAssignment(property) && propertyName(property.name) === 'why'
    )
  );
}

/** The name of a property, whatever it is spelled as. Null for a computed one. */
function propertyName(name: ts.PropertyName): string | null {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name)) {
    return name.text;
  }
  return null;
}

/** The mentions inside one piece of scanned text. */
function mentionsIn(scanned: string): {
  text: string;
  command: string | null;
  args: string[];
  dynamic: boolean;
}[] {
  const found: {
    text: string;
    command: string | null;
    args: string[];
    dynamic: boolean;
  }[] = [];
  for (let at = scanned.indexOf(MENTION_PREFIX); at >= 0; ) {
    const end = endOfMention(scanned, at);
    const text = printable(scanned.slice(at, end).replace(TRAILING_PUNCTUATION, ''));
    const words = text.slice(MENTION_PREFIX.length).trim().split(/\s+/).filter(Boolean);
    found.push({
      text,
      command: words[0] ?? null,
      args: words.slice(1),
      dynamic: text.includes(INTERPOLATION_TOKEN),
    });
    // From the end of this mention, so a string that names two commands reports two and a string
    // that names one never reports it twice.
    at = scanned.indexOf(MENTION_PREFIX, Math.max(end, at + MENTION_PREFIX.length));
  }
  return found;
}

/** Where a mention that starts at `at` ends: the first character at which prose resumes. */
function endOfMention(scanned: string, at: number): number {
  let end = at + MENTION_PREFIX.length;
  while (end < scanned.length && !MENTION_TERMINATORS.has(scanned[end]!)) {
    // An em dash separates a command from its gloss in the help listings, and a `--` separator is
    // two hyphens rather than one dash, so this never cuts a real argument.
    if (scanned[end] === '—') {
      break;
    }
    end++;
  }
  return end;
}
