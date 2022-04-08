import spawnAsync from '@expo/spawn-async';
import fs from 'fs-extra';
import path from 'path';

import { transformFileAsync } from '../../Transforms';

export async function updateVersionedReactNativeAsync(
  reactNativeRoot: string,
  androidDir: string,
  versionedReactNativeRoot: string
): Promise<void> {
  // Clone whole directories
  const copyDirs = ['ReactAndroid', 'ReactCommon'];
  await Promise.all(
    copyDirs.map((subdir) => fs.remove(path.join(versionedReactNativeRoot, subdir)))
  );
  await Promise.all(
    copyDirs.map((subdir) =>
      fs.copy(path.join(androidDir, subdir), path.join(versionedReactNativeRoot, subdir))
    )
  );

  // Run codegen
  const codegenOutputRoot = path.join(versionedReactNativeRoot, 'codegen');
  await fs.remove(codegenOutputRoot);
  await runReactNativeCodegenAndroidAsync(reactNativeRoot, codegenOutputRoot);

  // Patch ReactAndroid/build.gradle for codegen
  const buildGradlePath = path.join(versionedReactNativeRoot, 'ReactAndroid', 'build.gradle');
  await transformFileAsync(buildGradlePath, [
    // Update codegen folder to our customized folder
    {
      find: /"REACT_GENERATED_SRC_DIR=.+?",/,
      replaceWith: `"REACT_GENERATED_SRC_DIR=${versionedReactNativeRoot}",`,
    },
    // Add generated java to sourceSets
    {
      find: /(\bsrcDirs = \["src\/main\/java",.+)(])/,
      replaceWith: `$1, "${codegenOutputRoot}/java"$2`,
    },
    // Disable codegen plugin
    {
      find: /(\bid\("com\.facebook\.react"\)$)/m,
      replaceWith: '// $1',
    },
    {
      find: /(^react {[^]+?\n\})/m,
      replaceWith: '/* $1 */',
    },
    {
      find: /(\bpreBuild\.dependsOn\("generateCodegenArtifactsFromSchema"\))/,
      replaceWith: '// $1',
    },
  ]);
}

async function runReactNativeCodegenAndroidAsync(
  reactNativeRoot: string,
  codegenOutputRoot: string
) {
  await fs.ensureDir(codegenOutputRoot);

  // generate schema.json from js & flow types
  const genSchemaScript = path.join(
    reactNativeRoot,
    'packages',
    'react-native-codegen',
    'lib',
    'cli',
    'combine',
    'combine-js-to-schema-cli.js'
  );
  const schemaOutputPath = path.join(codegenOutputRoot, 'schema.json');
  const jsSourceRoot = path.join(reactNativeRoot, 'Libraries');
  await spawnAsync('yarn', ['node', genSchemaScript, schemaOutputPath, jsSourceRoot]);

  // generate code from schema.json
  const genCodeScript = path.join(reactNativeRoot, 'scripts', 'generate-specs-cli.js');
  await spawnAsync('yarn', [
    'node',
    genCodeScript,
    '--platform',
    'android',
    '--schemaPath',
    schemaOutputPath,
    '--outputDir',
    codegenOutputRoot,
    '--libraryName', 
    'rncore',
    '--javaPackageName',
    'com.facebook.fbreact.specs',
  ]);
}

