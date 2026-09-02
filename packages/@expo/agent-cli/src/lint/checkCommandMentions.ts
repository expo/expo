// @ref llp/0006-agent-native-cli-surface.rfc.md §Errors are prompts
// @ref llp/0010-agent-conventions.rfc.md §Registry rules
// The rules a command string this CLI prints has to hold to.
//
// Three, in the order they can be checked without the previous one:
//
// 1. **It resolves.** `resolveCommand` is the same pure function `cli.ts` runs, so a suggestion
//    that fails here is a suggestion that fails for the reader. This is the floor: a `Try:` line
//    naming `UNKNOWN_COMMAND` costs an agent the recovery hop the line exists to save.
// 2. **Its options exist on it.** Where the command's schema can be read from the source
//    (`commandFlags.ts`), an option the parse would reject is the same failure one level down.
// 3. **Its arguments have somewhere to go.** A command that declares `positionalArgs: 'none'`
//    answers `BAD_ARGS` for one, which is llp/0010 §Registry rules (d) read from the other end:
//    the rule exists because `checkpoint:undo <id>` was the natural line to type, and a message
//    that suggests that line is the CLI teaching it.
// 4. **It is runnable as printed.** A `Try:` line or a `Next:` rung with a `<placeholder>` in it
//    cannot be run, and the reader has to work out what to substitute from a message that stopped
//    to tell them what to run. A handful genuinely cannot be filled in by this CLI, and those are
//    listed, with the sentence that says why.

import { resolveCommand, type CommandResolution } from '../commandRegistry';
import { PROGRAM_NAME, PROGRAM_PREFIX } from '../programName';
import type { CommandFlagSpec } from './commandFlags';
import {
  INTERPOLATION_TOKEN,
  type CommandMention,
  type MentionRole,
  type SuggestedCommand,
} from './commandMentions';

/**
 * Options that belong to the launcher rather than to any command.
 *
 * `npx @expo/agent-cli --help` is a correct command line with no command in it, so the resolution rules
 * never see it.
 */
const LAUNCHER_OPTIONS = new Set(['--help', '-h', '--version', '-v']);

/**
 * A `<name>` standing where a value goes.
 *
 * The matched pair is the whole of the rule, deliberately: a lone `>` is a shell redirection, and
 * the screenshot rungs really do end in `> screen.png`. Square brackets are not a placeholder
 * either — `runtime:eval` suggestions carry JavaScript, where `[0]` is an index.
 */
const PLACEHOLDER = /<[^<>\s][^<>]*>/;

/**
 * The suggested commands that may carry a placeholder, and why each one has to.
 *
 * The bar is not "this reads well as documentation" — every usage line reads well as documentation.
 * It is that **this CLI cannot compute the value**, so the alternative to a placeholder is no
 * suggestion at all. Adding a row is a decision about a message; the sentence is what makes it one.
 */
export const ALLOWED_PLACEHOLDER_COMMANDS: readonly {
  command: string;
  why: string;
}[] = [
  {
    command: `${PROGRAM_PREFIX} inspect:build-log --file <path>`,
    why: "eas-cli has no `build:logs` (llp/0010 §Upstream asks), so nothing here can download the log this reads — the path exists only once a person has saved it, and the follow-up's own `why` says so.",
  },
];

/** Where a problem is, what the string says, and what it is used as. */
export interface ProblemSubject {
  file: string;
  line: number;
  role: MentionRole;
  /** The command as it would be run. */
  text: string;
  /** The whole string it came from, which for a mention in prose is more than the command. */
  literal: string;
}

/** One rule a command string broke. */
export interface MentionProblem {
  subject: ProblemSubject;
  /** Which rule, as a stable id an assertion can name. */
  rule: 'unknown-command' | 'unknown-option' | 'stray-argument' | 'placeholder';
  /** What is wrong, in one sentence. */
  why: string;
  /** What to do about it, in one sentence. */
  how: string;
}

/** What a sweep looked at, so a hole in it is a number rather than a silence. */
export interface MentionCheckSummary {
  /** Mentions read. */
  total: number;
  /** Mentions whose command name was resolved against the registry. */
  resolved: number;
  /** Mentions whose command name is a `${…}` or a placeholder, so it cannot be resolved here. */
  unresolvable: number;
  /** Mentions whose options were checked against the command's own schema. */
  optionsChecked: number;
  /** Whole `Try:` lines and `Next:` rungs read, whichever CLI they name. */
  suggestions: number;
}

export interface MentionCheckResult {
  problems: MentionProblem[];
  summary: MentionCheckSummary;
}

