export declare function initializeGitRepoAsync(repoRoot: string): Promise<void>;
export declare function addAllToGitIndexAsync(repoRoot: string): Promise<void>;
export declare function commitAsync(repoRoot: string, message: string): Promise<void>;
export declare function diffAsync(repoRoot: string, outputPatchFilePath: string, options: string[]): Promise<void>;
export declare function applyPatchAsync(projectRoot: string, patchFilePath: string): Promise<string>;
export declare function getPatchChangedLinesAsync(patchFilePath: string): Promise<number>;
