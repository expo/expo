// @ref llp/0010-agent-conventions.rfc.md §Needs-human protocol
// Turning a registry row into the error a command throws.
//
// Two entry points, because a stop is found in two ways: a caller that *knows* a person is needed
// before it starts (a command with no non-interactive mode) names the scenario, and a caller that
// found out from a captured failure hands over what the classifier recognised.

import { NeedsHumanError, type NeedsHuman } from '../utils/errors';
import { findNeedsHumanScenario, type NeedsHumanScenario } from './registry';

/** What a caller may say about a stop that the registry row does not already know. */
export interface NeedsHumanContext {
  /** The message printed above the block: what stopped, why, and what a person does about it. */
  message: string;
  /** How the scenario was recognised. */
  detectedBy: NeedsHuman['detectedBy'];
  /**
   * The error code, when the site already ships one.
   *
   * Renaming a code that agents may already branch on is a breaking change for no gain, so a
   * reclassified failure keeps its own and only gains the handoff.
   */
  code?: string;
  /** The command a person runs, when the site knows it more exactly than the row does. */
  command?: string;
  /** The URL a person opens, when the site knows it and the row cannot. */
  url?: string;
}

/** The handoff of one registry row, as recognised in one particular way. */
export function needsHumanOf(
  scenario: NeedsHumanScenario,
  context: Omit<NeedsHumanContext, 'message'>
): NeedsHuman {
  return {
    scenario: scenario.id,
    need: scenario.need,
    command: context.command ?? scenario.command,
    url: context.url ?? scenario.url,
    unattendedEnv: scenario.unattendedEnv,
    resumable: scenario.resumable,
    detectedBy: context.detectedBy,
  };
}

/**
 * The error for a scenario the caller names.
 *
 * @throws {Error} when the id is not in the registry, which is a programming error: the ids are
 * spelled in one file and pinned by a test.
 */
export function needsHumanError(scenarioId: string, context: NeedsHumanContext): NeedsHumanError {
  const scenario = findNeedsHumanScenario(scenarioId);
  if (!scenario) {
    throw new Error(`No needs-human scenario is registered as "${scenarioId}".`);
  }
  return new NeedsHumanError(
    context.code ?? scenario.code,
    context.message,
    needsHumanOf(scenario, context)
  );
}

/** The error for a handoff the classifier already assembled from a captured failure. */
export function needsHumanErrorFrom(
  needsHuman: NeedsHuman,
  { message, code }: { message: string; code?: string }
): NeedsHumanError {
  const scenario = findNeedsHumanScenario(needsHuman.scenario);
  return new NeedsHumanError(code ?? scenario?.code ?? 'NEEDS_HUMAN', message, needsHuman);
}
