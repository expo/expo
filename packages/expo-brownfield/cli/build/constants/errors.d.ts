export declare const Errors: {
    readonly additionalCommand: (command: string) => never;
    readonly generic: (error: unknown) => never;
    readonly inference: (valueName: string) => never;
    readonly missingTasksOrRepositories: () => never;
    readonly parseArgs: () => never;
};
