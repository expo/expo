import spawnAsync from '@expo/spawn-async';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';

import { EXPO_DIR } from '../../Constants';
import { GitDirectory } from '../../Git';
import logger from '../../Logger';
import { transformFilesAsync } from '../../Transforms';
import type { FileTransform } from '../../Transforms.types';
import { searchFilesAsync } from '../../Utils';

const TRANSFORM_HEADERS_API = ['hermes', 'DebuggerAPI'];
const TRANSFORM_HEADERS_PUBLIC = [
  'RuntimeConfig',
  'CrashManager',
  'CtorConfig',
  'DebuggerTypes',
  'GCConfig',
  'GCTripwireContext',
];

const VERSIONED_JSI_DIR = 'versioned-jsi';
const REACT_NATIVE_FORK_DIR = path.join(EXPO_DIR, 'react-native-lab', 'react-native');

interface VersionHermesOptions {
  // true to show verbose building log
  verbose?: boolean;

  // specify custom hermes download dir, use temp dir by default
  hermesDir?: string;

  // specify hermes git ref, use the version from *react-native-lab/react-native/sdks/.hermesversion* by default
  hermesGitRef?: string;
}

function createHermesTransforms(versionName: string, versionedJsiDir: string): FileTransform[] {
  return [
    {
      find: /\b(facebook|hermes)::/g,
      replaceWith: `${versionName}$1::`,
    },
    {
      find: /\bnamespace (facebook|hermes)/g,
      replaceWith: `namespace ${versionName}$1`,
    },
    {
      find: /#include <jsi\/([^>]+)\.h>/g,
      replaceWith: `#include <${versionName}jsi/${versionName}$1.h>`,
    },
    {
      find: /\b(HERMES_NON_CONSTEXPR|_HERMES_CTORCONFIG_)/g,
      replaceWith: `${versionName}$1`,
    },
    {
      find: new RegExp(
        `(#include ["<](hermes\\/)?)((${TRANSFORM_HEADERS_API.join('|')})\\.h[">])`,
        'g'
      ),
      replaceWith: `$1${versionName}$3`,
    },
    {
      find: new RegExp(
        `(#include ["<]hermes\\/Public\\/)((${TRANSFORM_HEADERS_PUBLIC.join('|')})\\.h[">])`,
        'g'
      ),
      replaceWith: `$1${versionName}$2`,
    },
    {
      paths: `${VERSIONED_JSI_DIR}/${versionName}jsi/CMakeLists.txt`,
      find: /\b(jsi\.cpp)\b/g,
      replaceWith: `${versionName}$1`,
    },
    {
      paths: 'CMakeLists.txt',
      find: 'add_subdirectory(${HERMES_JSI_DIR}/jsi ${CMAKE_CURRENT_BINARY_DIR}/jsi)',
      replaceWith: `add_subdirectory(\${HERMES_JSI_DIR}/${versionName}jsi \${CMAKE_CURRENT_BINARY_DIR}/jsi)`,
    },
    {
      paths: 'utils/build-apple-framework.sh',
      find: 'cmake -S . -B build_host_hermesc',
      replaceWith: `cmake -S . -B build_host_hermesc -DJSI_DIR=${versionedJsiDir}`,
    },
    {
      // support specifying JSI_PATH by environment variable
      paths: 'utils/build-apple-framework.sh',
      find: 'JSI_PATH="$REACT_NATIVE_PATH/ReactCommon/jsi"',
      replaceWith: 'JSI_PATH="${JSI_PATH:-$REACT_NATIVE_PATH/ReactCommon/jsi}"',
    },
    // framework versioning
    {
      paths: 'API/hermes/CMakeLists.txt',
      find: 'OUTPUT_NAME hermes',
      replaceWith: `OUTPUT_NAME ${versionName}hermes`,
    },
    {
      paths: 'API/hermes/CMakeLists.txt',
      find: 'MACOSX_FRAMEWORK_IDENTIFIER dev.hermesengine.',
      replaceWith: `MACOSX_FRAMEWORK_IDENTIFIER dev.${versionName}hermesengine.`,
    },
    {
      paths: 'utils/*.sh',
      find: 'hermes.framework',
      replaceWith: `${versionName}hermes.framework`,
    },
  ];
}

