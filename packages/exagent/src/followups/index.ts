// @ref llp/0009-smart-followups.rfc.md
// Smart follow-ups: every command exit carries the state-aware next actions, so an agent mid-task
// never has to guess the next command. The builders are pure functions over state the command
// already probed; `report.ts` is the only module that writes anything.

export { buildContextFollowUps } from './context';
export { buildInstallFollowUps, type InstallFollowUpInput } from './install';
export { buildNavigateFollowUps, type NavigateFollowUpInput } from './navigate';
export { resolveExpoGoLanUrl, resolveLanHost } from './network';
export { dependsOnDevClientSync, easJsonExistsSync } from './projectFiles';
export { followUpsEnabled, reportFollowUps, type ReportFollowUpsOptions } from './report';
export { buildRuntimeErrorsFollowUps, type RuntimeErrorsFollowUpInput } from './runtime';
export { buildSkillsSyncFollowUps, type SkillsSyncFollowUpInput } from './skills';
export {
  buildStartFollowUps,
  buildStartPlanFollowUps,
  resolveDevServerPort,
  DEFAULT_DEV_SERVER_PORT,
  type StartFollowUpInput,
} from './start';
export { buildStatusFollowUps } from './status';
export { capFollowUps, MAX_FOLLOWUPS, type FollowUp } from './types';
