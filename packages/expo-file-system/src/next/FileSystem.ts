import ExpoFileSystem from './ExpoFileSystem';
import { Path } from './FileSystem.types';

if (!ExpoFileSystem) {
  console.warn(
    "No native ExponentFileSystem module found, are you sure the expo-file-system's module is linked properly?"
  );
}

export class File extends ExpoFileSystem.FileSystemNextFile {
  constructor(path: Path) {
    super(path);
    this.validatePath();
  }
}

export class Directory extends ExpoFileSystem.FileSystemNextDirectory {
  constructor(path: Path) {
    super(path);
    this.validatePath();
  }
}

// consider module functions as API alternative
export async function write(file: File, contents: string) {
  return file.write(contents);
}
