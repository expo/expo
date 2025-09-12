class FileSystemFile {
  constructor() {
    console.warn('expo-file-system is not supported on web');
  }
}

class FileSystemDirectory {
  constructor() {
    console.warn('expo-file-system is not supported on web');
  }
}

export default {
  FileSystemDirectory,
  FileSystemFile,
  downloadFileAsync: () => {
    console.warn('expo-file-system is not supported on web');
    return Promise.resolve();
  },
  pickDirectoryAsync: () => {
    console.warn('expo-file-system is not supported on web');
    return Promise.resolve();
  },
  pickFileAsync: () => {
    console.warn('expo-file-system is not supported on web');
    return Promise.resolve();
  },
  get totalDiskSpace(): number {
    console.warn('expo-file-system is not supported on web');
    return 0;
  },
  get availableDiskSpace(): number {
    console.warn('expo-file-system is not supported on web');
    return 0;
  },
  get documentDirectory(): string {
    console.warn('expo-file-system is not supported on web');
    return '';
  },
  get cacheDirectory(): string {
    console.warn('expo-file-system is not supported on web');
    return '';
  },
  get bundleDirectory(): string {
    console.warn('expo-file-system is not supported on web');
    return '';
  },
};
