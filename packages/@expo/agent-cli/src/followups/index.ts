// @ref llp/0009-smart-followups.rfc.md
// Smart follow-ups: every command exit carries the state-aware next actions, so an agent mid-task
// never has to guess the next command. The builders are pure functions over state the command
// already probed; `report.ts` is the only module that writes anything.

export { buildConfigEffectiveFollowUps, type ConfigEffectiveFollowUpInput } from './config';
export { buildDoctorCheckFollowUps, extractAdviceAction } from './doctor';
export { buildExplainFollowUps, type ExplainFollowUpInput } from './explain';
export { buildChangeFollowUps, type ChangeFollowUpInput } from './change';
export { buildInstallFollowUps, type InstallFollowUpInput } from './install';
export {
  buildTapFollowUps,
  buildTreeFollowUps,
  buildTypeFollowUps,
  type TapFollowUpInput,
  type TreeFollowUpInput,
  type TreeFollowUpNode,
  type TypeFollowUpInput,
} from './interact';
export {
  buildNavigateFollowUps,
  buildPrintUrlFollowUps,
  type NavigateFollowUpInput,
  type PrintUrlFollowUpInput,
} from './navigate';
export { resolveExpoGoLanUrl, resolveLanHost } from './network';
export { dependsOnDevClientSync, easJsonExistsSync } from './projectFiles';
export { buildReloadFollowUps, type ReloadFollowUpInput } from './reload';
export { followUpsEnabled, reportFollowUps, type ReportFollowUpsOptions } from './report';
export { buildRuntimeErrorsFollowUps, type RuntimeErrorsFollowUpInput } from './runtime';
export { buildSkillsSyncFollowUps, type SkillsSyncFollowUpInput } from './skills';
export { buildSmokeFollowUps, type SmokeFollowUpInput } from './smoke';
export {
  buildEasBuildFollowUp,
  buildStartFollowUps,
  buildStartPlanFollowUps,
  resolveDevServerPort,
  DEFAULT_DEV_SERVER_PORT,
  type StartFollowUpInput,
} from './start';
export { buildStatusFollowUps } from './status';
export { buildTypeCheckFollowUps, type TypeCheckFollowUpInput } from './typecheck';
export { capFollowUps, MAX_FOLLOWUPS, type FollowUp } from './types';
