// @ref llp/0009-smart-followups.rfc.md
// Smart follow-ups: every command exit carries the state-aware next actions, so an agent mid-task
// never has to guess the next command. The builders are pure functions over state the command
// already probed; `report.ts` is the only module that writes anything.

export { buildBuildWaitFollowUps, type BuildWaitFollowUpInput } from './builds';
export { buildUndoFollowUps, type UndoFollowUpInput } from './checkpoint';
export { buildConfigEffectiveFollowUps, type ConfigEffectiveFollowUpInput } from './config';
export { buildDevWaitFollowUps, type DevWaitFollowUpInput } from './devWait';
export { buildDoctorCheckFollowUps, extractAdviceAction } from './doctor';
export { buildInstallFollowUps, type InstallFollowUpInput } from './install';
export { buildNavigateFollowUps, type NavigateFollowUpInput } from './navigate';
export { resolveExpoGoLanUrl, resolveLanHost } from './network';
export { dependsOnDevClientSync, easJsonExistsSync } from './projectFiles';
export { followUpsEnabled, reportFollowUps, type ReportFollowUpsOptions } from './report';
export {
  buildRuntimeErrorsFollowUps,
  buildRuntimeNetworkFollowUps,
  type RuntimeErrorsFollowUpInput,
  type RuntimeNetworkFollowUpInput,
} from './runtime';
export { buildSkillsSyncFollowUps, type SkillsSyncFollowUpInput } from './skills';
export {
  buildStartFollowUps,
  buildStartPlanFollowUps,
  resolveDevServerPort,
  DEFAULT_DEV_SERVER_PORT,
  type StartFollowUpInput,
} from './start';
export { buildStatusFollowUps } from './status';
export { buildTypeCheckFollowUps, type TypeCheckFollowUpInput } from './typecheck';
export { capFollowUps, MAX_FOLLOWUPS, type FollowUp } from './types';
