import commander from 'commander';
import { type ResolutionResult } from '../dependencies';
export declare function verifyCommand(cli: commander.CommanderStatic): commander.Command;
interface VerifyOptions {
    appRoot: string;
    verbose?: boolean;
    json?: boolean;
}
/**
 * Verifies the search results by checking whether there are no duplicates.
 */
export declare function verifySearchResults(results: ResolutionResult, options: VerifyOptions): Promise<void>;
export {};
