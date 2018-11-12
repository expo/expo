// @flow

export default {
  get name(): string {
    return 'ExponentFileSystem';
  },
  get documentDirectory() {
    return null;
  },
  get cacheDirectory() {
    return null;
  },
  get bundledAssets() {
    return null;
  },
  get bundleDirectory() {
    return null;
  },
  getInfoAsync() {
    throw new Error(`ExponentFileSystem.getInfoAsync(): Invoked an unimplemented platform method`);
  },
  readAsStringAsync() {
    throw new Error(
      `ExponentFileSystem.readAsStringAsync(): Invoked an unimplemented platform method`
    );
  },
  writeAsStringAsync() {
    throw new Error(
      `ExponentFileSystem.writeAsStringAsync(): Invoked an unimplemented platform method`
    );
  },
  deleteAsync() {
    throw new Error(`ExponentFileSystem.deleteAsync(): Invoked an unimplemented platform method`);
  },
  moveAsync() {
    throw new Error(`ExponentFileSystem.moveAsync(): Invoked an unimplemented platform method`);
  },
  copyAsync() {
    throw new Error(`ExponentFileSystem.copyAsync(): Invoked an unimplemented platform method`);
  },
  makeDirectoryAsync() {
    throw new Error(
      `ExponentFileSystem.makeDirectoryAsync(): Invoked an unimplemented platform method`
    );
  },
  readDirectoryAsync() {
    throw new Error(
      `ExponentFileSystem.readDirectoryAsync(): Invoked an unimplemented platform method`
    );
  },
  downloadAsync() {
    throw new Error(`ExponentFileSystem.downloadAsync(): Invoked an unimplemented platform method`);
  },
  downloadResumableStartAsync() {
    throw new Error(
      `ExponentFileSystem.downloadResumableStartAsync(): Invoked an unimplemented platform method`
    );
  },
  downloadResumablePauseAsync() {
    throw new Error(
      `ExponentFileSystem.downloadResumablePauseAsync(): Invoked an unimplemented platform method`
    );
  },
};
