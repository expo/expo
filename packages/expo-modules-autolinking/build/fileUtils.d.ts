import { GlobOptions } from 'glob';
/**
 * A matching function that takes a file path and its contents and returns a string if it matches, or null otherwise.
 */
type MatchFunctor = (filePath: string, contents: Buffer) => string | null;
/**
 * Check if the file exists.
 */
export declare function fileExistsAsync(file: string): Promise<boolean>;
/**
 * Search files that match the glob pattern and return all matches from the matchFunctor.
 */
export declare function globMatchFunctorAllAsync(globPattern: string, matchFunctor: MatchFunctor, options?: GlobOptions): Promise<string[]>;
/**
 * Search files that match the glob pattern and return the first match from the matchFunctor.
 */
export declare function globMatchFunctorFirstAsync(globPattern: string, matchFunctor: MatchFunctor, options?: GlobOptions): Promise<string | null>;
export {};
