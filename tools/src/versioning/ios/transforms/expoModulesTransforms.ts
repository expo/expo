import { Podspec } from '../../../CocoaPods';
import { FileTransforms } from '../../../Transforms.types';
import { VersioningModuleConfig } from '../../types';

const objcFilesPattern = '*.{h,m,mm,cpp}';
const swiftFilesPattern = '*.swift';

export function getCommonExpoModulesTransforms(prefix: string): FileTransforms {
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
        find: /\b(Expo|EX|UM|EAS)([^/]*\.)(h|m|mm|cpp)\b/,
        replaceWith: `${prefix}$1$2$3`,
      },
      {
        // versioning category files, e.g. RCTComponentData+Privates.h
        find: /\b(RCT)([^/]*)\+([^/]*\.)(h|m|mm|cpp)\b/,
        replaceWith: `${prefix}$1$2+$3$4`,
      },
      {
        // expo-gl
        find: /\bEXWebGL([^/]*)\.def\b/,
        replaceWith: `${prefix}EXWebGL$1.def`,
      },
    ],
    content: [
      {
        find: /\bReact(?!Common)/g,
        replaceWith: `${prefix}React`,
      },
      {
        // Prefix symbols and imports.
        find: /\b(EX|UM|RCT|ExpoBridgeModule)/g,
        replaceWith: `${prefix}$1`,
      },

      // Only Swift

      {
        paths: swiftFilesPattern,
        find: /\bimport (Expo|EX|EAS)(\w+)/g,
        replaceWith: `import ${prefix}$1$2`,
      },
      {
        paths: swiftFilesPattern,
        find: /@objc\((Expo|EX|EAS)/g,
        replaceWith: `@objc(${prefix}$1`,
      },
      {
        paths: swiftFilesPattern,
        find: /(for)?[rR](eactTag)/gi,
        replaceWith: (_, p1, p2) => `${p1 ?? ''}${p1 ? prefix : prefix.toLowerCase()}R${p2}`,
      },
      {
        // Prefixes name of the Expo modules provider.
        paths: swiftFilesPattern,
        find: /"(ExpoModulesProvider)"/g,
        replaceWith: `"${prefix}$1"`,
      },

      // Only Objective-C

      {
        // Prefix `Expo*` frameworks in imports.
        paths: objcFilesPattern,
        find: /#(import |include |if __has_include\()<(Expo|EAS)(.*?)\//g,
        replaceWith: `#$1<${prefix}$2$3/`,
      },
      {
        paths: objcFilesPattern,
        find: /#(import |include |if __has_include\()<(.*?)\/(Expo|EAS)(.*?)\.h>/g,
        replaceWith: `#$1<$2/${prefix}$3$4.h>`,
      },
      {
        // Rename Swift compatibility headers from frameworks starting with `Expo`.
        paths: objcFilesPattern,
        find: /#import "(Expo|EAS)(.+?)-Swift\.h"/g,
        replaceWith: `#import "${prefix}$1$2-Swift.h"`,
      },
      {
        paths: objcFilesPattern,
        find: /@import (Expo|EX|EAS)(\w+)/g,
        replaceWith: `@import ${prefix}$1$2`,
      },
      {
        // Prefixes imports from other React Native libs
        paths: objcFilesPattern,
        find: new RegExp(`#(import|include) <(ReactCommon|jsi)/(${prefix})?`, 'g'),
        replaceWith: `#$1 <${prefix}$2/${prefix}`,
      },
      {
        // Prefixes versionable namespaces
        paths: objcFilesPattern,
        find: /\bnamespace (expo|facebook)\b/g,
        replaceWith: `namespace ${prefix}$1`,
      },
      {
        // Prefixes usages of versionable namespaces
        paths: objcFilesPattern,
        find: /\b(expo|facebook)::/g,
        replaceWith: `${prefix}$1::`,
      },

      // Prefixes versionable namespaces (react namespace is already prefixed with uppercased "R")
      {
        paths: objcFilesPattern,
        find: /\busing namespace react;/g,
        replaceWith: `using namespace ${prefix}React;`,
      },
      {
        paths: objcFilesPattern,
        find: /::react(::|;)/g,
        replaceWith: `::${prefix}React$1`,
      },
      {
        paths: objcFilesPattern,
        find: /\bnamespace react(\s+[^=])/g,
        replaceWith: `namespace ${prefix}React$1`,
      },
      {
        paths: objcFilesPattern,
        find: /\b((include|import|__has_include).*\/)(JSCRuntime\.h)/g,
        replaceWith: `$1${prefix}$3`,
      },
      {
        paths: 'EXGLImageUtils.cpp',
        find: '#define STB_IMAGE_IMPLEMENTATION',
        replaceWith: '',
      },

      // Prefix umbrella header imports
      {
        paths: '*.h',
        // Use negative look ahead regexp for `prefix` to prevent duplicated versioning
        find: new RegExp(`[\b/](!?${prefix})(\w+-umbrella\.h)\b`, 'g'),
        replaceWith: `${prefix}$1`,
      },

      {
        // Dynamically remove the prefix from the "moduleName" method in the view manager adapter.
        paths: 'EXViewManagerAdapter.{m,mm}',
        find: /return (NSStringFromClass\(self\));/g,
        replaceWith: `NSString *className = $1;\n  return [className hasPrefix:@"${prefix}"] ? [className substringFromIndex:${prefix.length}] : className;`,
      },
    ],
  };
}

export function getVersioningModuleConfig(prefix: string, moduleName: string): VersioningModuleConfig {
  const config: Record<string, VersioningModuleConfig> = {
    'expo-constants': {
      mutatePodspec: removeScriptPhasesAndResourceBundles,
    },
    'expo-updates': {
      mutatePodspec: removeScriptPhasesAndResourceBundles,
    },
    'expo-screen-orientation': {
      // Versioned expo-screen-orientation shouldn't include its own registry, it should use the unversioned one instead.
      transforms: {
        path: [],
        content: [
          {
            paths: 'ScreenOrientationRegistry.swift',
            find: /(.|\n)*/,
            replaceWith: [
              '// The original implementations of `ScreenOrientationRegistry` and `ScreenOrientationController`',
              '// were removed from this file as part of the versioning process to always use their "unversioned" version.',
              'import ExpoScreenOrientation',
              '',
              'typealias ScreenOrientationRegistry = ExpoScreenOrientation.ScreenOrientationRegistry',
              'typealias ScreenOrientationController = ExpoScreenOrientation.ScreenOrientationController',
              ''
            ].join('\n'),
          },
        ]
      },
      mutatePodspec(podspec: Podspec) {
        // Versioned screen orientation must depend on unversioned copy to use unversioned singleton object.
        const unversionedName = podspec.name.replace(prefix, '');

        if (!podspec.dependencies) {
          podspec.dependencies = {};
        }
        podspec.dependencies[unversionedName] = [];
      },
    }
  };
  return config[moduleName] ?? {};
}

function removeScriptPhasesAndResourceBundles(podspec: Podspec): void {
  // For expo-updates and expo-constants in Expo Go, we don't need app.config and app.manifest in versioned code.
  delete podspec['script_phases'];
  delete podspec['resource_bundles'];
}
