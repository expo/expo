import type { HashSource, NormalizedOptions } from '../Fingerprint.types';
export declare function getBareAndroidSourcesAsync(projectRoot: string, options: NormalizedOptions): Promise<HashSource[]>;
export declare function getBareIosSourcesAsync(projectRoot: string, options: NormalizedOptions): Promise<HashSource[]>;
export declare function getPackageJsonScriptSourcesAsync(projectRoot: string, options: NormalizedOptions): Promise<HashSource[]>;
export declare function getGitIgnoreSourcesAsync(projectRoot: string, options: NormalizedOptions): Promise<HashSource[]>;
export declare function getCoreAutolinkingSourcesFromRncCliAsync(projectRoot: string, options: NormalizedOptions, useRNCoreAutolinkingFromExpo?: boolean): Promise<HashSource[]>;
export declare function getCoreAutolinkingSourcesFromExpoAndroid(projectRoot: string, options: NormalizedOptions, coreAutolinkingTransitiveDeps: string[], useRNCoreAutolinkingFromExpo?: boolean): Promise<HashSource[]>;
export declare function getCoreAutolinkingSourcesFromExpoIos(projectRoot: string, options: NormalizedOptions, useRNCoreAutolinkingFromExpo?: boolean): Promise<HashSource[]>;
