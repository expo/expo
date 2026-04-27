export declare function scanFilesRecursively(parentPath: string, includeDirectory?: (parentPath: string, name: string) => boolean, sort?: boolean): AsyncGenerator<{
    readonly path: string;
    readonly parentPath: string;
    readonly name: string;
}, void, unknown>;
//# sourceMappingURL=utils.d.ts.map