import type { HashSource, NormalizedOptions } from '../Fingerprint.types';
export declare function getBareAndroidSourcesAsync(projectRoot: string, options: NormalizedOptions): Promise<HashSource[]>;
export declare function getBareIosSourcesAsync(projectRoot: string, options: NormalizedOptions): Promise<HashSource[]>;
export declare function getPackageJsonScriptSourcesAsync(projectRoot: string, options: NormalizedOptions): Promise<HashSource[]>;
export declare function getGitIgnoreSourcesAsync(projectRoot: string, options: NormalizedOptions): Promise<HashSource[]>;
export declare function getRncliAutolinkingSourcesAsync(projectRoot: string, options: NormalizedOptions): Promise<HashSource[]>;
