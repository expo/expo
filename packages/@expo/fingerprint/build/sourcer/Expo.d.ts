import type { HashSource, NormalizedOptions } from '../Fingerprint.types';
export declare function getExpoConfigSourcesAsync(projectRoot: string, options: NormalizedOptions): Promise<HashSource[]>;
export declare function getEasBuildSourcesAsync(projectRoot: string, options: NormalizedOptions): Promise<HashSource[]>;
export declare function getExpoAutolinkingAndroidSourcesAsync(projectRoot: string, options: NormalizedOptions): Promise<HashSource[]>;
export declare function getExpoAutolinkingIosSourcesAsync(projectRoot: string, options: NormalizedOptions): Promise<HashSource[]>;
