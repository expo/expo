// @ref llp/0004-smart-start-and-project-state.rfc.md §Plan contract
// The one place that maps `expo start`'s platform flags onto the plan engine's platforms. Both
// commands that forward arguments to `expo start` read it: `@expo/agent-cli dev` to know what to plan for,
// and `@expo/agent-cli start` to know whether the run only serves a web bundle.

import type { PlanPlatform } from './types';

/** Platform selection flags of `expo start`, mapped onto the plan engine's platforms. */
const PLATFORM_FLAGS: Record<string, PlanPlatform> = {
  '--ios': 'ios',
  '-i': 'ios',
  '--android': 'android',
  '-a': 'android',
  '--web': 'web',
  '-w': 'web',
};

/** Whether an argument only tells the plan engine which platform to target. */
export function isPlatformFlag(arg: string): boolean {
  return arg in PLATFORM_FLAGS;
}

/**
 * The platform named on a command line, or `undefined` when it names none.
 *
 * The first platform flag wins, the way `arg` resolves repeated flags.
 */
export function resolvePlatformFlag(argv: string[]): PlanPlatform | undefined {
  return argv.map((arg) => PLATFORM_FLAGS[arg]).find((platform) => platform != null);
}
