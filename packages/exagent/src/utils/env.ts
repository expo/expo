import { boolish } from 'getenv';

/**
 * Environment variables `exagent` reads. This is a deliberately small subset of the
 * `@expo/cli` `Env` class: the process boundary means `exagent` forwards the rest to
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
   * @see llp/0009-smart-followups.rfc.md §Design
   */
  get EXAGENT_NO_FOLLOWUPS() {
    return boolish('EXAGENT_NO_FOLLOWUPS', false);
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
