// @ref llp/0001-agentic-cli-on-expo-cli.rfc.md §Constraints — the project's own `expo` CLI
// evaluates the config; `@expo/agent-cli` never imports `@expo/config-plugins` to do it here.
//
// `expo config --type introspect --json` runs the prebuild config and compiles every introspective
// mod in memory [observed — `packages/@expo/cli/src/config/configAsync.ts`], writing nothing to the
// project. That is the whole hard part of `inspect:config-plugins`, and it belongs to the CLI the project
// installed, so this module only starts it and parses what it printed.

import { CommandError } from '../utils/errors';
import { resolveExpoCli } from '../utils/expoCli';
import { spawnSubprocessAsync } from '../utils/subprocess';
import type { IntrospectedConfig } from './effective';

/** The `expo` arguments that produce an introspected config. */
export const INTROSPECT_ARGS = ['config', '--type', 'introspect', '--json'];

export interface IntrospectResult {
  config: IntrospectedConfig;
  /** The argv that produced it, for the `source.command` of the report. */
  command: string[];
  durationMs: number;
}

/**
 * Run `expo config --type introspect --json` and parse its answer.
 *
 * @throws {CommandError} `EXPO_CLI_NOT_FOUND` when no `expo` CLI could be started,
 * `CONFIG_INTROSPECT_FAILED` when the CLI reported an error, `CONFIG_INTROSPECT_UNPARSEABLE` when
 * it exited 0 without printing a config.
 */
export async function introspectConfigAsync(projectRoot: string): Promise<IntrospectResult> {
  const { command, args } = resolveExpoCli(projectRoot, INTROSPECT_ARGS);
  const startedAt = Date.now();
  // This command owns stdout (`--json` prints one object), so nothing the CLI writes is printed;
  // it is kept, because a CLI that fails says why on the same streams.
  const result = await spawnSubprocessAsync(command, args, {
    cwd: projectRoot,
    output: 'capture',
  });
  const durationMs = Date.now() - startedAt;

  if (result.spawnError) {
    const error = new CommandError(
      'EXPO_CLI_NOT_FOUND',
      [
        `Could not run the Expo CLI (${command}), so this project's config was never evaluated.`,
        `Why: spawning it failed (${result.spawnError.code ?? result.spawnError.message}), which means the project has no expo dependency installed and the npx fallback could not run either.`,
        `How: install the project's dependencies, then run this command again.`,
      ].join('\n')
    );
    error.suggestedCommand = 'npm install';
    throw error;
  }

  if (result.exitCode !== 0) {
    const said = outputTail(`${result.stderr}${result.stdout}`);
    const error = new CommandError(
      'CONFIG_INTROSPECT_FAILED',
      [
        `The Expo CLI could not evaluate this project's config (expo config exited with code ${result.exitCode}).`,
        `Why: ${said || 'the CLI stopped without a message. A config plugin that throws, an unreadable app config, or a missing dependency all end here.'}`,
        `How: fix what it reported and run this command again. Running "npx expo config --type introspect --json" directly shows the same failure without this wrapper.`,
      ].join('\n')
    );
    error.suggestedCommand = 'npx expo config --type introspect --json';
    throw error;
  }

  const config = parseIntrospectedConfig(result.stdout);
  if (!config) {
    const error = new CommandError(
      'CONFIG_INTROSPECT_UNPARSEABLE',
      [
        `The Expo CLI finished, but it did not print a config, so there is nothing to report.`,
        `Why: "expo config --json" prints one JSON object describing the project, and this run printed something else${outputTail(result.stdout) ? `:\n${outputTail(result.stdout)}` : '.'}`,
        `How: check the installed version of the expo package, then run the command again. Running "npx expo config --type introspect --json" directly shows the same output without this wrapper.`,
      ].join('\n')
    );
    error.suggestedCommand = 'npx expo config --type introspect --json';
    throw error;
  }

  return { config, command: ['expo', ...INTROSPECT_ARGS], durationMs };
}

/**
 * The config the CLI printed.
 *
 * The last config-shaped JSON line wins, the same defensive parse `src/deploy/launchCli.ts` makes:
 * a notice or a debug line the CLI writes to stdout before its payload must not decide the result.
 * "Config-shaped" is `_internal` or `slug`, which is what tells a config apart from a log line —
 * and `slug` alone still matches, so a payload *without* `_internal` reaches the clear error about
 * the missing block instead of being read as "the CLI printed nothing".
 */
export function parseIntrospectedConfig(stdout: string): IntrospectedConfig | null {
  const lines = stdout.split('\n').reverse();
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('{')) {
      continue;
    }
    try {
      const data = JSON.parse(trimmed);
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        if ('_internal' in data || 'slug' in data) {
          return data as IntrospectedConfig;
        }
      }
    } catch {
      // Not the payload line; keep looking.
    }
  }
  return null;
}

/** A line of a Node stack trace: `    at fn (file:1:2)`, and `    at async …`. */
const STACK_FRAME = /^\s*at\s/;

/**
 * The last lines of a captured stream, which is where a CLI says what went wrong — except when it
 * threw.
 *
 * A thrown Node error puts its **message first and its frames after it**, so the tail of such a
 * stream is the part that says nothing: `inspect:config-plugins` answered a config with an
 * unresolvable plugin in it by quoting ten `at resolvePluginForModule (…)` lines and dropping
 * `Failed to resolve plugin for module "./plugins/withNothingHere"` (F133, live wave 31). Stack
 * frames are therefore dropped before the tail is taken, and only kept when they are all the tool
 * wrote — frames are a weak answer, and inventing "the CLI stopped without a message" over them
 * would be a wrong one.
 */
function outputTail(output: string, maxLines = 10): string {
  const lines = output
    .split('\n')
    .map((line) => line.trimEnd())
    .filter(Boolean);
  const said = lines.filter((line) => !STACK_FRAME.test(line));
  // Consecutive duplicates go too, because a thrown error is written twice — once as the message
  // and once as the header of its own stack — and after the frames are dropped that is the whole
  // reason, said twice in a row.
  return dedupeAdjacent(said.length ? said : lines)
    .slice(-maxLines)
    .join('\n');
}

/** The list with runs of identical entries collapsed to one. */
function dedupeAdjacent(lines: string[]): string[] {
  return lines.filter((line, index) => line !== lines[index - 1]);
}
