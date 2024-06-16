import type { HashSource } from './Fingerprint.types';
export declare function sortSources<T extends HashSource>(sources: T[]): T[];
/**
 * Comparator between two sources.
 * This is useful for sorting sources in a consistent order.
 * @returns:
 *  == 0 if a and b are equal,
 *  < 0 if a is less than b,
 *  > 0 if a is greater than b.
 */
export declare function compareSource(a: HashSource, b: HashSource): number;
