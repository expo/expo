/**
 * A string representing a file or directory path.
 */
export type Path = string;
/**
 * Represents a directory on the file system.
 */
export declare class Directory {
    /**
     * Creates an instance of a directory.
     * @param path -  A string representing an arbitrary location on the file system. The location does not need to exist, or it may already contain a file.
     * @example
     * ```ts
     * const directory = new Directory("file:///path/to/directory");
     * ```
     */
    constructor(path: Path);
    /**
     * Represents the directory path.
     */
    readonly path: Path;
    /**
     * Validates a directory path.
     * @hidden This method is not meant to be used directly. It is called by the JS constructor.
     */
    validatePath(): void;
    /**
     * Deletes a directory.
     */
    delete(): void;
    /**
     * Checks if a directory exists.
     *
     * @returns `true` if the directory exists, `false` otherwise.
     */
    exists(): boolean;
    /**
     * Creates a directory.
     */
    create(): void;
    /**
     * Copies a directory.
     */
    copy(destination: Directory | File): any;
    /**
     * Moves a directory.
     */
    move(destination: Directory | File): any;
}
/**
 * Represents a file on the file system.
 */
export declare class File {
    /**
     * Creates an instance of File.
     *
     * @param path - A string representing an arbitrary location on the file system. The location does not need to exist, or it may already contain a directory.
     */
    constructor(path: Path);
    /**
     * Represents the file path.
     */
    readonly path: string;
    /**
     * Validates a directory path.
     * @hidden This method is not meant to be used directly. It is called by the JS constructor.
     */
    validatePath(): void;
    /**
     * Retrieves text from the file.
     * @returns The contents of the file as string.
     */
    text(): string;
    /**
     * Writes content to the file.
     * @param content - The content to write into the file.
     */
    write(content: string): void;
    /**
     * Deletes a file.
     */
    delete(): void;
    /**
     * Checks if a file exists.
     * @returns `true` if the file exists, `false` otherwise.
     */
    exists(): boolean;
    /**
     * Creates a file.
     */
    create(): void;
    /**
     * Copies a file.
     */
    copy(destination: Directory | File): any;
    /**
     * Moves a directory.
     */
    move(destination: Directory | File): any;
    /**
     * Downloads a file from the network.
     * @param url - The URL of the file to download.
     * @param destination - The destination directory or file. If a destination is provided, the resulting filename will be determined based on the response headers.
     * @returns A promise that resolves to the downloaded file.
     */
    static downloadFileAsync(url: string, destination: Directory | File): Promise<File>;
}
//# sourceMappingURL=FileSystem.types.d.ts.map