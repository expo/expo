import ExpoFileSystem from './ExpoFileSystem';
import { Path } from './FileSystem.types';
export declare class File extends ExpoFileSystem.FileSystemNextFile {
    constructor(path: Path);
}
export declare class Directory extends ExpoFileSystem.FileSystemNextDirectory {
    constructor(path: Path);
}
export declare function write(file: File, contents: string): Promise<any>;
//# sourceMappingURL=FileSystem.d.ts.map