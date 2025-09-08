class FileSystemFile {
  constructor() {
    throw new Error('FileSystem is not supported on web');
  }
}

class FileSystemDirectory {
  constructor() {
    throw new Error('FileSystem is not supported on web');
  }
}

export default {
  FileSystemDirectory,
  FileSystemFile,
  downloadFileAsync: () => Promise.reject(new Error('FileSystem is not supported on web')),
  pickDirectoryAsync: () => Promise.reject(new Error('FileSystem is not supported on web')),
  pickFileAsync: () => Promise.reject(new Error('FileSystem is not supported on web')),
  get totalDiskSpace(): number {
    throw new Error('FileSystem is not supported on web');
  },
  get availableDiskSpace(): number {
    throw new Error('FileSystem is not supported on web');
  },
  get documentDirectory(): string {
    throw new Error('FileSystem is not supported on web');
  },
  get cacheDirectory(): string {
    throw new Error('FileSystem is not supported on web');
  },
  get bundleDirectory(): string {
    throw new Error('FileSystem is not supported on web');
  },
};