/**
 * Check every command string a sweep found.
 *
 * @param mentions the `npx @expo/agent-cli …` occurrences, which the registry can answer for.
 * @param suggestions the whole `Try:` lines and `Next:` rungs, whichever CLI they name.
 * @param flagSpecs the option list of each command, by the name a caller types.
 */
export function checkCommandMentions(
  mentions: readonly CommandMention[],
  suggestions: readonly SuggestedCommand[],
  flagSpecs: ReadonlyMap<string, CommandFlagSpec>
): MentionCheckResult {
  const problems: MentionProblem[] = [];
  const summary: MentionCheckSummary = {
    total: mentions.length,
    resolved: 0,
    unresolvable: 0,
    optionsChecked: 0,
    suggestions: suggestions.length,
  };

  for (const suggestion of suggestions) {
    const placeholder = checkPlaceholder(suggestion);
    if (placeholder) {
      problems.push(placeholder);
    }
  }

  for (const mention of mentions) {
    const subject: ProblemSubject = {
      file: mention.file,
      line: mention.line,
      role: mention.role,
      text: mention.text,
      literal: mention.literal,
    };
    const { command, args } = mention;
    if (command == null || LAUNCHER_OPTIONS.has(command)) {
      continue;
    }
    if (command.startsWith('-')) {
      problems.push({
        subject,
        rule: 'unknown-command',
        why: `"${command}" is not one of the options the launcher itself takes (${[...LAUNCHER_OPTIONS].join(', ')}), and nothing before it names a command, so this line runs nothing.`,
        how: `Name the command the option belongs to, as in "${PROGRAM_PREFIX} dev:stop --json".`,
      });
      continue;
    }
    if (isUnreadable(command)) {
      summary.unresolvable++;
      continue;
    }

    summary.resolved++;
    const resolution = resolveCommand(command, args);
    const unknown = checkResolution(subject, resolution);
    if (unknown) {
      problems.push(unknown);
      continue;
    }
    if (resolution.kind === 'command') {
      const spec = flagSpecs.get(resolution.name);
      if (spec && !spec.forwardsUnknownFlags) {
        summary.optionsChecked++;
        problems.push(...checkOptions(subject, resolution.name, resolution.argv, spec));
      }
      if (spec?.positionalArgs === 'none') {
        const stray = checkPositionals(subject, resolution.name, resolution.argv, spec);
        if (stray) {
          problems.push(stray);
        }
      }
    }
  }

  return { problems, summary };
}

/** Whether a word stands for a value rather than being one. */
function isUnreadable(word: string): boolean {
  return word.includes(INTERPOLATION_TOKEN) || PLACEHOLDER.test(word);
}

/** Rule 1: the command resolves the way it will resolve for the reader. */
function checkResolution(
  subject: ProblemSubject,
  resolution: CommandResolution
): MentionProblem | null {
  switch (resolution.kind) {
    case 'unknown-command':
      return {
        subject,
        rule: 'unknown-command',
        why: `"${resolution.command}" is in none of the registry's three lists, so running this prints UNKNOWN_COMMAND — the reader of this message would get a second error instead of a fix.`,
        how: 'Name a command that exists (src/commandRegistry.ts has all of them), or add the one this means to the registry.',
      };
    case 'unknown-action':
      return {
        subject,
        rule: 'unknown-command',
        why: `"${resolution.action}" is not an action of the "${resolution.group}" group, so running this prints UNKNOWN_ACTION.`,
        how: `Use one of the actions "${resolution.group}" has, or add this one to its \`actions\` in src/commandRegistry.ts.`,
      };
    case 'flags-without-action':
      return {
        subject,
        rule: 'unknown-command',
        why: `"${resolution.group}" is a group with no default action, so options with no action named exit 1 (llp/0010 §Registry rules (a)).`,
        how: `Name the action those options belong to, as in "${PROGRAM_PREFIX} ${resolution.group}:<action> ${resolution.flags.join(' ')}".`,
      };
    default:
      return null;
  }
}

/** Rule 2: every option is one the command's own parse accepts. */
function checkOptions(
  subject: ProblemSubject,
  command: string,
  argv: readonly string[],
  spec: CommandFlagSpec
): MentionProblem[] {
  const problems: MentionProblem[] = [];
  const accepted = new Set(spec.flags);
  // Everything after a `--` belongs to another tool verbatim, exactly as the commands read it.
  const separator = argv.indexOf('--');
  const own = separator >= 0 ? argv.slice(0, separator) : argv;

  for (const word of own) {
    if (!word.startsWith('-') || word === '-' || isUnreadable(word)) {
      continue;
    }
    // `--timeout=90s` is the same option as `--timeout 90s`, and `arg` accepts both.
    const option = word.includes('=') ? word.slice(0, word.indexOf('=')) : word;
    if (!accepted.has(option)) {
      problems.push({
        subject,
        rule: 'unknown-option',
        why: `"${PROGRAM_NAME} ${command}" has no ${option}: its parse accepts ${[...accepted].sort().join(', ')}, so running this line exits 1 with BAD_ARGS.`,
        how: `Use an option this command has, or move the suggestion to the command that owns ${option}.`,
      });
    }
  }
  return problems;
}