async function transformHermesAsync(
  hermesRoot: string,
  reactNativeRoot: string,
  versionName: string
) {
  // use the build scripts from react-native to build hermes
  await Promise.all(
    [
      'utils/build-apple-framework.sh',
      'utils/build-ios-framework.sh',
      'utils/build-mac-framework.sh',
    ].map((file) =>
      fs.copy(
        path.join(REACT_NATIVE_FORK_DIR, 'sdks', 'hermes-engine', file),
        path.join(hermesRoot, file)
      )
    )
  );
  // workaround for 0.69 as it doesn't support specifying custom JSI path
  await spawnAsync('wget', [
    '-O',
    path.join(hermesRoot, 'utils/build-apple-framework.sh'),
    'https://raw.githubusercontent.com/facebook/react-native/0.70-stable/sdks/hermes-engine/utils/build-apple-framework.sh',
  ]);

  // copy versioned jsi files from react-native
  const versionedJsiDir = path.join(hermesRoot, VERSIONED_JSI_DIR);
  await fs.copy(path.join(reactNativeRoot, 'ReactCommon', 'jsi'), versionedJsiDir);
  await fs.rename(
    path.join(versionedJsiDir, 'jsi'),
    path.join(versionedJsiDir, `${versionName}jsi`)
  );

  // transform content
  const currDir = process.cwd();
  process.chdir(hermesRoot); // change cwd to hermesRoot for transformFilesAsync writing in relative path
  const transformDirs = ['API', 'include', 'lib', 'public', 'tools', 'utils'].join(',');
  const files = Array.from(
    await searchFilesAsync(hermesRoot, [
      `{${transformDirs}}/**/*.{h,cpp,mm}`,
      '**/CMakeLists.txt',
      '**/*.sh',
    ])
  );
  await transformFilesAsync(files, createHermesTransforms(versionName, versionedJsiDir));
  process.chdir(currDir);

  // transform file names
  await Promise.all(
    TRANSFORM_HEADERS_API.map((file) => {
      const dir = path.join(hermesRoot, 'API', 'hermes');
      return fs.move(path.join(dir, `${file}.h`), path.join(dir, `${versionName}${file}.h`));
    })
  );
  await Promise.all(
    TRANSFORM_HEADERS_PUBLIC.map((file) => {
      const dir = path.join(hermesRoot, 'public', 'hermes', 'Public');
      return fs.move(path.join(dir, `${file}.h`), path.join(dir, `${versionName}${file}.h`));
    })
  );
}

function downloadHermesSourceAsync(downloadDir: string, ref: string) {
  return GitDirectory.shallowCloneAsync(downloadDir, 'https://github.com/facebook/hermes.git', ref);
}

function buildHermesAsync(hermesRoot: string, options?: VersionHermesOptions) {
  const versionedJsiDir = path.join(hermesRoot, VERSIONED_JSI_DIR);
  return spawnAsync('./utils/build-ios-framework.sh', [], {
    cwd: hermesRoot,
    shell: true,
    env: {
      ...process.env,
      JSI_PATH: versionedJsiDir,
    },
    stdio: options?.verbose ? 'inherit' : 'ignore',
  });
}

async function removeUnusedHeaders(hermesRoot: string, versionName: string) {
  const destRoot = path.join(hermesRoot, 'destroot');

  // remove jsi headers
  await fs.remove(path.join(destRoot, 'include', 'jsi'));

  // remove unused and unversioned headers
  const files = Array.from(
    await searchFilesAsync(path.join(destRoot, 'include', 'hermes'), [`**/!(${versionName})*`], {
      absolute: true,
    })
  );
  await Promise.all(files.map((file) => fs.remove(file)));
}

export async function createVersionedHermesTarball(
  versionedReactNativeRoot: string,
  versionName: string,
  options?: VersionHermesOptions
): Promise<string> {
  const hermesGitRef =
    options?.hermesGitRef ??
    (await fs.readFile(path.join(REACT_NATIVE_FORK_DIR, 'sdks', '.hermesversion'), 'utf8'));
  if (!hermesGitRef) {
    throw new Error('Cannot get bundled hermes version from react-native.');
  }

  const hermesRoot = options?.hermesDir ?? path.join(os.tmpdir(), 'hermes');
  await fs.ensureDir(hermesRoot);

  logger.log('Downloading hermes source code');
  await downloadHermesSourceAsync(hermesRoot, hermesGitRef);

  logger.log('Versioning hermes source code');
  await transformHermesAsync(hermesRoot, versionedReactNativeRoot, versionName);

  logger.log('Building hermes');
  await buildHermesAsync(hermesRoot, options);

  const tarball = path.join(hermesRoot, `${versionName}hermes.tar.gz`);
  logger.log(`Archiving hermes tarball: ${tarball}`);
  await removeUnusedHeaders(hermesRoot, versionName);
  await spawnAsync('tar', ['cvfz', tarball, 'destroot'], {
    cwd: hermesRoot,
    stdio: options?.verbose ? 'inherit' : 'ignore',
  });

  return tarball;
}
