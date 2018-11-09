// @flow

class ExponentFileSystem {
  get name(): string {
    return 'ExponentFileSystem';
  }

  get documentDirectory() {
    return null;
  }
  get cacheDirectory() {
    return null;
  }

  get bundledAssets() {
    return null;
  }

  get bundleDirectory() {
    return null;
  }

  getInfoAsync() {}

  readAsStringAsync() {}

  writeAsStringAsync() {}

  deleteAsync() {}

  moveAsync() {}

  copyAsync() {}

  makeDirectoryAsync() {}

  readDirectoryAsync() {}

  downloadAsync() {}

  downloadResumableStartAsync() {}

  downloadResumablePauseAsync() {}
}

export default new ExponentFileSystem();
