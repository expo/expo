import ExpoFileSystem from './ExpoFileSystem';
import { URI } from './FileSystem.types';
import { dirname, extname, join } from './pathUtilities/path';

export class File extends ExpoFileSystem.FileSystemFile {
  constructor(...uris: URI[]) {
    super(join(...uris));
    this.validatePath();
  }
  /*
   * Directory containing the file.
   */
  get parentDirectory() {
    return new Directory(dirname(this.uri));
  }
  /*
   * File extension (with the dot).
   */
  get extension() {
    return extname(this.uri);
  }
}

// Cannot use `static` keyword in class declaration because of a runtime error.
File.downloadFileAsync = async function downloadFileAsync(url: string, to: File | Directory) {
  const outputPath = await ExpoFileSystem.downloadFileAsync(url, to);
  return new File(outputPath);
};

export class Directory extends ExpoFileSystem.FileSystemDirectory {
  constructor(...uris: URI[]) {
    super(join(...uris));
    this.validatePath();
  }
  /*
   * Directory containing the file.
   */
  get parentDirectory() {
    return new Directory(join(this.uri, '..'));
  }

  list() {
    // We need to wrap it in the JS File/Directory classes, and returning SharedObjects in lists is not supported yet on Android.
    return super
      .listAsRecords()
      .map(({ isDirectory, path }) => (isDirectory ? new Directory(path) : new File(path)));
  }
}
