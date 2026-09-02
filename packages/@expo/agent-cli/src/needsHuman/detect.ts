// @ref llp/0010-agent-conventions.rfc.md §Needs-human protocol
// Layer 3 and layer 4 of the detection: recognising a stop in what a tool printed.
//
// Pure functions over captured text, so every signature is testable against a recorded sample
// without a subprocess, an account, or a network. Nothing here decides what to do about the
// answer — that is the caller's, which is what lets one site keep its own error code while
// another raises the registry's.
//
// The honest part: the family gives no machine-readable reason for a non-interactive stop
// (llp/0010 §Upstream asks), so this is string matching against a small table, and a generic
// answer that names the tool and quotes what it printed is the right answer when nothing specific
// matched. A confident wrong guess is worse than "the EAS CLI needed input".

import type { NeedsHuman } from '../utils/errors';
import { needsHumanOf } from './error';
import { needsHumanScenarios, type NeedsHumanTool } from './registry';

/** A captured failure, as `spawnSubprocessAsync` reports one. */
export interface SubprocessFailure {
  /** Which tool ran, so a signature is only matched against the output it was written for. */
  tool: NeedsHumanTool;
  /** Exit code, or null when the process never started or was killed. */
  exitCode: number | null;
  stdout: string;
  stderr: string;
  /** The command a person would run to see this themselves, e.g. `npx eas deploy`. */
  invocation?: string;
  /** The prompt-shaped line the hang guard killed the process on (layer 4). */
  promptHang?: string | null;
}

/**
 * What a person has to do about a failed subprocess, or null when nothing says one is needed.
 *
 * Order comes from the registry: the first row whose signature matches wins, and the generic rows
 * are last. A killed prompt is answered by the tool's generic row, because the line the guard saw
 * is the question and nothing knows which of the tool's prompts asked it.
 */
export function classifySubprocessFailure(failure: SubprocessFailure): NeedsHuman | null {
  const output = `${failure.stderr}\n${failure.stdout}`;

  if (failure.promptHang) {
    const generic = needsHumanScenarios.find(
      (scenario) => scenario.generic && scenario.tools.includes(failure.tool)
    );
    return generic
      ? needsHumanOf(generic, { detectedBy: 'prompt-pattern', command: failure.invocation })
      : null;
  }

  // A tool that succeeded needed nothing, whatever its output happened to contain.
  if (failure.exitCode === 0) {
    return null;
  }

  for (const scenario of needsHumanScenarios) {
    if (!scenario.tools.includes(failure.tool)) {
      continue;
    }
    if (scenario.signatures.some((signature) => signature.test(output))) {
      return needsHumanOf(scenario, {
        detectedBy: 'exit-signature',
        // A generic row names no command of its own: the one to run is the one that stopped.
        command: scenario.generic ? failure.invocation : undefined,
      });
    }
  }

  return null;
}

/**
 * Whether a line reads like a tool waiting for an answer.
 *
 * Half of the layer-4 guard, and the half that keeps it from killing a slow but healthy command:
 * silence alone is a long build, and silence *on a question* is a prompt nobody will ever answer.
 *
 * The leading `?` and `›` are the markers `prompts` and `inquirer` write, which is how both CLIs
 * ask — `? Select a platform` is a question that ends in neither a question mark nor a colon.
 *
 * @ref llp/0006-agent-native-cli-surface.rfc.md §Surface improvements
 */
export function isPromptShaped(line: string): boolean {
  return /[?:]\s*$|^\s*[?›»]\s+\S|\(y\/N\)|\(Y\/n\)|Password|passphrase/i.test(line);
}

/** The last line of a captured stream that has anything on it, which is where a prompt sits. */
export function lastNonEmptyLine(output: string): string | null {
  const lines = output
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0);
  return lines.length ? lines[lines.length - 1]! : null;
}
