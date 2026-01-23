import type { ArgError } from 'arg';
export declare const Errors: {
    readonly additionalCommand: (command: string) => never;
    readonly generic: (error: unknown) => never;
    readonly inference: (valueName: string) => never;
    readonly parseArgs: () => never;
    readonly unknownCommand: () => never;
    readonly unknownOption: (argError: ArgError) => never;
};
