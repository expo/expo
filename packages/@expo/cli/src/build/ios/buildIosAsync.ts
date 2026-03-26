import { ExpoRunFormatter } from '@expo/xcpretty';
import { spawn, type ChildProcess, type SpawnOptionsWithoutStdio } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { once } from 'node:events';
import * as glob from 'glob';
import { resolveXcodeProject } from '../../run/ios/options/resolveXcodeProject';
import { AbortCommandError, CommandError } from '../../utils/errors';
import type { ProjectInfo } from '../../run/ios/XcodeBuild.types';
import { env } from '../../utils/env';
import { Log } from '../../log';

const { default: plist } = require('@expo/plist');

export type BuildIosOptions = {
  /** Xcode scheme to build */
  scheme: string;
  /** Xcode configuration to use, e.g. Release or Debug */
  configuration: string;
  /** The binary format to build, either app for simulators or ipa for App Store submittable apps */
  format: 'ipa' | 'app';
  /** The app binary output file */
  outputFile: string;
  /** Additional xcodebuild flags to pass */
  xcodeFlags?: string;
};

export async function buildIosAsync(projectRoot: string, options: BuildIosOptions) {
  // Only focus on production builds, meaning xcodebuild archive commands
  // Allow `outputFile`, `configuration`, and `scheme`

  const name = options.configuration.toLowerCase();
  const xcodeDerivedDataPath = '.expo/build/DerivedData';
  const xcodeResultBundlePath = `.expo/build/result-${name}.xcresult`;
  const xcodeArchivePath = '.expo/build/app.xcarchive';
  
  const [xcodeProject] = await Promise.all([
    resolveXcodeProject(projectRoot),
    fs.promises.rm(path.join(projectRoot, xcodeResultBundlePath), { force: true, recursive: true }),
    fs.promises.rm(path.join(projectRoot, xcodeArchivePath), { force: true, recursive: true }),
  ]);

  const xcodeBuildArchive = spawnXcodeBuild([
    options.format === 'app' ? 'build' : 'archive',
    xcodeProject.isWorkspace ? '-workspace' : '-project',
    xcodeProject.isWorkspace ? path.relative(projectRoot, xcodeProject.name) : xcodeProject.name,
    '-scheme',
    options.scheme || xcodeProject.name,
    '-configuration',
    options.configuration,
    '-destination',
    options.format === 'app' ? 'generic/platform=iOS Simulator' : 'generic/platform=iOS',
    '-derivedDataPath',
    xcodeDerivedDataPath,
    '-resultBundlePath',
    xcodeResultBundlePath,
    options.format === 'ipa' && '-archivePath',
    options.format === 'ipa' && xcodeArchivePath,
    // options.format === 'app' && 'CONFIGURATION_BUILD_DIR=.expo/build/Products/Applications',
    // Additional properties
    options.format === 'ipa' && 'COCOAPODS_PARALLEL_CODE_SIGN=true',
    options.format === 'ipa' && 'COMPILER_INDEX_STORE_ENABLE=NO',
    options.xcodeFlags,
  ].filter(Boolean) as string[], {
    cwd: projectRoot
  });

  if (env.EXPO_DEBUG) {
    xcodeBuildArchive.stdout.on('data', buffer => console.log(buffer.toString()));
    xcodeBuildArchive.stderr.on('data', buffer => console.error(buffer.toString()));
  } else {
    withXcodeBuildPrettifier(projectRoot, xcodeProject, xcodeBuildArchive);
  }

  /*
    TODO: add these properties:
    // Enable parallel code signing for CocoaPods frameworks to speed up device builds.
    // When building for device, multiple frameworks need to be code signed. By default this
    // happens sequentially. This flag allows them to run in parallel.
    // https://github.com/CocoaPods/CocoaPods/pull/6088
    'COCOAPODS_PARALLEL_CODE_SIGN=true',

    // Disable the Xcode compiler index store during CLI builds.
    // The index store is used for code completion, refactoring, and navigation in Xcode IDE.
    // Since CLI builds don't need these features, disabling it saves build time and disk I/O.
    'COMPILER_INDEX_STORE_ENABLE=NO',
   */

  const xcodeBuildArchiveExitCode = await waitForProcessClose(xcodeBuildArchive);
  if (xcodeBuildArchiveExitCode === null || xcodeBuildArchiveExitCode === 75) {
    throw new AbortCommandError();
  } else if (xcodeBuildArchiveExitCode !== 0) {
    throw new CommandError('XCODE', 'Failed to build your xcode app');
  }

  if (options.format === 'app') {
    // During the archive process, we already get an app
    // Just move this to the expected path
    const appPath = glob.sync(`Build/Products/${options.configuration}*/*.app`, { cwd: xcodeDerivedDataPath, absolute: true });
    if (!appPath.length) {
      throw new Error('Could not find the .app location of the archive');
    } else if (appPath.length > 1) {
      throw new Error('Too many .app locations where found within the archive');
    }

    await fs.promises.rm(options.outputFile, { force: true, recursive: true });
    await fs.promises.rename(appPath[0], options.outputFile);

    // Pull the app from the archive, move it to the outfile and done
    return console.log('✅ Built your app at:', options.outputFile);
  }

  const xcodeExportOptionsPath = `.expo/build/codesigning-${name}.plist`;
  const xcodeExportOptions = {
    method: 'app-store-connect',
    signingStyle: 'automatic',
  };

  await fs.promises.writeFile(path.join(projectRoot, xcodeExportOptionsPath), plist.build(xcodeExportOptions));

  const xcodeBuildExport = spawnXcodeBuild([
    'export',
    '-exportArchive',
    '-archivePath', 
    xcodeArchivePath,
    '-exportPath',
    options.outputFile,
    '-exportOptionsPlist',
    xcodeExportOptionsPath,
  ]);

  withXcodeBuildPrettifier(projectRoot, xcodeProject, xcodeBuildExport);
  await waitForProcessClose(xcodeBuildExport);

  console.log('All done!');
}

function spawnXcodeBuild(commandOrFlags: string[], options?: SpawnOptionsWithoutStdio) {
  console.log('> xcodebuild ' + commandOrFlags.join(' '));
  return spawn('xcodebuild', commandOrFlags, options);
}

function withXcodeBuildPrettifier(projectRoot: string, xcodeProject: ProjectInfo, process: ChildProcess) {
  const formatter = ExpoRunFormatter.create(projectRoot, { xcodeProject, isDebug: env.EXPO_DEBUG });

  let buffer = '';
  process.stdout?.on('data', (data: Buffer) => {
    buffer += data.toString();
    if (buffer.endsWith(os.EOL)) {
      for (const line of formatter.pipe(buffer)) {
        Log.log(line);
      }
      buffer = '';
    }
  });

  process.stderr?.on('data', b => console.error(b.toString()));
}

async function waitForProcessClose(process: ChildProcess) {
  const [exitCode] = await once(process, 'close');
  return exitCode as number | null;
}
