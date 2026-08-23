// @ref llp/0009-smart-followups.rfc.md §Examples per command — the next actions of `doctor:check`.
//
// The obvious follow-up would be `exagent doctor:fix`, and that command does not exist yet. So the
// next action is the one the failing check itself named: expo-doctor's advice is written for a
// person and usually quotes the exact command or documentation page to go to. Pulling that out is
// the whole builder — nothing here invents a fix.

import type { DoctorCheck, DoctorReport } from '../doctor/types';
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
      return quoted;
    }
  }

  const url = URL.exec(advice);
  // Prose puts a period after a sentence-final URL, and it is not part of the URL.
  return url ? url[0].replace(/[.,)]+$/, '') : null;
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
 */
function followUpId(action: string): string {
  const slug = action
    .replace(/^https?:\/\//, '')
    .replace(/^npx\s+/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .split('-')
    .slice(0, 4)
    .join('-');
  return `doctor-advice-${slug || 'unknown'}`;
}
