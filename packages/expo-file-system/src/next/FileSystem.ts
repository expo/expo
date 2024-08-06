import ExpoFileSystem from './ExpoFileSystem';
import { Path } from './FileSystem.types';

export class File extends ExpoFileSystem.FileSystemFile {
  constructor(path: Path) {
    super(path);
    this.validatePath();
  }
}

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

export async function download(url: string, to: Directory | File) {
  const outputPath = await ExpoFileSystem.download(url, to);
  return new File(outputPath);
}
