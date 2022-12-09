import type { HashSource } from './Fingerprint.types';
/**
 * Strip duplicated sources, mainly for duplicated file or dir
 */
export declare function dedupSources(sources: HashSource[], projectRoot: string): HashSource[];
/**
 * When two sources are duplicated, merge `src`'s reasons into `dst`
 */
export declare function mergeSourceWithReasons(dst: HashSource, src: HashSource): HashSource;