export async function renameHermesEngine(versionedReactAndroidPath: string, version: string) {
  const abiVersion = version.replace(/\./g, '_');
  const abiName = `abi${abiVersion}`;
  const prebuiltHermesMkPath = path.join(
    versionedReactAndroidPath,
    'src',
    'main',
    'jni',
    'first-party',
    'hermes',
    'Android.mk'
  );
  const versionedHermesLibName = `libhermes_${abiName}.so`;
  await transformFileAsync(prebuiltHermesMkPath, [
    {
      find: /^(LOCAL_SRC_FILES\s+:=\s+jni\/\$\(TARGET_ARCH_ABI\))\/libhermes.so$/gm,
      replaceWith: `$1/${versionedHermesLibName}`,
    },
  ]);

  const buildGradlePath = path.join(versionedReactAndroidPath, 'build.gradle');
  // patch prepareHermes task to rename copied library and update soname
  // the diff is something like that:
  //
  // ```diff
  // --- android/versioned-react-native/ReactAndroid/build.gradle.orig       2021-08-14 00:40:18.000000000 +0800
  // +++ android/versioned-react-native/ReactAndroid/build.gradle    2021-08-14 00:40:58.000000000 +0800
  // @@ -114,7 +114,7 @@
  //      into("$thirdPartyNdkDir/folly")
  //  }
  //
  // -task prepareHermes(dependsOn: createNativeDepsDirectories, type: Copy) {
  // +task prepareHermes(dependsOn: createNativeDepsDirectories) {
  //      def hermesPackagePath = findNodeModulePath(projectDir, "hermes-engine")
  //      if (!hermesPackagePath) {
  //          throw new GradleScriptException("Could not find the hermes-engine npm package", null)
  // @@ -126,12 +126,29 @@
  //      }
  //
  //      def soFiles = zipTree(hermesAAR).matching({ it.include "**/*.so" })
  // -
  // +    copy {
  // +
  //      from soFiles
  //      from "src/main/jni/first-party/hermes/Android.mk"
  //      into "$thirdPartyNdkDir/hermes"
  // +
  // +        rename '(.+).so', '$1_abi43_0_0.so'
  // +    }
  // +    exec {
  // +        commandLine("patchelf", "--set-soname", "libhermes_abi43_0_0.so", "$thirdPartyNdkDir/hermes/jni/arm64-v8a/libhermes_abi43_0_0.so")
  // +    }
  // +    exec {
  // +        commandLine("patchelf", "--set-soname", "libhermes_abi43_0_0.so", "$thirdPartyNdkDir/hermes/jni/armeabi-v7a/libhermes_abi43_0_0.so")
  // +    }
  // +    exec {
  // +        commandLine("patchelf", "--set-soname", "libhermes_abi43_0_0.so", "$thirdPartyNdkDir/hermes/jni/x86/libhermes_abi43_0_0.so")
  // +    }
  // +    exec {
  // +        commandLine("patchelf", "--set-soname", "libhermes_abi43_0_0.so", "$thirdPartyNdkDir/hermes/jni/x86_64/libhermes_abi43_0_0.so")
  // +    }
  //  }
  //
  // +
  //  task downloadGlog(dependsOn: createNativeDepsDirectories, type: Download) {
  //      src("https://github.com/google/glog/archive/v${GLOG_VERSION}.tar.gz")
  //      onlyIfNewer(true)
  // ```
  await transformFileAsync(buildGradlePath, [
    {
      // reset `prepareHermes` task from Copy type to generic type then we can do both copy and exec.
      find: /^(task prepareHermes\(dependsOn: .+), type: Copy(\).+$)/m,
      replaceWith: '$1$2',
    },
    {
      // wrap copy task and append exec tasks
      find: /(^\s*def soFiles = zipTree\(hermesAAR\).+)\n([\s\S]+?)^\}/gm,
      replaceWith: `\
$1
    copy {
        $2
        rename '(.+).so', '$$1_abi${abiVersion}.so'
    }
    exec {
        commandLine("patchelf", "--set-soname", "${versionedHermesLibName}", "$thirdPartyNdkDir/hermes/jni/arm64-v8a/${versionedHermesLibName}")
    }
    exec {
        commandLine("patchelf", "--set-soname", "${versionedHermesLibName}", "$thirdPartyNdkDir/hermes/jni/armeabi-v7a/${versionedHermesLibName}")
    }
    exec {
        commandLine("patchelf", "--set-soname", "${versionedHermesLibName}", "$thirdPartyNdkDir/hermes/jni/x86/${versionedHermesLibName}")
    }
    exec {
        commandLine("patchelf", "--set-soname", "${versionedHermesLibName}", "$thirdPartyNdkDir/hermes/jni/x86_64/${versionedHermesLibName}")
    }
}
`,
    },
  ]);
}
