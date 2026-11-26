/**
 * Release stubs for debug-only products (`"releaseFlavor": "stub"` in spm.config.json).
 *
 * React Native's SwiftPM generator accepts a Debug/Release pair when both flavors have the same
 * `Headers/` and `Modules/module.modulemap` and a binary with an `LC_ID_DYLIB`. A stub keeps all of
 * that from the Debug XCFramework and replaces each binary with an empty dynamic library that has
 * the real install name, versions, platform and minimum OS, so Release apps ship none of the code.
 */

import spawnAsync from '@expo/spawn-async';
import fs from 'fs-extra';
import { cp } from 'node:fs/promises';
import os from 'os';
import path from 'path';

import type { BuildFlavor } from './Prebuilder.types';
import type { SPMProduct } from './SPMConfig.types';

type XCFrameworkLibrary = {
  LibraryIdentifier: string;
  LibraryPath: string;
  BinaryPath?: string;
  DebugSymbolsPath?: string;
};

type StubPlatform = { os: string; environment?: string; sdk: string };

/** Keyed by the `platform` number otool prints for `LC_BUILD_VERSION`. */
const PLATFORMS: Record<string, StubPlatform> = {
  2: { os: 'ios', sdk: 'iphoneos' },
  7: { os: 'ios', environment: 'simulator', sdk: 'iphonesimulator' },
  3: { os: 'tvos', sdk: 'appletvos' },
  8: { os: 'tvos', environment: 'simulator', sdk: 'appletvsimulator' },
  11: { os: 'xros', sdk: 'xros' },
  12: { os: 'xros', environment: 'simulator', sdk: 'xrsimulator' },
};

const COPIED_FRAMEWORK_ENTRIES = ['Info.plist', 'Headers', 'PrivateHeaders', 'Modules'];

/** The entries React Native compares between the flavors of a flavored framework pair. */
const PAIRED_FRAMEWORK_ENTRIES = ['Headers', path.join('Modules', 'module.modulemap')];

export function isReleaseStub(product: Pick<SPMProduct, 'releaseFlavor'>, flavor: BuildFlavor) {
  return product.releaseFlavor === 'stub' && flavor === 'Release';
}

/**
 * Writes a stub of `sourceXCFramework` to `outputXCFramework`, replacing whatever is there.
 * The stub has no resources, no dSYMs and no code, so its Info.plist names no `DebugSymbolsPath`.
 */
export async function makeStubXCFrameworkAsync(
  sourceXCFramework: string,
  outputXCFramework: string
): Promise<void> {
  const libraries = await readLibrariesAsync(sourceXCFramework);
  const binaryPaths = libraries.map((library) => {
    const binaryPath =
      library.BinaryPath ??
      path.join(library.LibraryPath, path.basename(library.LibraryPath, '.framework'));
    const isVersionedBundle =
      binaryPath.includes('Versions/') ||
      fs.existsSync(
        path.join(sourceXCFramework, library.LibraryIdentifier, library.LibraryPath, 'Versions')
      );
    if (isVersionedBundle) {
      throw new Error(
        `Cannot make a stub of ${sourceXCFramework}: slice ${library.LibraryIdentifier} is a ` +
          `versioned framework bundle (macOS or Mac Catalyst), and stubs support only flat ` +
          `bundles (iOS, tvOS, visionOS). Remove that platform from the product, or drop ` +
          `"releaseFlavor": "stub" from its spm.config.json.`
      );
    }
    return binaryPath;
  });

  await fs.remove(outputXCFramework);
  await fs.mkdirp(outputXCFramework);
  const infoPlist = path.join(outputXCFramework, 'Info.plist');
  await fs.copyFile(path.join(sourceXCFramework, 'Info.plist'), infoPlist);
  for (const [index, library] of libraries.entries()) {
    if (library.DebugSymbolsPath !== undefined) {
      await spawnAsync('plutil', [
        '-remove',
        `AvailableLibraries.${index}.DebugSymbolsPath`,
        infoPlist,
      ]);
    }
  }

  const scratch = await fs.mkdtemp(path.join(os.tmpdir(), 'stub-xcframework-'));
  try {
    for (const [index, library] of libraries.entries()) {
      const framework = path.join(library.LibraryIdentifier, library.LibraryPath);
      await fs.mkdirp(path.join(outputXCFramework, framework));
      for (const entry of COPIED_FRAMEWORK_ENTRIES) {
        const source = path.join(sourceXCFramework, framework, entry);
        if (await fs.pathExists(source)) {
          await cp(source, path.join(outputXCFramework, framework, entry), {
            recursive: true,
            verbatimSymlinks: true,
          });
        }
      }
      const binary = path.join(library.LibraryIdentifier, binaryPaths[index]);
      await writeStubBinaryAsync(
        path.join(sourceXCFramework, binary),
        path.join(outputXCFramework, binary),
        path.join(scratch, library.LibraryIdentifier)
      );
    }
  } finally {
    await fs.remove(scratch);
  }
}

/**
 * Lists the paired entries (see `PAIRED_FRAMEWORK_ENTRIES`) that are missing from `stubXCFramework`
 * or differ from `sourceXCFramework`, relative to the XCFramework root.
 */
export async function findStubMismatchesAsync(
  sourceXCFramework: string,
  stubXCFramework: string
): Promise<string[]> {
  const mismatches: string[] = [];
  for (const library of await readLibrariesAsync(sourceXCFramework)) {
    for (const entry of PAIRED_FRAMEWORK_ENTRIES) {
      const relative = path.join(library.LibraryIdentifier, library.LibraryPath, entry);
      const [expected, actual] = await Promise.all([
        snapshotAsync(path.join(sourceXCFramework, relative)),
        snapshotAsync(path.join(stubXCFramework, relative)),
      ]);
      for (const key of new Set([...expected.keys(), ...actual.keys()])) {
        if (!isSameEntry(expected.get(key), actual.get(key))) {
          mismatches.push(path.join(relative, key));
        }
      }
    }
  }
  return mismatches;
}

