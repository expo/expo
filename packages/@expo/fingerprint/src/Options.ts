import fs from 'fs/promises';
import type { IMinimatch } from 'minimatch';
import os from 'os';
import path from 'path';

import { loadConfigAsync } from './Config';
import { satisfyExpoVersion } from './ExpoVersions';
import type { Config, NormalizedOptions, Options } from './Fingerprint.types';
import { SourceSkips } from './sourcer/SourceSkips';
import { buildPathMatchObjects } from './utils/Path';

export const FINGERPRINT_IGNORE_FILENAME = '.fingerprintignore';

export const DEFAULT_IGNORE_PATHS = [
  FINGERPRINT_IGNORE_FILENAME,
  // Android
  '**/android/build/**/*',
  '**/android/.cxx/**/*',
  '**/android/.gradle/**/*',
  '**/android/app/build/**/*',
  '**/android/app/.cxx/**/*',
  '**/android/app/.gradle/**/*',
  '**/android-annotation/build/**/*',
  '**/android-annotation/.cxx/**/*',
  '**/android-annotation/.gradle/**/*',
  '**/android-annotation-processor/build/**/*',
  '**/android-annotation-processor/.cxx/**/*',
  '**/android-annotation-processor/.gradle/**/*',

  // Often has different line endings, thus we have to ignore it
  '**/android/gradlew.bat',

  // Android gradle plugins
  '**/*-gradle-plugin/build/**/*',
  '**/*-gradle-plugin/.cxx/**/*',
  '**/*-gradle-plugin/.gradle/**/*',

  // iOS
  '**/ios/Pods/**/*',
  '**/ios/build/**/*',
  '**/ios/.xcode.env.local',
  '**/ios/**/project.xcworkspace',
  '**/ios/*.xcworkspace/xcuserdata/**/*',

  // System files that differ from machine to machine
  '**/.DS_Store',

  // Ignore all expo configs because we will read expo config in a HashSourceContents already
  'app.config.ts',
  'app.config.js',
  'app.config.json',
  'app.json',

  // Ignore nested node_modules
  '**/node_modules/**/node_modules/**',

  // Ignore default javascript files when calling `getConfig()`
  '**/node_modules/@babel/**/*',
  '**/node_modules/@expo/**/*',
  '**/node_modules/@jridgewell/**/*',
  '**/node_modules/expo/config.js',
  '**/node_modules/expo/config-plugins.js',
  `**/node_modules/{${[
    'chalk',
    'debug',
    'escape-string-regexp',
    'getenv',
    'graceful-fs',
    'has-flag',
    'imurmurhash',
    'js-tokens',
    'json5',
    'picocolors',
    'lines-and-columns',
    'require-from-string',
    'resolve-from',
    'signal-exit',
    'sucrase',
    'supports-color',
    'ts-interface-checker',
    'write-file-atomic',
  ].join(',')}}/**/*`,
];

export const DEFAULT_SOURCE_SKIPS = SourceSkips.PackageJsonAndroidAndIosScriptsIfNotContainRun;

export async function normalizeOptionsAsync(
  projectRoot: string,
  options?: Options
): Promise<NormalizedOptions> {
  const config = await loadConfigAsync(projectRoot, options?.silent ?? false);
  return {
    // Defaults
    platforms: ['android', 'ios'],
    concurrentIoLimit: os.cpus().length,
    hashAlgorithm: 'sha1',
    sourceSkips: DEFAULT_SOURCE_SKIPS,
    // Options from config
    ...config,
    // Explicit options
    ...options,
    // These options are computed by both default and explicit options, so we put them last.
    enableReactImportsPatcher:
      options?.enableReactImportsPatcher ??
      config?.enableReactImportsPatcher ??
      satisfyExpoVersion(projectRoot, '<52.0.0') ??
      false,
    ignorePathMatchObjects: await collectIgnorePathsAsync(
      projectRoot,
      config?.ignorePaths,
      options
    ),
  };
}

async function collectIgnorePathsAsync(
  projectRoot: string,
  pathsFromConfig: Config['ignorePaths'],
  options: Options | undefined
): Promise<IMinimatch[]> {
  const ignorePaths = [
    ...DEFAULT_IGNORE_PATHS,
    ...(pathsFromConfig ?? []),
    ...(options?.ignorePaths ?? []),
    ...(options?.dirExcludes?.map((dirExclude) => `${dirExclude}/**/*`) ?? []),
  ];

  const fingerprintIgnorePath = path.join(projectRoot, FINGERPRINT_IGNORE_FILENAME);
  try {
    const fingerprintIgnore = await fs.readFile(fingerprintIgnorePath, 'utf8');
    const fingerprintIgnoreLines = fingerprintIgnore.split('\n');
    for (const line of fingerprintIgnoreLines) {
      const trimmedLine = line.trim();
      if (trimmedLine) {
        ignorePaths.push(trimmedLine);
      }
    }
  } catch {}

  return buildPathMatchObjects(ignorePaths);
}
