#!/usr/bin/env node
import { logErrorAndExit, runExpoFeedbackAsync } from './cli';

export type {
  CliFeedbackAgentEnvironment,
  CliFeedbackCategory,
  CliFeedbackContextMetadata,
  CliFeedbackMetadata,
  CliFeedbackProjectMetadata,
  CliFeedbackRequest,
  CliFeedbackSandboxEnvironment,
  CliFeedbackTelemetryMetadata,
} from './types';

runExpoFeedbackAsync().catch(logErrorAndExit);
