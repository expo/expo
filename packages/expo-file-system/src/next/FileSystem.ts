import ExpoFileSystem from './ExpoFileSystem';
import { URI } from './FileSystem.types';

export class File extends ExpoFileSystem.FileSystemFile {
  constructor(url: URI) {
    super(url);
    this.validatePath();
  }
}

// Cannot use `static` keyword in class declaration because of a runtime error.
File.downloadFileAsync = async function downloadFileAsync(url: string, to: File | Directory) {
  const outputPath = await ExpoFileSystem.downloadFileAsync(url, to);
  return new File(outputPath);
};

export class Directory extends ExpoFileSystem.FileSystemDirectory {
  constructor(path: Path) {
    super(path);
    this.validatePath();
  }
}
