export type CreateOptions = {
    /**
     * Whether to create intermediate directories if they do not exist.
     * @default false
     */
    intermediates?: boolean;
    /**
     * Whether to overwrite the file or directory if it exists.
     * @default false
     */
    overwrite?: boolean;
};
export declare class Directory {
    /**
     * Creates an instance of a directory.
     * @param uris An array of: `file:///` string URIs, `File` instances, `Directory` instances representing an arbitrary location on the file system. The location does not need to exist, or it may already contain a file.
     * @example
     * ```ts
     * const directory = new Directory("file:///path/to/directory");
     * ```
     */
    constructor(...uris: (string | File | Directory)[]);
    /**
     * Represents the directory URI. The field is read-only, but it may change as a result of calling some methods such as `move`.
     */
    readonly uri: string;
    /**
     * Validates a directory path.
     * @hidden This method is not meant to be used directly. It is called by the JS constructor.
     */
    validatePath(): void;
    /**
     * Deletes a directory. Also deletes all files and directories inside the directory.
     *
     * @throws Error if the directory does not exist or cannot be deleted.
     */
    delete(): void;
    /**
     * A boolean representing if a directory exists and can be accessed.
     */
    exists: boolean;
    /**
     * Creates a directory that the current uri points to.
     *
     * @throws Error if the containing folder doesn't exist, the application has no read access to it or the directory (or a file with the same path) already exists.
     */
    create(options?: CreateOptions): void;
    /**
     * Copies a directory.
     */
    copy(destination: Directory | File): void;
    /**
     * Moves a directory. Updates the `uri` property that now points to the new location.
     */
    move(destination: Directory | File): void;
    /**
     * @hidden
     * Lists the contents of a directory. Should not be used directly, as it returns a list of paths.
     * This function is internal and will be removed in the future (when returning arrays of shared objects is supported).
     */
    listAsRecords(): {
        isDirectory: string;
        uri: string;
    }[];
    /**
     * Lists the contents of a directory.
     */
    list(): (Directory | File)[];
    /**
     * A size of the directory in bytes. Null if the directory does not exist, or it cannot be read.
     */
    size: number | null;
}
export type DownloadOptions = {
    /**
     * The headers to send with the request.
     */
    headers?: {
        [key: string]: string;
    };
};
/**
 * Represents a file on the file system.
 */
export declare class File {
    /**
     * Creates an instance of File.
     *
     * @param uris A `file:///` URI representing an arbitrary location on the file system. The location does not need to exist, or it may already contain a directory.
     */
    constructor(...uris: (string | File | Directory)[]);
    /**
     * Represents the file URI. The field is read-only, but it may change as a result of calling some methods such as `move`.
     */
    readonly uri: string;
    /**
     * @hidden This method is not meant to be used directly. It is called by the JS constructor.
     * Validates a directory path.
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
     * Retrieves byte content of the entire file.
     * @returns The contents of the file as a Uint8Array.
     */
    bytes(): Uint8Array;
    /**
     * Writes content to the file.
     * @param content The content to write into the file.
     */
    write(content: string | Uint8Array): void;
    /**
     * Deletes a file.
     *
     * @throws Error if the directory does not exist or cannot be deleted.
     */
    delete(): void;
    /**
     * Retrieves an object containing properties of a file
     * @throws Error If the application does not have read access to the file, or if the path does not point to a file (e.g., it points to a directory).
     * @returns An object with file metadata (e.g., size, creation date, etc.).
     */
    info(options?: InfoOptions): FileInfo;
    /**
     * A boolean representing if a file exists. `true` if the file exists, `false` otherwise.
     * Also, `false` if the application does not have read access to the file.
     */
    exists: boolean;
    /**
     * Creates a file.
     *
     * @throws Error if the containing folder doesn't exist, the application has no read access to it or the file (or directory with the same path) already exists.
     */
    create(options?: CreateOptions): void;
    /**
     * Copies a file.
     */
    copy(destination: Directory | File): void;
    /**
     * Moves a directory. Updates the `uri` property that now points to the new location.
     */
    move(destination: Directory | File): void;
    /**
     * Returns a FileHandle object that can be used to read and write data to the file.
     * @throws Error if the file does not exist or cannot be opened.
     */
    open(): FileHandle;
    /**
     * A static method that downloads a file from the network.
     * @param url - The URL of the file to download.
     * @param destination - The destination directory or file. If a directory is provided, the resulting filename will be determined based on the response headers.
     * @returns A promise that resolves to the downloaded file.
     * @example
     * ```ts
     * const file = await File.downloadFileAsync("https://example.com/image.png", new Directory(Paths.document));
     * ```
     */
    static downloadFileAsync(url: string, destination: Directory | File, options?: DownloadOptions): Promise<File>;
    /**
     * A size of the file in bytes. Null if the file does not exist, or it cannot be read.
     */
    size: number | null;
    /**
     * A md5 hash of the file. Null if the file does not exist, or it cannot be read.
     */
    md5: string | null;
    /**
     * A last modification time of the file expressed in milliseconds since epoch. Returns a Null if the file does not exist, or it cannot be read.
     */
    modificationTime: number | null;
    /**
     * A creation time of the file expressed in milliseconds since epoch. Returns null if the file does not exist, cannot be read or the Android version is earlier than API 26.
     */
    creationTime: number | null;
    /**
     * A mime type of the file. Null if the file does not exist, or it cannot be read.
     */
    type: string | null;
}
export declare class FileHandle {
    close(): void;
    readBytes(length: number): Uint8Array;
    writeBytes(bytes: Uint8Array): void;
    offset: number | null;
    size: number | null;
}
export type FileInfo = {
    /**
     * Indicates whether the file exists.
     */
    exists: boolean;
    /**
     * A `file://` URI pointing to the file. This is the same as the `fileUri` input parameter.
     */
    uri?: string;
    /**
     * The size of the file in bytes.
     */
    size?: number;
    /**
     * The last modification time of the file expressed in milliseconds since epoch.
     */
    modificationTime?: number;
    /**
     * A creation time of the file expressed in milliseconds since epoch. Returns null if the Android version is earlier than API 26.
     */
    creationTime?: number;
    /**
     * Present if the `md5` option was truthy. Contains the MD5 hash of the file.
     */
    md5?: string;
};
export type InfoOptions = {
    /**
     * Whether to return the MD5 hash of the file.
     * @default false
     */
    md5?: boolean;
};
export type PathInfo = {
    /**
     * Indicates whether the path exists. Returns true if it exists; false if the path does not exist or if there is no read permission.
     */
    exists: boolean;
    /**
     * Indicates whether the path is a directory. Returns true or false if the path exists; otherwise, returns null.
     */
    isDirectory: boolean | null;
};
//# sourceMappingURL=ExpoFileSystem.types.d.ts.map