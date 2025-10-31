import type { HashSource } from './Fingerprint.types';
export declare function sortSources<T extends HashSource>(sources: T[]): T[];
/**
 * Recursively sorts a JSON object or array for stable hashing.
 *
 * Heuristics:
 * - Object keys are sorted alphabetically (values can be mixed types)
 * - Arrays of primitives are sorted naturally (handles mixed primitive types)
 * - Arrays of objects are sorted by common keys (name, id, key, type) if all objects have them
 * - Mixed-type arrays (e.g., [1, {}, "a"]) maintain original order after recursive sorting
 *
 * Note: Assumes arrays are homogeneous for optimal sorting. Mixed-type arrays will not be reordered,
 * which may not produce stable hashes if input order varies.
 */
export declare function sortConfig<T>(data: T): T;
/**
 * Comparator between two sources.
 * This is useful for sorting sources in a consistent order.
 * @returns:
 *  == 0 if a and b are equal,
 *  < 0 if a is less than b,
 *  > 0 if a is greater than b.
 */
export declare function compareSource(a: HashSource, b: HashSource): number;
