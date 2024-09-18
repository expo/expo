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
    get extension(): string;
    /**
     * File name. Includes the extension.
     */
    get name(): string;
}
export declare class Directory extends ExpoFileSystem.FileSystemDirectory {
    constructor(...uris: (URI | File | Directory)[]);
    get parentDirectory(): Directory;
    list(): (Directory | File)[];
    /**
     * Directory name.
     */
    get name(): string;
}
//# sourceMappingURL=FileSystem.d.ts.map