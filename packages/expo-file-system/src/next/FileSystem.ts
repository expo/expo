import ExpoFileSystem from './ExpoFileSystem';
import { URI } from './FileSystem.types';
import { PathUtilities } from './pathUtilities';

export class Paths extends PathUtilities {
  static get cache() {
    return new Directory(ExpoFileSystem.cacheDirectory);
  }
  static get document() {
    return new Directory(ExpoFileSystem.documentDirectory);
  }
}

export class File extends ExpoFileSystem.FileSystemFile {
  constructor(...uris: (URI | File | Directory)[]) {
    super(Paths.join(...uris));
    this.validatePath();
  }
  /*
   * Directory containing the file.
   */
  get parentDirectory() {
    return new Directory(Paths.dirname(this.uri));
  }
  /*
   * File extension (with the dot).
   */
  get extension() {
    return Paths.extname(this.uri);
  }
}

// Cannot use `static` keyword in class declaration because of a runtime error.
File.downloadFileAsync = async function downloadFileAsync(url: string, to: File | Directory) {
  const outputPath = await ExpoFileSystem.downloadFileAsync(url, to);
  return new File(outputPath);
};

export class Directory extends ExpoFileSystem.FileSystemDirectory {
  constructor(...uris: URI[]) {
    super(Paths.join(...uris));
    this.validatePath();
  }
  /*
   * Directory containing the file.
   */
  get parentDirectory() {
    return new Directory(Paths.join(this.uri, '..'));
  }

  list() {
    // We need to wrap it in the JS File/Directory classes, and returning SharedObjects in lists is not supported yet on Android.
    return super
      .listAsRecords()
      .map(({ isDirectory, path }) => (isDirectory ? new Directory(path) : new File(path)));
  }
}
