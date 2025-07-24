import { type Minimatch } from 'minimatch';
import { type Platform, type ProjectWorkflow } from './Fingerprint.types';
/**
 * Replicated project workflow detection logic from expo-updates:
 * - https://github.com/expo/expo/blob/9b829e0749b8ff04f55a02b03cd1fefa74c5cd8d/packages/expo-updates/utils/src/workflow.ts
 * - https://github.com/expo/expo/blob/9b829e0749b8ff04f55a02b03cd1fefa74c5cd8d/packages/expo-updates/utils/src/vcs.ts
 */
export declare function resolveProjectWorkflowAsync(projectRoot: string, platform: Platform, fingerprintIgnorePaths: Minimatch[]): Promise<ProjectWorkflow>;
export declare function resolveProjectWorkflowPerPlatformAsync(projectRoot: string, fingerprintIgnorePaths: Minimatch[]): Promise<Record<Platform, ProjectWorkflow>>;
