import { parseArgs, type ParseArgsConfig } from 'util';
export declare function parseArgsOrExit<T extends ParseArgsConfig>(config: T): ReturnType<typeof parseArgs<T>>;
export declare function printHelp(info: string, usage: string, options: string, extra?: string): never;
