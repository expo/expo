import { ResolutionResult } from '../dependencies';
interface VerifyOptions {
    projectRoot: string;
    verbose?: boolean;
    json?: boolean;
}
/**
 * Verifies the search results by checking whether there are no duplicates.
 */
export declare function verifySearchResults(results: ResolutionResult, options: VerifyOptions): Promise<void>;
export {};
