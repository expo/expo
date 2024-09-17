import ExpoFileSystem from './ExpoFileSystem';
import { URI } from './FileSystem.types';
import { PathUtilities } from './pathUtilities';
export declare class Paths extends PathUtilities {
    static get cache(): Directory;
    static get document(): Directory;
}
export declare class File extends ExpoFileSystem.FileSystemFile {
    constructor(...uris: (URI | File | Directory)[]);
    get parentDirectory(): Directory;
    get extension(): any;
}
export declare class Directory extends ExpoFileSystem.FileSystemDirectory {
    constructor(...uris: URI[]);
    get parentDirectory(): Directory;
    list(): (Directory | File)[];
}
//# sourceMappingURL=FileSystem.d.ts.map