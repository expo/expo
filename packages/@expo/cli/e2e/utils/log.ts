import { boolish } from 'getenv';
import { format } from 'node:util';

/** If the verbose logging should be enabled by default, based on `EXPO_E2E_VERBOSE` or GitHub Actions running in debug mode */
export const EXPO_E2E_VERBOSE = boolish('RUNNER_DEBUG', boolish('EXPO_E2E_VERBOSE', false));

export function createVerboseLogger({
  prefix = 'verbose',
  verbose,
}: { prefix?: string; verbose?: boolean } = {}) {
  let hasError = false;
  let logs = '';

  /** Log verbose output which is outputted as group in cases of errors, or when verbose is enabled */
  function log(...args: any[]) {
    logs += prefixLines(prefix, format(...args));
  }

  return Object.assign(log, {
    /** Log output prefixed by a tag */
    tag(tag: string, ...args: any[]) {
      logs += prefixLines(`${prefix} ${tag}`, format(...args));
    },
    /** Log encountered errors and mark the logger to output as error */
    error(error: any) {
      hasError = true;
      this.tag('error', error);
    },
    /** Log all verbose logging in cases of errors, or when verbose is enabled */
    exit() {
      if (!logs) return;

      if (verbose !== false && hasError) {
        console.error(logs);
      } else if (verbose !== false && EXPO_E2E_VERBOSE) {
        console.warn(logs);
      }

      hasError = false;
      logs = '';
    },
  });
}

export function prefixLines(prefix: string, output: string) {
  return `[${prefix}] ${output.split('\n').join(`\n[${prefix}] `)}`;
}
