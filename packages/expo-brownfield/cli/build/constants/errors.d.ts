export declare const Errors: {
    readonly generic: (error: unknown) => never;
    readonly inference: (valueName: string) => never;
    readonly missingTasksOrRepositories: () => never;
    readonly parseArgs: () => never;
};
