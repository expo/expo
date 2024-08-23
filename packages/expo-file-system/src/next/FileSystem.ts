import ExpoFileSystem from './ExpoFileSystem';
import { Path } from './FileSystem.types';

export class File extends ExpoFileSystem.FileSystemFile {
  constructor(path: Path) {
    super(path);
    this.validatePath();
  }
}

// Cannot use `static` keyword in class declaration because of a runtime error.
File.download = async function download(url: string, to: File | Directory) {
  const outputPath = await ExpoFileSystem.download(url, to);
  return new File(outputPath);
};

export class Directory extends ExpoFileSystem.FileSystemDirectory {
  constructor(path: Path) {
    super(path);
    this.validatePath();
  }
}

// consider module functions as API alternative
export async function write(file: File, contents: string) {
  return file.write(contents);
}
