export type Path = string;
export declare class Directory {
    constructor(path: Path);
    path: string;
    validatePath(): void;
    delete(): any;
    exists(): boolean;
    create(): any;
}
export declare class File {
    constructor(path: Path);
    path: string;
    validatePath(): any;
    text(): string;
    write(content: string): any;
    delete(): any;
    exists(): boolean;
    create(): any;
}
//# sourceMappingURL=FileSystem.types.d.ts.map