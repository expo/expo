export declare class Directory {
    constructor(...uris: (string | File | Directory)[]);
    /**
     * Represents the directory URI.
     */
    readonly uri: string;
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
     * A boolean representing if a directory exists. `true` if the directory exists, `false` otherwise.
     */
    exists: boolean;
    /**
     * Creates a directory.
     */
    create(): void;
    /**
     * Copies a directory.
     */
    copy(destination: Directory | File): any;
    /**
     * Moves a directory. Updates the `uri` property that now points to the new location.
     */
    move(destination: Directory | File): any;
    /**
     * @hidden
     * Lists the contents of a directory. Should not be used directly, as it returns a list of paths.
     * This function is internal and will be removed in the future (when returning arrays of shared objects is supported).
     */
    listAsRecords(): {
        isDirectory: string;
        path: string;
    }[];
}
export declare class File {
    constructor(...uris: (string | File | Directory)[]);
    /**
     * Represents the file URI.
     */
    readonly uri: string;
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
     * Retrieves content of the file as base64.
     * @returns The contents of the file as a base64 string.
     */
    base64(): string;
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
     * A boolean representing if a file exists. `true` if the file exists, `false` otherwise.
     */
    exists: boolean;
    /**
     * Creates a file.
     */
    create(): void;
    /**
     * Copies a file.
     */
    copy(destination: Directory | File): any;
    /**
     * Moves a directory. Updates the `uri` property that now points to the new location.
     */
    move(destination: Directory | File): any;
    /**
     * A static method that downloads a file from the network.
     * @param url - The URL of the file to download.
     * @param destination - The destination directory or file. If a directory is provided, the resulting filename will be determined based on the response headers.
     * @returns A promise that resolves to the downloaded file.
     *
     * @example
     * ```ts
     * const file = await File.downloadFileAsync("https://example.com/image.png", new Directory(Paths.document));
     * ```
     */
    static downloadFileAsync(url: string, destination: Directory | File): Promise<File>;
    /**
     * A size of the file in bytes. Null if the file does not exist or it cannot be read.
     */
    size: number | null;
    /**
     * An md5 hash of the file. Null if the file does not exist or it cannot be read.
     */
    md5: string | null;
}
//# sourceMappingURL=ExpoFileSystem.types.d.ts.map