/**
 * Rule 3: an argument the command has no place for is an error, not a shrug.
 *
 * The one thing that makes this readable is knowing which words are *values*: `--timeout 90s` has
 * no positional argument in it and `checkpoint:undo abc123` has one. A word whose meaning is only
 * known at runtime stops the check for the whole mention rather than being guessed at — an
 * interpolation may expand to ` --json` as easily as to a bare id.
 *
 * @ref llp/0010-agent-conventions.rfc.md §Registry rules
 */
function checkPositionals(
  subject: ProblemSubject,
  command: string,
  argv: readonly string[],
  spec: CommandFlagSpec
): MentionProblem | null {
  const carriesValue = new Set(spec.valueFlags);
  const separator = argv.indexOf('--');
  const own = separator >= 0 ? argv.slice(0, separator) : argv;

  for (let index = 0; index < own.length; index++) {
    const word = own[index]!;
    if (isUnreadable(word)) {
      return null;
    }
    if (word.startsWith('-') && word !== '-') {
      // `--timeout=90s` carries its value with it; `--timeout 90s` takes the next word.
      if (!word.includes('=') && carriesValue.has(word)) {
        index++;
      }
      continue;
    }
    return {
      subject,
      rule: 'stray-argument',
      why: `"${PROGRAM_NAME} ${command}" reads no positional arguments, so "${word}" would be reported as BAD_ARGS and nothing would run (llp/0010 §Registry rules (d)).`,
      how: `Pass the value on the option that carries it, or suggest a command that takes an argument here.`,
    };
  }
  return null;
}

/** Rule 4: a command a reader is told to run has to be runnable as printed. */
function checkPlaceholder(suggestion: SuggestedCommand): MentionProblem | null {
  if (!PLACEHOLDER.test(suggestion.text)) {
    return null;
  }
  if (ALLOWED_PLACEHOLDER_COMMANDS.some((allowed) => allowed.command === suggestion.text)) {
    return null;
  }
  return {
    subject: { ...suggestion, literal: suggestion.text },
    rule: 'placeholder',
    why: `a ${suggestion.role === 'suggested-command' ? '"Try:" line' : '"Next:" rung'} is a command the reader runs, and this one has a placeholder in it, so it cannot be run as printed.`,
    how: 'Compute the value from what the command already probed, drop the argument, or — when this CLI genuinely cannot know it — add the command to ALLOWED_PLACEHOLDER_COMMANDS in src/lint/checkCommandMentions.ts with the sentence that says why.',
  };
}

/** How a failure reads: where it is, what it says, why that is wrong, and what to do. */
export function formatMentionProblems(problems: readonly MentionProblem[]): string {
  const blocks = problems.map(({ subject, rule, why, how }) =>
    [
      `${subject.file}:${subject.line}  [${rule}]  ${roleLabel(subject.role)}`,
      `  Command: ${subject.text}`,
      // The whole literal, because the command above was cut out of it and the line number points
      // at the literal's first line — a long template needs both to be findable.
      `  In:      ${oneLine(subject.literal)}`,
      `  Why:     ${why}`,
      `  Fix:     ${how}`,
    ].join('\n')
  );
  return [
    `${problems.length} suggested command${problems.length === 1 ? '' : 's'} would not do what ${
      problems.length === 1 ? 'its' : 'their'
    } message says.`,
    '',
    ...blocks,
  ].join('\n\n');
}

function roleLabel(role: MentionRole): string {
  switch (role) {
    case 'suggested-command':
      return 'CommandError.suggestedCommand (the "Try:" line)';
    case 'followup-command':
      return 'FollowUp.command (a "Next:" rung)';
    case 'message':
      return 'printed message';
  }
}

/** How much of a literal a failure quotes, before it is more than a reader needs. */
const LITERAL_EXCERPT_LENGTH = 240;

function oneLine(literal: string): string {
  const flat = literal.split('\n').join(' ⏎ ');
  return flat.length > LITERAL_EXCERPT_LENGTH ? `${flat.slice(0, LITERAL_EXCERPT_LENGTH)}…` : flat;
}
