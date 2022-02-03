import fs from 'fs-extra';
import path from 'path';
import { getExpotoolsDir } from '../../Directories';

export const JniLibNames = [
  'libfb',
  'libfolly_json',
  'libglog_init',
  'glog',
  'reactnativejni',
  'reactnativejnifb',
  'csslayout',
  'yoga',
  'fbgloginit',
  'yogajni',
  'jschelpers',
  'packagerconnectionjnifb',
  'privatedata',
  'yogafastmath',
  'fabricjscjni',
  'jscexecutor',
  'libjscexecutor',
  'jsinspector',
  'libjsinspector',
  'fabricjni',
  'turbomodulejsijni',
  'reactnativeblob',
  'jsijniprofiler',
  'hermes',
  'hermes-executor-release',
  'hermes-executor-common-release',
  'hermes-executor-debug',
  'hermes-executor-common-debug',
  'reanimated',
  'hermes-inspector',
  'folly_futures',
  'react_codegen_reactandroidspec',
  'react_nativemodule_core',
  'reactnativeutilsjni',
  'reactperfloggerjni',

  // TODO: considering versioning prebuilt fbjni by patchelf after RN 0.65 which has newer fbjni version.
  // or simply upgrade old SDK to use latest fbjni.
  //
  // 'fbjni',
  // 'libfbjni',
];

// this list is used in the shell scripts as well as directly by expotools
// we read it in here to keep the source of truth in one place
export const getJavaPackagesToRename = async () => {
  const packagesToRename = await fs.readFile(
    path.join(getExpotoolsDir(), 'src/versioning/android/android-packages-to-rename.txt'),
    'utf8'
  );
  return packagesToRename.split('\n').filter((p: string) => !!p);
};
