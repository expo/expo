import type { PlatformString } from './types';
export declare const mkdir: (path: string, recursive?: boolean) => void;
export declare const createFileFromTemplate: (template: string, at: string, platform?: PlatformString, variables?: Record<string, unknown>) => void;
export declare const createFileFromTemplateAs: (template: string, at: string, as: string, platform?: PlatformString, variables?: Record<string, unknown>) => void;
export declare const readFromTemplate: (template: string, platform?: PlatformString, variables?: Record<string, unknown>) => string;
/**
 * Applies a unified diff patch to a file.
 * @param patchFile - The name of the patch file in the patches directory
 * @param targetFilePath - The absolute path to the file to patch
 */
export declare const applyPatchToFile: (patchFile: string, targetFilePath: string) => void;
