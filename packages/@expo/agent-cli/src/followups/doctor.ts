// @ref llp/0009-smart-followups.rfc.md §Examples per command — the next actions of `doctor:check`.
//
// The next action after a failed check is the one the check itself named: expo-doctor's advice is
// written for a person and usually quotes the exact command or documentation page to go to.
// Pulling that out is the whole builder — nothing here invents a fix.
//
// A blanket "try resetting the caches" rung under a specific piece of advice is deliberately not
// here [decision — 2026-08-24, kept through the v1 narrowing]. Every check expo-doctor reports on is
// a dependency or a configuration problem — a package behind the SDK, a missing lockfile, a plugin
// that will not resolve — and none of them is fixed by deleting a cache. That shape of follow-up is
// what llp/0009 caps the budget to keep out. It is also why deferring `doctor:fix` (llp/0016) cost
// this builder nothing: it never named that command.

import type { DoctorCheck, DoctorReport } from '../doctor/types';
import { PROGRAM_PREFIX } from '../programName';
import { capFollowUps, type FollowUp } from './types';

/**
 * Commands expo-doctor's advice quotes.
 *
 * A closed list of leading tokens, because the advice is prose: `'npx expo install --check'` is a
 * command and `"expo.install.exclude"` is a package.json key, and only the first word tells them
 * apart [both observed in one real run of expo-doctor 1.20.1].
 */
const COMMAND_TOOLS = ['npx', 'npm', 'yarn', 'pnpm', 'bun', 'expo', 'eas', 'pod', 'watchman'];

/** Quoted spans of advice text, in the three ways expo-doctor writes them. */
const QUOTED = /`([^`]+)`|'([^']+)'|"([^"]+)"/g;

/** A documentation link, which is what advice falls back to when it names no command. */
const URL = /https?:\/\/\S+/;

/**
 * The one thing to run or open for a failed check, or null when its advice named neither.
 *
 * A command wins over a link: a link is something a person reads, and a command is something the
 * agent reading this can act on itself.
 */
export function extractAdviceAction(check: DoctorCheck): string | null {
  const advice = check.advice.join('\n');

  for (const match of advice.matchAll(QUOTED)) {
    const quoted = (match[1] ?? match[2] ?? match[3] ?? '').trim();
    const [tool] = quoted.split(/\s+/);
    if (tool && COMMAND_TOOLS.includes(tool) && quoted.includes(' ')) {
      return preferAgentCli(quoted);
    }
  }

  const url = URL.exec(advice);
  // Prose puts a period after a sentence-final URL, and it is not part of the URL.
  return url ? url[0].replace(/[.,)]+$/, '') : null;
}

/**
 * Advice this CLI has a command of its own for.
 *
 * expo-doctor's advice is written for a person, so it names the Expo CLI: `npx expo install --check`
 * [observed — friction run 7, F78]. The reader of a `Suggested next:` line here is usually an agent
 * driving *this* CLI, and `@expo/agent-cli install --check` runs the same check and adds the structured
 * `check` object the rest of the surface expects. Nothing else is rewritten: a rewrite is a claim
 * that the two commands do the same thing, and this is the only pair where that has been verified
 * (`src/install/`).
 */
const AGENT_CLI_EQUIVALENTS: readonly { advice: RegExp; command: string }[] = [
  { advice: /^(?:npx\s+)?expo\s+install\s+--check$/, command: `${PROGRAM_PREFIX} install --check` },
  { advice: /^(?:npx\s+)?expo\s+install\s+--fix$/, command: `${PROGRAM_PREFIX} install --fix` },
];

/** The same action, spelled as this CLI's command when this CLI has one. */
function preferAgentCli(action: string): string {
  const equivalent = AGENT_CLI_EQUIVALENTS.find((entry) => entry.advice.test(action));
  return equivalent?.command ?? action;
}

/** What to do about the checks that failed, at most one action per check. */
export function buildDoctorCheckFollowUps(report: DoctorReport): FollowUp[] {
  const followups: FollowUp[] = [];
  const seen = new Set<string>();

  for (const check of report.checks) {
    if (check.status !== 'failed') {
      continue;
    }
    const action = extractAdviceAction(check);
    if (!action) {
      continue;
    }
    const id = followUpId(action);
    if (seen.has(id)) {
      continue;
    }
    seen.add(id);
    followups.push({ id, command: action, why: check.name });
  }

  return capFollowUps(followups);
}

/**
 * A stable id for one advice action.
 *
 * Derived from the action rather than from the check, because the check's only name is a sentence
 * and an id has to be short enough to assert on. Two checks that advise the same command collapse
 * to one follow-up, which is the behaviour that matters: running it twice fixes nothing twice.
 *
 * This CLI's own name is stripped along with the runner, so the id names the *command*. The slug
 * keeps four segments, and `@expo/agent-cli` is three of them — left in, `install --fix` and
 * `install --check` would slug to the same id and collapse into one follow-up, which is a real
 * collision the short name never had.
 */
function followUpId(action: string): string {
  const slug = action
    .replace(/^https?:\/\//, '')
    .replace(/^npx\s+/, '')
    .replace(/^@expo\/agent-cli\s+/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .split('-')
    .slice(0, 4)
    .join('-');
  return `doctor-advice-${slug || 'unknown'}`;
}
