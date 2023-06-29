/// <reference types="node" />
type LoadOptions = {
    silent?: boolean;
    force?: boolean;
};
export declare function isEnabled(): boolean;
export declare function createControlledEnvironment(): {
    load: (projectRoot: string, options?: LoadOptions) => NodeJS.ProcessEnv;
    get: (projectRoot: string, options?: LoadOptions) => Record<string, string | undefined>;
    _getForce: (projectRoot: string, options?: LoadOptions) => Record<string, string | undefined>;
};
export declare function getFiles(mode: string | undefined, { silent }?: Pick<LoadOptions, 'silent'>): string[];
export {};
