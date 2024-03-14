import fs from 'fs-extra';
export declare function directoryExistsAsync(file: string): Promise<boolean>;
export declare const ensureDirectoryAsync: (path: string) => Promise<string | undefined>;
export declare const moveAsync: typeof fs.move;
