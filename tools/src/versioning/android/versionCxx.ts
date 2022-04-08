import assert from 'assert';
import fs from 'fs-extra';
import glob from 'glob-promise';
import path from 'path';
import spawnAsync from '@expo/spawn-async';

import { ANDROID_DIR, PACKAGES_DIR } from '../../Constants';
import { transformFileAsync } from '../../Transforms';

export async function versionCxxExpoModulesAsync(version: string) {
  await versionExpoAvAsync(version);
}

async function versionExpoAvAsync(version: string) {
  const srcRoot = path.join(PACKAGES_DIR, 'expo-av', 'android');
  const abiName = `abi${version.replace(/\./g, '_')}`;

  try {
    await patchCMake();
    await patchGradle();
    await patchCxxFilesForJavaDescriptor();

    await spawnAsync('./gradlew', [':expo-av:copyReleaseJniLibsProjectOnly'], {
      cwd: ANDROID_DIR,
    });
    const versionedAbiRoot = path.join(
      ANDROID_DIR,
      'versioned-abis',
      `expoview-${abiName}`,
      'src',
      'main'
    );
    await copySoPrebuiltLibs(versionedAbiRoot);
    await rewriteSystemLoadLibs(versionedAbiRoot);
  } catch (e) {
    throw e;
  } finally {
    await resetPatches();
  }

  async function patchCMake() {
    const file = path.join(srcRoot, 'CMakeLists.txt');
    await fs.copyFile(file, `${file}.bak`);

    await transformFileAsync(file, [
      {
        find: /\b(expo-av)\b/g,
        replaceWith: `$1_${abiName}`,
      },
      {
        // Patches linked libs in `find_library()`
        find: /(\s)(jsi|reactnativejni)(\s)/g,
        replaceWith: `$1$2_${abiName}$3`,
      },
    ]);
  }

  async function patchGradle() {
    const file = path.join(srcRoot, 'build.gradle');
    await fs.copyFile(file, `${file}.bak`);

    let contents = await fs.readFile(file, 'utf8');
    const searchAnchor = new RegExp(
      `(\
def REACT_NATIVE_DIR =.+
def RN_BUILD_FROM_SOURCE =.+
def RN_SO_DIR =(.|\n)+
def RN_AAR_DIR =.+
)`,
      'gm'
    );

    const index = contents.search(searchAnchor);
    assert(
      index >= 0,
      `Cannot find the searchAnchor from '${file}'. There might be some changes in the gradle file. Please update the versioning patch synchronously`
    );

    const overrideContents = `\
REACT_NATIVE_DIR = "\${rootDir}/versioned-react-native"
RN_BUILD_FROM_SOURCE = false
RN_SO_DIR = "\${buildDir}/reactandroid-${abiName}-*/jni"
RN_AAR_DIR = "\${rootDir}/versioned-abis/expoview-${abiName}/maven"
`;
    contents = contents.replace(searchAnchor, `$1${overrideContents}`);
    await fs.writeFile(file, contents);
  }

  async function patchCxxFilesForJavaDescriptor() {
    const files = ['JAVManager.h', 'JPlayerData.h'].map((filename) =>
      path.join(srcRoot, 'src', 'main', 'cpp', filename)
    );
    await Promise.all(
      files.map(async (file) => {
        await fs.copyFile(file, `${file}.bak`);
        await transformFileAsync(file, [
          {
            find: /\b(static auto constexpr kJavaDescriptor = "L)(expo\/modules\/av\/)/g,
            replaceWith: `$1${abiName}/$2`,
          },
        ]);
      })
    );
  }

  async function resetPatches() {
    const backupFiles = await glob('**/*.bak', { cwd: srcRoot, absolute: true });
    return Promise.all(
      backupFiles.map((backupFile) => fs.rename(backupFile, backupFile.replace(/\.bak$/, '')))
    );
  }

  async function copySoPrebuiltLibs(versionedAbiRoot: string) {
    const archs = ['armeabi-v7a', 'arm64-v8a', 'x86', 'x86_64'];
    const soFilename = `libexpo-av_${abiName}.so`;
    await Promise.all(
      archs.map((arch) => {
        const srcSoFile = path.join(
          srcRoot,
          'build',
          'intermediates',
          'library_jni',
          'release',
          'jni',
          arch,
          soFilename
        );
        const dstSoFile = path.join(versionedAbiRoot, 'jniLibs', arch, soFilename);
        return fs.copyFile(srcSoFile, dstSoFile);
      })
    );
  }

  async function rewriteSystemLoadLibs(versionedAbiRoot: string) {
    const loadLibFile = path.join(
      versionedAbiRoot,
      'java',
      abiName,
      'expo',
      'modules',
      'av',
      'AVManager.java'
    );
    await transformFileAsync(loadLibFile, [
      {
        find: /\bSystem\.loadLibrary\("expo-av"\);/g,
        replaceWith: `System.loadLibrary("expo-av_${abiName}");`,
      },
    ]);
  }
}
