import { type Minimatch } from 'minimatch';
import { type Platform, type ProjectWorkflow } from './Fingerprint.types';
/**
 * Replicated project workflow detection logic from eas-cli:
 * https://github.com/expo/eas-cli/blob/25cc5551899d1ed03a09e04fd5f13a9ad485bd3a/packages/eas-cli/src/project/workflow.ts
 */
export declare function resolveProjectWorkflowAsync(projectRoot: string, platform: Platform, fingerprintIgnorePaths: Minimatch[]): Promise<ProjectWorkflow>;
export declare function resolveProjectWorkflowPerPlatformAsync(projectRoot: string, fingerprintIgnorePaths: Minimatch[]): Promise<Record<Platform, ProjectWorkflow>>;
