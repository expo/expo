export type Path = string;
export declare class Directory {
    constructor(path: Path);
    path: string;
    validatePath(): void;
    delete(): any;
    exists(): boolean;
    create(): any;
    copy(to: Directory | File): any;
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
    copy(to: Directory | File): any;
}
//# sourceMappingURL=FileSystem.types.d.ts.map