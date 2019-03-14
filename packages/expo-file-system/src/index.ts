import * as FileSystem from './FileSystem';
export * from './FileSystem';

declare var module: any;

if (module && module.exports) {
  let wasImportWarningShown = false;
  // @ts-ignore: Temporarily define an export named "FileSystem" for legacy compatibility
  Object.defineProperty(module.exports, 'FileSystem', {
    get() {
      if (!wasImportWarningShown) {
        console.warn(
          `The syntax "import { FileSystem } from 'expo-file-system'" is deprecated. Use "import * as FileSystem from 'expo-file-system'" or import named exports instead. Support for the old syntax will be removed in SDK 34.`
        );
        wasImportWarningShown = true;
      }
      return FileSystem;
    },
  });
}
