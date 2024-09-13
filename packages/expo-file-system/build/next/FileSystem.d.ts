import ExpoFileSystem from './ExpoFileSystem';
import { URI } from './FileSystem.types';
export declare class File extends ExpoFileSystem.FileSystemFile {
    constructor(url: URI);
}
export declare class Directory extends ExpoFileSystem.FileSystemDirectory {
    constructor(uri: URI);
    list(): (File | Directory)[];
}
//# sourceMappingURL=FileSystem.d.ts.map