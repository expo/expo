import { boolish } from 'getenv';
import { format } from 'node:util';

/** If the verbose logging should be enabled by default, based on `EXPO_E2E_VERBOSE` or GitHub Actions running in debug mode */
export const EXPO_E2E_VERBOSE = boolish('RUNNER_DEBUG', boolish('EXPO_E2E_VERBOSE', false));

/**
 * Create a verbose logger, similar to `debug`.
 * When omitting `verbose`, the global verbose logging is inherited.
 */
export function createVerboseLogger({
  prefix = 'verbose',
  verbose,
}: { prefix?: string; verbose?: boolean } = {}) {
  let logs = '';

  const prefixLines = (prefix: string, output: string) =>
    `[${prefix}] ${output.split('\n').join(`\n[${prefix}] `)}`;

  /** Log verbose output that normally should not be visible */
  function logger(...log: any[]) {
    logs += prefixLines(prefix, format(...log)) + '\n';
  }

  return Object.assign(logger, {
    /** Log verbose output with a special tag that normally should not be visible */
    tag(tag: string, ...log: any[]) {
      logs += prefixLines(`${prefix} ${tag}`, format(...log)) + '\n';
    },
    /** Output all collected verbose output as a single console call, using either `.error` or `.warn` to enable stack traces in Jest */
    output(error = false) {
      if (!logs) return;

      if (verbose !== false && error) {
        console.error(logs);
      } else if (verbose !== false && EXPO_E2E_VERBOSE) {
        console.warn(logs);
      }

      logs = '';
    },
  });
}
