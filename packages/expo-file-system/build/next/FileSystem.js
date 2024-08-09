import ExpoFileSystem from './ExpoFileSystem';
export class File extends ExpoFileSystem.FileSystemFile {
    constructor(path) {
        super(path);
        this.validatePath();
    }
}
export class Directory extends ExpoFileSystem.FileSystemDirectory {
    constructor(path) {
        super(path);
        this.validatePath();
    }
}
// consider module functions as API alternative
export async function write(file, contents) {
    return file.write(contents);
}

export async function download(url, to) {
    const outputPath = await ExpoFileSystem.download(url, to);
    return new File(outputPath);
}
//# sourceMappingURL=FileSystem.js.map
