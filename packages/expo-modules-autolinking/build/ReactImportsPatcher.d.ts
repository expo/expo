import { PatchReactImportsOptions } from './types';
/**
 * Remove all double-quoted react header imports
 * @param dirs target directories to patch
 * @param options PatchReactImportsOptions
 */
export declare function patchReactImportsAsync(dirs: string[], options: PatchReactImportsOptions): Promise<void>;
/**
 * Patch imports from a file
 * @param headerSet prebuilt React-Core header set
 * @param file target patch file
 * @param dryRun true if not writing changes to file
 */
export declare function patchFileAsync(headerSet: Set<string>, file: string, dryRun: boolean): Promise<void>;
