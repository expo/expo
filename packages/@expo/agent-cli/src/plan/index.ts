// @ref llp/0004-smart-start-and-project-state.rfc.md
// The plan engine of LLP 0004: one deterministic answer to "what must run to get this app on a
// device?". Consumed by `@expo/agent-cli dev` and `@expo/agent-cli dev --plan`, and later by the post-install
// impact classifier and the MCP tool of the same name.

export { decideStartPlan } from './decide';
export { emitStartPlan } from './emit';
export { formatStartPlan, formatTimeClass } from './format';
export { readLastBuildFingerprints, recordLastBuildFingerprint } from './lastBuild';
export type { StartPlanMode } from './emit';
export type {
  DecideStartPlanOptions,
  LastBuildFingerprints,
  NativePlatform,
  PlanPlatform,
  StartPlanRule,
} from './types';
