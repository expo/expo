export { logErrorAndExit, runExpoFeedbackAsync, sendFeedbackAsync } from './cli';
export type { UserSession } from './cli';
export { CLI_FEEDBACK_CATEGORIES, CLI_FEEDBACK_MAX_LENGTH } from './types';
export type {
  CliFeedbackAgentEnvironment,
  CliFeedbackCategory,
  CliFeedbackContextMetadata,
  CliFeedbackMetadata,
  CliFeedbackProjectMetadata,
  CliFeedbackRequest,
  CliFeedbackSandboxEnvironment,
  CliFeedbackSimulatorEnvironment,
  CliFeedbackTelemetryMetadata,
  CliFeedbackUserMetadata,
} from './types';
