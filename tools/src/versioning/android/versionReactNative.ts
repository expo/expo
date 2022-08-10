import spawnAsync from '@expo/spawn-async';
import fs from 'fs-extra';
import path from 'path';

import { copyFileWithTransformsAsync, transformFileAsync } from '../../Transforms';
import { searchFilesAsync } from '../../Utils';
import {
  codegenTransforms,
  hermesTransforms,
  reactNativeTransforms,
} from './reactNativeTransforms';

export async function updateVersionedReactNativeAsync(
  reactNativeSubmoduleRoot: string,
  androidDir: string,
  sdkVersion: string
): Promise<void> {
  const abiVersion = `abi${sdkVersion.replace(/\./g, '_')}`;
  const versionedReactNativeDir = path.join(androidDir, 'versioned-react-native');
  await Promise.all([
    fs.remove(path.join(versionedReactNativeDir, 'ReactAndroid')),
    fs.remove(path.join(versionedReactNativeDir, 'ReactCommon')),
    fs.remove(path.join(versionedReactNativeDir, 'codegen')),
    fs.remove(path.join(versionedReactNativeDir, 'sdks')),
  ]);

  await fs.mkdirp(path.join(versionedReactNativeDir, 'sdks'));
  await fs.copy(
    path.join(androidDir, 'sdks/.hermesversion'),
    path.join(versionedReactNativeDir, 'sdks/.hermesversion')
  );

  // Run and version codegen
  const codegenOutputRoot = path.join(versionedReactNativeDir, 'codegen');
  const tmpCodegenOutputRoot = path.join(versionedReactNativeDir, 'codegen-tmp');
  try {
    await runReactNativeCodegenAndroidAsync(reactNativeSubmoduleRoot, tmpCodegenOutputRoot);
    await versionCodegenDirectoryAsync(tmpCodegenOutputRoot, codegenOutputRoot, abiVersion);
  } finally {
    await fs.remove(tmpCodegenOutputRoot);
  }

  // Copy and version ReactAndroid and ReactCommon
  await versionReactNativeAsync(androidDir, versionedReactNativeDir, abiVersion);

  await versionHermesAsync(versionedReactNativeDir, abiVersion);
}

async function versionHermesAsync(versionedReactNativeDir: string, abiVersion: string) {
  await spawnAsync('./gradlew', [':ReactAndroid:hermes-engine:unzipHermes'], {
    shell: true,
    cwd: versionedReactNativeDir,
    stdio: 'inherit',
  });
  await transformFileAsync(
    path.join(versionedReactNativeDir, 'sdks/hermes/API/hermes/CMakeLists.txt'),
    hermesTransforms(abiVersion)
  );
}

async function versionReactNativeAsync(
  androidDir: string,
  versionedReactNativeDir: string,
  abiVersion: string
) {
  const files = await searchFilesAsync(androidDir, ['./ReactAndroid/**', './ReactCommon/**']);
  for (const file of files) {
    if ((file.match(/\/build\//) && !file.match(/src.*\/build\//)) || file.match(/\/\.cxx\//)) {
      files.delete(file);
    }
  }

  const transforms = reactNativeTransforms(versionedReactNativeDir, abiVersion);
  for (const sourceFile of files) {
    await copyFileWithTransformsAsync({
      sourceFile,
      targetDirectory: versionedReactNativeDir,
      sourceDirectory: androidDir,
      transforms,
    });
  }
}

async function versionCodegenDirectoryAsync(
  tmpCodegenDir: string,
  codegenDir: string,
  abiVersion: string
) {
  const files = await searchFilesAsync(tmpCodegenDir, ['**']);
  const transforms = codegenTransforms(abiVersion);
  for (const sourceFile of files) {
    await copyFileWithTransformsAsync({
      sourceFile,
      targetDirectory: codegenDir,
      sourceDirectory: tmpCodegenDir,
      transforms,
    });
  }
}

async function runReactNativeCodegenAndroidAsync(
  reactNativeSubmoduleRoot: string,
  tmpCodegenOutputRoot: string
) {
  await fs.remove(tmpCodegenOutputRoot);
  await fs.ensureDir(tmpCodegenOutputRoot);

  // generate schema.json from js & flow types
  const genSchemaScript = path.join(
    reactNativeSubmoduleRoot,
    'packages',
    'react-native-codegen',
    'lib',
    'cli',
    'combine',
    'combine-js-to-schema-cli.js'
  );
  const schemaOutputPath = path.join(tmpCodegenOutputRoot, 'schema.json');
  const jsSourceRoot = path.join(reactNativeSubmoduleRoot, 'Libraries');
  await spawnAsync('yarn', ['node', genSchemaScript, schemaOutputPath, jsSourceRoot]);

  // generate code from schema.json
  const genCodeScript = path.join(reactNativeSubmoduleRoot, 'scripts', 'generate-specs-cli.js');
  await spawnAsync('yarn', [
    'node',
    genCodeScript,
    '--platform',
    'android',
    '--schemaPath',
    schemaOutputPath,
    '--outputDir',
    tmpCodegenOutputRoot,
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
