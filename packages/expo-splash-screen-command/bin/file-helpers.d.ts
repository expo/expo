/**
 * Creates file with given content with possible parent directories creation.
 */
export declare function createDirAndWriteFile(filePath: string, content: string): Promise<void>;
/**
 * Reads given file as UTF-8 with fallback to given content when file is not found.
 */
export declare function readFileWithFallback(filePath: string, fallbackContent?: string): Promise<string>;
