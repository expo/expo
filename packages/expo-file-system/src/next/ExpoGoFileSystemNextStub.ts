class ExpoGoFileSystemNextStub {
  static readonly FileSystemDirectory = class Directory {
    constructor() {
      throw new Error(
        '`FileSystem.Directory` is not yet available in the Expo Go managed workflow.'
      );
    }
  };
  static readonly FileSystemFile = class File {
    constructor() {
      throw new Error('`FileSystem.File` is not yet available in the Expo Go managed workflow.');
    }
  };

  static async downloadFileAsync(): Promise<string> {
    throw new Error(
      '`FileSystem.downloadFileAsync` is not yet available in the Expo Go managed workflow.'
    );
  }
}

export default ExpoGoFileSystemNextStub;
