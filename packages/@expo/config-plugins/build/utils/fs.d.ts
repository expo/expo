/** A basic function that copies a single file to another file location. */
export declare function copyFilePathToPathAsync(src: string, dest: string): Promise<void>;
/** Remove a single file (not directory). Returns `true` if a file was actually deleted. */
export declare function removeFile(filePath: string): boolean;
