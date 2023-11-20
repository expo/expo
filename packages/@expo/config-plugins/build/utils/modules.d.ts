export declare function fileExistsAsync(file: string): Promise<boolean>;
export declare function directoryExistsAsync(file: string): Promise<boolean>;
export declare function fileExists(file: string): boolean;
export declare function writeIfDifferentAsync(filePath: string, contents: string): Promise<void>;
