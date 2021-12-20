import { PatchReactImportsOptions } from './types';
/**
 * Remove all double-quoted react header imports
 * @param dirs target directories to patch
 * @param options PatchReactImportsOptions
 */
export declare function patchReactImportsAsync(dirs: string[], options: PatchReactImportsOptions): Promise<void>;
