import escapeRegExp from 'lodash/escapeRegExp';
import path from 'path';

import { transformString } from '../../Transforms';
import { FileTransform, FileTransforms, StringTransform } from '../../Transforms.types';
import { baseCmakeTransforms } from './cmakeTransforms';
import { JniLibNames } from './libraries';
import { packagesToRename } from './packagesConfig';

function pathFromPkg(pkg: string): string {
  return pkg.replace(/\./g, '/');
}

export function reactNativeTransforms(
  versionedReactNativeRoot: string,
  abiVersion: string
): FileTransforms {
  return {
    path: [],
    content: [
      // Add generated java to sourceSets
      {
        paths: './ReactAndroid/build.gradle',
        find: /(\bsrcDirs = \["src\/main\/java",.+)(\])/,
        replaceWith: `$1, "${path.join(versionedReactNativeRoot, 'codegen')}/java"$2`,
      },
      // Disable codegen plugin
      {
        paths: './ReactAndroid/build.gradle',
        find: /(\bid\("com\.facebook\.react"\)$)/m,
        replaceWith: '// $1',
      },
      {
        paths: './ReactAndroid/build.gradle',
        find: /(^react {[^]+?\n\})/m,
        replaceWith: '/* $1 */',
      },
      {
        paths: './ReactAndroid/build.gradle',
        find: /(\b(preBuild\.)?dependsOn\("generateCodegenArtifactsFromSchema"\))/g,
        replaceWith: '// $1',
      },
      {
        paths: './ReactAndroid/build.gradle',
        find: 'new File(buildDir, "generated/source/codegen/jni/").absolutePath',
        replaceWith: '"../codegen/jni/"',
      },
      {
        paths: './ReactAndroid/build.gradle',
        find: /(externalNativeBuild\s*\{)([\s\S]*?)(\}\s)/g,
        replaceWith: (_, p1, p2, p3) =>
          [
            p1,
            transformString(
              p2,
              JniLibNames.map((lib: string) => ({
                find: new RegExp(`"${escapeRegExp(lib)}"`, 'g'),
                replaceWith: `"${lib}_${abiVersion}"`,
              }))
            ),
            p3,
          ].join(''),
      },
      {
        paths: './ReactAndroid/build.gradle',
        find: /(    prefab\s*\{)([\s\S]*?)(^    \}\s)/gm,
        replaceWith: (_, p1, p2, p3) =>
          [
            p1,
            transformString(
              p2,
              JniLibNames.map((lib: string) => ({
                find: new RegExp(`\\b${escapeRegExp(lib)}\\s+?\\{`, 'g'),
                replaceWith: `${lib}_${abiVersion} {`,
              }))
            ),
            p3,
          ].join(''),
      },
      ...packagesToRename.map((pkg: string) => ({
        paths: [
          './ReactCommon/**/*.{java,kt,h,cpp}',
          './ReactAndroid/src/main/**/*.{java,kt,h,cpp}',
        ],
        find: new RegExp(`${escapeRegExp(pathFromPkg(pkg))}`, 'g'),
        replaceWith: `${abiVersion}/${pathFromPkg(pkg)}`,
      })),
      ...reactNativeCmakeTransforms(abiVersion),
      {
        paths: './ReactAndroid/hermes-engine/build.gradle',
        find: 'libraryName "libhermes"',
        replaceWith: `libraryName "libhermes_${abiVersion}"`,
      },
      {
        paths: './ReactAndroid/hermes-engine/build.gradle',
        find: /(prefab {\s+libhermes)/,
        replaceWith: `$1_${abiVersion}`,
      },
      {
        paths: './ReactAndroid/hermes-engine/build.gradle',
        find: 'targets "libhermes"',
        replaceWith: `targets "libhermes_${abiVersion}"`,
      },
      ...[...JniLibNames, 'fb', 'fbjni'].map((libName) => ({
        paths: '*.{java,kt}',
        find: new RegExp(`SoLoader.loadLibrary\\\("${escapeRegExp(libName)}"\\\)`),
        replaceWith: `SoLoader.loadLibrary("${libName}_${abiVersion}")`,
      })),
      // add HERMES_ENABLE_DEBUGGER for libhermes-executor-release.so
      {
        paths: './ReactAndroid/hermes-engine/build.gradle',
        find: /-DHERMES_ENABLE_DEBUGGER=False/,
        replaceWith: '-DHERMES_ENABLE_DEBUGGER=True',
      },
      {
        paths: './ReactAndroid/hermes-engine/build.gradle',
        find: /\b((configureBuildForHermes|prepareHeadersForPrefab)\.dependsOn\(unzipHermes\))/g,
        replaceWith: '// $1',
      },
      {
        paths: './ReactCommon/hermes/executor/CMakeLists.txt',
        find: /\bdebug (hermes-inspector_)/g,
        replaceWith: '$1',
      },
      {
        paths: './ReactCommon/hermes/executor/CMakeLists.txt',
        find: /if\(\${CMAKE_BUILD_TYPE} MATCHES Debug\)(\n\s*target_compile_options)/g,
        replaceWith: 'if(true)$1',
      },
      {
        paths: './ReactAndroid/src/main/jni/react/hermes/reactexecutor/CMakeLists.txt',
        find: '$<$<CONFIG:Debug>:-DHERMES_ENABLE_DEBUGGER=1>',
        replaceWith: '-DHERMES_ENABLE_DEBUGGER=1',
      },
      {
        // workaround build dependency issue to explicitly link hermes_executor_common to hermes_executor
        // originally, it's hermes_inspector -> hermes_executor_common -> hermes_executor
        paths: './ReactAndroid/src/main/jni/react/hermes/reactexecutor/CMakeLists.txt',
        find: /^(\s+hermes_executor_common.*)$/m,
        replaceWith: `$1\n        hermes_inspector_${abiVersion}`,
      },
    ],
  };
}

export function codegenTransforms(abiVersion: string): FileTransforms {
  return {
    path: [],
    content: [
      ...packagesToRename.map((pkg: string) => ({
        paths: ['**/*.{java,kt,h,cpp}'],
        find: new RegExp(`${escapeRegExp(pathFromPkg(pkg))}`, 'g'),
        replaceWith: `${abiVersion}/${pathFromPkg(pkg)}`,
      })),
      ...reactNativeCmakeTransforms(abiVersion),
    ],
  };
}

function reactNativeCmakeTransforms(abiVersion: string): FileTransform[] {
  const libNames = JniLibNames.map((lib: string): string =>
    lib.startsWith('lib') ? lib.slice(3) : lib
  ).filter((lib: string) => !['fbjni'].includes(lib));
  libNames.push('${HERMES_TARGET_NAME}'); // variable used in hermes-executor CMakeLists.txt
  libNames.push('hermes-engine::libhermes');

  return [
    ...baseCmakeTransforms(abiVersion, libNames).map((transform: StringTransform) => ({
      paths: 'CMakeLists.txt',
      ...transform,
    })),
    {
      paths: 'CMakeLists.txt',
      find: 'add_react_build_subdir(generated/source/codegen/jni)',
      replaceWith: 'add_react_android_subdir(../codegen/jni)',
    },
    {
      paths: 'CMakeLists.txt',
      find: /libhermes\.so/g,
      replaceWith: `libhermes_${abiVersion}.so`,
    },
  ];
}

export function hermesTransforms(abiVersion: string): StringTransform[] {
  return [
    {
      find: /OUTPUT_NAME hermes/g,
      replaceWith: `OUTPUT_NAME hermes_${abiVersion}`,
    },
    {
      find: /libhermes/g,
      replaceWith: `libhermes_${abiVersion}`,
    },
    {
      find: /jsi/g,
      replaceWith: `jsi_${abiVersion}`,
    },
  ];
}