type Entry = Buffer | string;

/** Maps each path under `root` to its contents, or to `symlink:<target>` for a symlink. */
async function snapshotAsync(root: string, relative = ''): Promise<Map<string, Entry>> {
  const entries = new Map<string, Entry>();
  const file = path.join(root, relative);
  const stat = await fs.lstat(file).catch(() => null);
  if (stat?.isSymbolicLink()) {
    entries.set(relative, `symlink:${await fs.readlink(file)}`);
  } else if (stat?.isDirectory()) {
    for (const name of await fs.readdir(file)) {
      for (const [key, value] of await snapshotAsync(root, path.join(relative, name))) {
        entries.set(key, value);
      }
    }
  } else if (stat) {
    entries.set(relative, await fs.readFile(file));
  }
  return entries;
}

function isSameEntry(a: Entry | undefined, b: Entry | undefined): boolean {
  if (Buffer.isBuffer(a) && Buffer.isBuffer(b)) {
    return a.equals(b);
  }
  return a !== undefined && a === b;
}

async function writeStubBinaryAsync(
  sourceBinary: string,
  outputBinary: string,
  scratch: string
): Promise<void> {
  await fs.mkdirp(scratch);
  const archs = (await xcrunAsync(['lipo', '-archs', sourceBinary])).trim().split(/\s+/);
  const thinBinaries: string[] = [];
  for (const arch of archs) {
    const loadCommands = await xcrunAsync(['otool', '-arch', arch, '-l', sourceBinary]);
    const id = readLoadCommand(loadCommands, 'LC_ID_DYLIB', sourceBinary, arch);
    const build = readLoadCommand(loadCommands, 'LC_BUILD_VERSION', sourceBinary, arch);
    const platform = PLATFORMS[build.platform];
    if (!platform) {
      throw new Error(
        `Cannot make a stub of ${sourceBinary} (${arch}): its LC_BUILD_VERSION names platform ` +
          `${build.platform}, which stubs do not support. Stubs support iOS, tvOS and visionOS ` +
          `devices and simulators.`
      );
    }
    const target = `${arch}-apple-${platform.os}${build.minos}${platform.environment ? `-${platform.environment}` : ''}`;
    const sysroot = (await xcrunAsync(['--sdk', platform.sdk, '--show-sdk-path'])).trim();
    const thin = path.join(scratch, arch);
    await xcrunAsync([
      ...['clang', '-dynamiclib', '-x', 'c', '/dev/null', '-o', thin],
      ...['-target', target, '-isysroot', sysroot, '-install_name', id.name],
      ...['-current_version', id['current version']],
      ...['-compatibility_version', id['compatibility version']],
    ]);
    thinBinaries.push(thin);
  }
  await xcrunAsync(['lipo', '-create', ...thinBinaries, '-output', outputBinary]);
}

function readLoadCommand(
  otoolOutput: string,
  command: 'LC_ID_DYLIB' | 'LC_BUILD_VERSION',
  binary: string,
  arch: string
): Record<string, string> {
  const lines = otoolOutput.split('\n');
  const start = lines.findIndex((line) => line.trim() === `cmd ${command}`);
  if (start === -1) {
    throw new Error(
      `Cannot make a stub of ${binary} (${arch}): it has no ${command} load command, so it is ` +
        `not a dynamic framework binary built for a current Apple platform. Check that the ` +
        `product builds as a dynamic framework.`
    );
  }
  const fields: Record<string, string> = {};
  for (const line of lines.slice(start + 1, start + 8)) {
    const match =
      line.trim().match(/^name\s+(.+?)\s+\(offset \d+\)$/) ??
      line.trim().match(/^(platform|minos|current version|compatibility version)\s+(\S+)$/);
    if (match?.length === 2) {
      fields.name = match[1];
    } else if (match) {
      fields[match[1]] = match[2];
    }
  }
  const required =
    command === 'LC_ID_DYLIB'
      ? ['name', 'current version', 'compatibility version']
      : ['platform', 'minos'];
  const missing = required.filter((field) => fields[field] === undefined);
  if (missing.length > 0) {
    throw new Error(
      `Cannot make a stub of ${binary} (${arch}): its ${command} load command has no ` +
        `${missing.join(', ')} in the otool output. Check the binary with ` +
        `\`xcrun otool -arch ${arch} -l ${binary}\`.`
    );
  }
  return fields;
}

async function readLibrariesAsync(xcframework: string): Promise<XCFrameworkLibrary[]> {
  const { stdout } = await spawnAsync('plutil', [
    '-convert',
    'json',
    '-o',
    '-',
    path.join(xcframework, 'Info.plist'),
  ]);
  return JSON.parse(stdout).AvailableLibraries;
}

async function xcrunAsync(args: string[]): Promise<string> {
  try {
    return (await spawnAsync('xcrun', args)).stdout;
  } catch (error) {
    const stderr = (error as { stderr?: string }).stderr?.trim();
    throw new Error(
      `\`xcrun ${args.join(' ')}\` failed while making a Release stub. Check that ` +
        `\`xcode-select -p\` points at an Xcode installation with the SDKs the product supports.` +
        (stderr ? `\n\nOutput:\n${stderr}` : ''),
      { cause: error }
    );
  }
}
