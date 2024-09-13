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
  constructor(uri: URI) {
    super(uri);
    this.validatePath();
  }

  list() {
    // We need to wrap it in the JS File/Directory classes, and returning SharedObjects in lists is not supported yet on Android.
    return super
      .listAsRecords()
      .map(({ isDirectory, path }) => (isDirectory ? new Directory(path) : new File(path)));
  }
}
