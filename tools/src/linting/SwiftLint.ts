import { SpawnResult } from '@expo/spawn-async';
import swiftlint from '@expo/swiftlint';
import { ChildProcess } from 'child_process';

import { EXPO_DIR } from '../Constants';

/**
 * Represents a single linter violation.
 */
export type LintViolation = {
  /**
   * Number of the line at which the violation starts.
   */
  line: number;

  /**
   * Column at which the violation starts or `null` when the entire line is violated.
   */
  column: number | null;

  /**
   * An ID of the violated rule.
   */
  ruleId: string;

  /**
   * Short description of the rule.
   */
  type: string;

  /**
   * Full explanation of the rule.
   */
  reason: string;

  /**
   * Level of the violation. Errors are serious violations and must be fixed.
   */
  severity: 'warning' | 'error';
};

/**
 * Spawns swiftlint process.
 */
function runAsync(args: string[]): Promise<SpawnResult> {
  return swiftlint(args, {
    cwd: EXPO_DIR,
  });
}

/**
 * Parses JSON reported by `swiftlint` to the array of violations.
 */
function parseLintResultsFromJSONString(jsonString: string): LintViolation[] {
  try {
    const json = JSON.parse(jsonString);

    return json.map(({ file, line, character, reason, severity, type, rule_id }) => ({
      file,
      line,
      column: character ?? 0,
      reason,
      severity: severity.toLowerCase(),
      type,
      ruleId: rule_id,
    }));
  } catch (e) {
    console.error('Unable to parse as JSON:', jsonString);
    throw e;
  }
}

/**
 * Returns the version of `swiftlint` binary.
 */
export async function getVersionAsync(): Promise<string | null> {
  try {
    const { stdout } = await runAsync(['version']);
    return stdout.trim();
  } catch {
    return null;
  }
}

/**
 * Lints Swift source code passed as string.
 */
export async function lintStringAsync(str: string): Promise<LintViolation[]> {
  const promise = runAsync(['lint', '--reporter', 'json', '--quiet', '--use-stdin']);

  // @ts-ignore
  const child = promise.child as ChildProcess;
  child.stdin?.write(str);
  child.stdin?.end();

  let stdout: string;
  try {
    stdout = (await promise).stdout;
  } catch (error) {
    stdout = error.stdout;
  }

  return parseLintResultsFromJSONString(stdout);
}
