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

class FileSystemUploadTask {
  start() {
    console.warn('expo-file-system is not supported on web');
    return Promise.resolve({ body: '', status: 0, headers: {} });
  }
  cancel() {
    console.warn('expo-file-system is not supported on web');
  }
}

class FileSystemDownloadTask {
  start() {
    console.warn('expo-file-system is not supported on web');
    return Promise.resolve(null);
  }
  pause() {
    console.warn('expo-file-system is not supported on web');
    return { resumeData: '' };
  }
  resume() {
    console.warn('expo-file-system is not supported on web');
    return Promise.resolve(null);
  }
  cancel() {
    console.warn('expo-file-system is not supported on web');
  }
}

export default {
  FileSystemDirectory,
  FileSystemFile,
  FileSystemUploadTask,
  FileSystemDownloadTask,
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
