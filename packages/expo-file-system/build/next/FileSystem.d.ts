import ExpoFileSystem from './ExpoFileSystem';
import { URI } from './FileSystem.types';
export declare class File extends ExpoFileSystem.FileSystemFile {
    constructor(uri: URI);
    get parentDirectory(): Directory;
    get extension(): string;
}
export declare class Directory extends ExpoFileSystem.FileSystemDirectory {
    constructor(uri: URI);
    get parentDirectory(): Directory;
    list(): (File | Directory)[];
}
//# sourceMappingURL=FileSystem.d.ts.map