import type { Command } from '../index';
export type ParsedCommand = {
    transform: string;
    paths: string[];
};
/**
 * Parse argv, validate it against the available transforms, and return the
 * resolved command. Prints help and exits when --help is passed or required
 * arguments are missing.
 */
export declare function parseAndValidateArgs(argv: string[] | undefined): Promise<ParsedCommand>;
/**
 * Expand the given paths into a file list and dispatch them to the jscodeshift
 * runner. Files are split by extension into the `tsx` and `jsx` parser buckets.
 */
export declare function resolveAndDispatch(command: ParsedCommand): Promise<void>;
export declare const runCommand: Command;
