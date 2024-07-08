import ExpoFileSystem from './ExpoFileSystem';
export class File extends ExpoFileSystem.FileSystemNextFile {
    constructor(path) {
        super(path);
        this.validatePath();
    }
}
export class Directory extends ExpoFileSystem.FileSystemNextDirectory {
    constructor(path) {
        super(path);
        this.validatePath();
    }
}
// consider module functions as API alternative
export async function write(file, contents) {
    return file.write(contents);
}
//# sourceMappingURL=FileSystem.js.map