import { FileTransforms } from '../../../Transforms.types';

const objcFilesPattern = '*.{h,m,mm}';
const swiftFilesPattern = '*.swift';

export function expoModulesTransforms(prefix: string): FileTransforms {
  return {
    path: [
      // Here we prefix names of Objective-C/C++ files.
      // There is no need to do the same for Swift files
      // as we don't change the symbols inside. In Swift we don't use `EX` nor `UM`
      // for symbols as the framework name takes part of the symbol signature,
      // so there is no way we'll get duplicate symbols compilation errors.
      // Files starting with `Expo` needs to be prefixed though,
      // for umbrella headers (e.g. `ExpoModulesCore.h`).
      {
        find: /\b(Expo|EX|UM)([^/]*\.)(h|m|mm|cpp)\b/,
        replaceWith: `${prefix}$1$2$3`,
      },
    ],
    content: [
      {
        find: /\bReact/g,
        replaceWith: `${prefix}React`,
      },
      {
        // Prefix symbols and imports.
        find: /\b(EX|UM|RCT)/g,
        replaceWith: `${prefix}$1`,
      },

      // Only Swift

      {
        paths: swiftFilesPattern,
        find: /\bimport (Expo|EX)(\w+)/g,
        replaceWith: `import ${prefix}$1$2`,
      },
      {
        paths: swiftFilesPattern,
        find: /@objc\((Expo|EX)\)/g,
        replaceWith: `@objc(${prefix}$1)`,
      },

      // Only Objective-C

      {
        // Prefix `Expo*` frameworks in imports.
        paths: objcFilesPattern,
        find: /#import <(Expo.*?)\//g,
        replaceWith: `#import <${prefix}$1/`,
      },
      {
        paths: objcFilesPattern,
        find: /#import <(.*?)\/(Expo.*?)\.h>/g,
        replaceWith: `#import <$1/${prefix}$2.h>`,
      },
      {
        // Rename Swift compatibility headers from frameworks starting with `Expo`.
        paths: objcFilesPattern,
        find: /#import "(Expo.+?)-Swift\.h"/g,
        replaceWith: `#import "${prefix}$1-Swift.h"`,
      },
      {
        // Unprefix imports to unversionable (e.g. expo-gl-cpp) modules.
        paths: [objcFilesPattern, 'EXGL'],
        find: new RegExp(`#import <${prefix}(EXGL_CPP)\\b`),
        replaceWith: '#import <$1',
      },
      {
        // Prefixes Objective-C name of the Swift modules provider.
        paths: ['EXNativeModulesProxy.m'],
        find: 'NSClassFromString(@"ExpoModulesProvider")',
        replaceWith: `NSClassFromString(@"${prefix}ExpoModulesProvider")`
      }
    ],
  };
}
