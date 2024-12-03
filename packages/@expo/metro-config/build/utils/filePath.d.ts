/**
 * Convert any platform-specific path to a POSIX path.
 */
export declare function toPosixPath(filePath: string): string;
/**
 * Serialize any platform-specific path to embed within generated code.
 * This includes escaping possible backslashes on Windows, and adding quotes.
 */
export declare function serializePath(filePath: string): string;
