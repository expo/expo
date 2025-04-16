type MetroFormattedError = {
    description: string;
    filename?: string;
    lineNumber?: number;
};
export declare class MetroBuildError extends Error {
    errors?: MetroFormattedError[] | undefined;
    ansiError: string;
    constructor(message: string, errors?: MetroFormattedError[] | undefined);
}
export declare class MetroPackageResolutionError extends MetroBuildError {
    errors: MetroFormattedError[] | undefined;
    /** "/Users/evanbacon/Documents/GitHub/expo/apps/router-e2e/__e2e__/05-errors/app/index.tsx" */
    originModulePath: string;
    /** "foobar" */
    targetModuleName: string;
    cause: {
        /** ["/Users/evanbacon/Documents/GitHub/expo/apps/router-e2e/__e2e__/05-errors/app/node_modules",] */
        dirPaths: string[];
        /** [] */
        extraPaths: string[];
    } | {
        candidates: {
            file: {
                type: 'sourceFile';
                /** "__e2e__/05-errors/app/foobar" */
                filePathPrefix: string;
                /** ["",".web.ts",".ts"] */
                candidateExts: string[];
            };
            dir: {
                type: 'sourceFile';
                filePathPrefix: string;
                candidateExts: string[];
            };
        };
        name: 'Error';
        message: string;
        stack: string;
    };
    constructor(message: string, errors: MetroFormattedError[] | undefined, 
    /** "/Users/evanbacon/Documents/GitHub/expo/apps/router-e2e/__e2e__/05-errors/app/index.tsx" */
    originModulePath: string, 
    /** "foobar" */
    targetModuleName: string, cause: {
        /** ["/Users/evanbacon/Documents/GitHub/expo/apps/router-e2e/__e2e__/05-errors/app/node_modules",] */
        dirPaths: string[];
        /** [] */
        extraPaths: string[];
    } | {
        candidates: {
            file: {
                type: 'sourceFile';
                /** "__e2e__/05-errors/app/foobar" */
                filePathPrefix: string;
                /** ["",".web.ts",".ts"] */
                candidateExts: string[];
            };
            dir: {
                type: 'sourceFile';
                filePathPrefix: string;
                candidateExts: string[];
            };
        };
        name: 'Error';
        message: string;
        stack: string;
    });
}
export declare function stripAnsi(str: string): string;
export {};
//# sourceMappingURL=metro-build-errors.d.ts.map