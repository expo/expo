import { UnavailabilityError } from 'expo-modules-core';
import { Platform } from 'react-native';

import ExpoFileSystem from './ExpoFileSystem';
import { Path } from './FileSystem.types';

export class File extends ExpoFileSystem.FileSystemFile {
  constructor(path: Path) {
    super(path);
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

Directory.getSharedContainerUri = function getSharedContainerUri(
  appGroup: string
): Directory | null {
  if (Platform.OS === 'ios') {
    if (!ExpoFileSystem.getSharedContainerUri) {
      throw new UnavailabilityError('expo-file-system', 'getSharedContainerUri');
    }
    return new Directory(ExpoFileSystem.getSharedContainerUri(appGroup));
  } else {
    return null;
  }
};

// consider module functions as API alternative
export async function write(file: File, contents: string) {
  return file.write(contents);
}
