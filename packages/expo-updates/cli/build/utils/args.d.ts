import arg from 'arg';
/**
 * Parse the first argument as a project directory.
 *
 * @returns valid project directory.
 */
export declare function getProjectRoot(args: arg.Result<arg.Spec>): string;
/**
 * Parse args and assert unknown options.
 *
 * @param schema the `args` schema for parsing the command line arguments.
 * @param argv extra strings
 * @returns processed args object.
 */
export declare function assertArgs(schema: arg.Spec, argv: string[]): arg.Result<arg.Spec>;
export declare function requireArg(args: arg.Result<arg.Spec>, name: any): any;
