import { boolish, int } from 'getenv';

/**
 * Environment variables `@expo/agent-cli` reads. This is a deliberately small subset of the
 * `@expo/cli` `Env` class: the process boundary means `@expo/agent-cli` forwards the rest to
 * the `expo` subprocess instead of interpreting them.
 *
 * @see llp/0001-agentic-cli-on-expo-cli.rfc.md §Constraints
 */
class Env {
  /** Enable debug logging */
  get EXPO_DEBUG() {
    return boolish('EXPO_DEBUG', false);
  }

  /** Is running in non-interactive CI mode */
  get CI() {
    return boolish('CI', false);
  }

  /** Disable telemetry */
  get EXPO_NO_TELEMETRY() {
    return boolish('EXPO_NO_TELEMETRY', false);
  }

  /**
   * Do not print or emit the follow-up suggestions commands attach to their output.
   * `--no-followups` does the same for one run.
   *
   * @see llp/0009-smart-followups.rfc.md §The follow-up block
   */
  get AGENT_CLI_NO_FOLLOWUPS() {
    return boolish('AGENT_CLI_NO_FOLLOWUPS', false);
  }

  /**
   * Compute every fingerprint from scratch: never answer one out of the project's `.expo` record.
   * `--no-fingerprint-cache` does the same for one run of the commands that take it.
   *
   * For the case the record cannot cover on its own — a dynamic `app.config.js` whose answer
   * depends on an environment variable or another file, which is the same bytes with a different
   * result. The in-process memo is unaffected: it holds this run's own measurement.
   *
   * @see llp/0023-fingerprint-caching.rfc.md §What the stamps miss
   */
  get AGENT_CLI_NO_FINGERPRINT_CACHE() {
    return boolish('AGENT_CLI_NO_FINGERPRINT_CACHE', false);
  }

  /**
   * How long a guarded subprocess may stay silent before its last line is checked for a question
   * it is waiting on. Widen it for a tool that is legitimately quiet for minutes at a time.
   *
   * @see llp/0010-agent-conventions.rfc.md §Needs-human protocol
   */
  get AGENT_CLI_PROMPT_TIMEOUT_MS() {
    return int('AGENT_CLI_PROMPT_TIMEOUT_MS', 20_000);
  }

  /** @internal Force the webcontainer environment checks to pass */
  get EXPO_FORCE_WEBCONTAINER_ENV() {
    return boolish('EXPO_FORCE_WEBCONTAINER_ENV', false);
  }

  /** @internal Configure other environment variables for headless operations */
  get EXPO_UNSTABLE_HEADLESS() {
    return boolish('EXPO_UNSTABLE_HEADLESS', envIsWebcontainer());
  }
}

export const env = new Env();

export function envIsWebcontainer() {
  // See: https://github.com/unjs/std-env/blob/4b1e03c4efce58249858efc2cc5f5eac727d0adb/src/providers.ts#L134-L143
  return (
    env.EXPO_FORCE_WEBCONTAINER_ENV ||
    (process.env.SHELL === '/bin/jsh' && !!process.versions.webcontainer)
  );
}

export function envIsHeadless() {
  return env.EXPO_UNSTABLE_HEADLESS;
}
