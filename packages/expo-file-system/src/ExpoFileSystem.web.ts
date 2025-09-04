class FileSystemFile {}

class FileSystemDirectory {}

export default {
  FileSystemDirectory,
  FileSystemFile,
  downloadFileAsync: () => Promise.resolve(),
  pickDirectoryAsync: () => Promise.resolve(),
  pickFileAsync: () => Promise.resolve(),
  totalDiskSpace: 0,
  availableDiskSpace: 0,
  documentDirectory: '',
  cacheDirectory: '',
  bundleDirectory: '',
};
