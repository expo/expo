export declare const taskAll: <T, R>(inputs: T[], map: (input: T, index: number) => Promise<R>) => Promise<R[]>;
export declare function scanFilesRecursively(parentPath: string, includeDirectory?: (parentPath: string, name: string) => boolean, sort?: boolean): AsyncGenerator<{
    readonly path: string;
    readonly parentPath: string;
    readonly name: string;
}, void, unknown>;
