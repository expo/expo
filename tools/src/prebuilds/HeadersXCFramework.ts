/**
 * Compile-only "headers" xcframeworks. An app compiles against one (headers, module map, Swift
 * interfaces) while React Native links and embeds the real dynamic framework.
 *
 * It is a LIBRARY xcframework on purpose: Xcode embeds every framework a SwiftPM binary target
 * vends, static or not, so a framework copy would collide with the one React Native embeds. A
 * library slice is linked, never embedded, and its stub archive defines one unreferenced symbol,
 * so the linker pulls nothing from it.
 */

import plist from '@expo/plist';
import spawnAsync from '@expo/spawn-async';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';

import logger from '../Logger';
import type { SPMPackageSource } from './ExternalPackage';
import { Frameworks } from './Frameworks';
import type { BuildFlavor } from './Prebuilder.types';
import type { SPMProduct } from './SPMConfig.types';

type HeadersProduct = Pick<SPMProduct, 'name' | 'platforms'>;

type XCFrameworkLibrary = {
  LibraryIdentifier: string;
  LibraryPath: string;
  SupportedArchitectures: string[];
  SupportedPlatform: string;
  SupportedPlatformVariant?: string;
};

type SliceTarget = {
  sdk: string;
  os: string;
  environment?: string;
  minimumVersionKey: 'MinimumOSVersion' | 'LSMinimumSystemVersion';
  productPlatform: string;
};

const SLICE_TARGETS: Record<string, SliceTarget> = {
  ios: {
    sdk: 'iphoneos',
    os: 'ios',
    minimumVersionKey: 'MinimumOSVersion',
    productPlatform: 'iOS',
  },
  'ios-simulator': {
    sdk: 'iphonesimulator',
    os: 'ios',
    environment: 'simulator',
    minimumVersionKey: 'MinimumOSVersion',
    productPlatform: 'iOS',
  },
  // A Catalyst triple takes an iOS version, which a Catalyst framework's Info.plist usually
  // lacks, so the product's macCatalyst platform supplies it.
  'ios-maccatalyst': {
    sdk: 'macosx',
    os: 'ios',
    environment: 'macabi',
    minimumVersionKey: 'MinimumOSVersion',
    productPlatform: 'macCatalyst',
  },
  macos: {
    sdk: 'macosx',
    os: 'macos',
    minimumVersionKey: 'LSMinimumSystemVersion',
    productPlatform: 'macOS',
  },
  tvos: {
    sdk: 'appletvos',
    os: 'tvos',
    minimumVersionKey: 'MinimumOSVersion',
    productPlatform: 'tvOS',
  },
  'tvos-simulator': {
    sdk: 'appletvsimulator',
    os: 'tvos',
    environment: 'simulator',
    minimumVersionKey: 'MinimumOSVersion',
    productPlatform: 'tvOS',
  },
};

export function getHeadersXCFrameworkPath(
  buildPath: string,
  productName: string,
  versionPrefix?: string
): string {
  return path.join(
    buildPath,
    'output',
    versionPrefix ?? '',
    'headers',
    'xcframeworks',
    `${productName}Headers.xcframework`
  );
}

/**
 * A run writes one headers xcframework per opted-in product, from its debug flavor when the run
 * builds debug and from release otherwise. The flavors differ only in a swift-module-flags line.
 */
export function shouldWriteHeadersXCFramework(
  product: SPMProduct,
  flavor: BuildFlavor,
  runFlavors: readonly BuildFlavor[]
): boolean {
  const sourceFlavor: BuildFlavor = runFlavors.includes('Debug') ? 'Debug' : 'Release';
  return product.headersXCFramework === true && flavor === sourceFlavor;
}

/** Writes the headers xcframework of a product from the flavored xcframework this run composed. */
export async function composeHeadersXCFrameworkAsync(
  { buildPath, outputVersionPrefix }: SPMPackageSource,
  product: HeadersProduct,
  flavor: BuildFlavor
): Promise<void> {
  const destination = getHeadersXCFrameworkPath(buildPath, product.name, outputVersionPrefix);
  await writeHeadersXCFrameworkAsync(
    Frameworks.getFrameworkPath(buildPath, product.name, flavor, outputVersionPrefix),
    product,
    destination
  );
  logger.info(`📦 Wrote ${path.basename(destination)} from the ${flavor} xcframework.`);
}

/**
 * Writes `destination` as the headers xcframework of `sourceXCFramework`, replacing any previous
 * output. Slices, identifiers and platforms come from the source's Info.plist; a slice with no
 * headers and no Swift interfaces (a placeholder) is left out.
 */
export async function writeHeadersXCFrameworkAsync(
  sourceXCFramework: string,
  product: HeadersProduct,
  destination: string
): Promise<void> {
  const libraries = await readSourceLibrariesAsync(sourceXCFramework);
  await fs.mkdirp(path.dirname(destination));
  const staging = await fs.mkdtemp(
    path.join(path.dirname(destination), `.${path.basename(destination)}-`)
  );
  const scratch = await fs.mkdtemp(path.join(os.tmpdir(), 'headers-xcframework-'));
  try {
    const written: XCFrameworkLibrary[] = [];
    for (const library of libraries) {
      if (await writeSliceAsync(sourceXCFramework, library, product, staging, scratch)) {
        written.push(library);
      }
    }
    if (written.length === 0) {
      throw new Error(
        `${sourceXCFramework} has no slice with headers or Swift interfaces, so there is nothing ` +
          `to compile ${product.name} against. Rebuild ${product.name} and check that its ` +
          `framework slices contain Headers or Modules.`
      );
    }
    const stub = stubLibraryName(product.name);
    await fs.writeFile(
      path.join(staging, 'Info.plist'),
      plist.build({
        AvailableLibraries: written.map((library) => ({
          BinaryPath: stub,
          HeadersPath: 'Headers',
          LibraryIdentifier: library.LibraryIdentifier,
          LibraryPath: stub,
          SupportedArchitectures: library.SupportedArchitectures,
          SupportedPlatform: library.SupportedPlatform,
          SupportedPlatformVariant: library.SupportedPlatformVariant,
        })),
        CFBundlePackageType: 'XFWK',
        XCFrameworkFormatVersion: '1.0',
      })
    );
    await replaceDirectoryAsync(staging, destination);
  } finally {
    await Promise.all([fs.remove(staging), fs.remove(scratch)]);
  }
}

/** Moves `source` to `destination`, putting the previous `destination` back if the move fails. */
async function replaceDirectoryAsync(source: string, destination: string): Promise<void> {
  const backup = `${source}-previous`;
  const hadPrevious = await fs.pathExists(destination);
  if (hadPrevious) {
    await fs.rename(destination, backup);
  }
  try {
    await fs.rename(source, destination);
  } catch (error) {
    if (hadPrevious) {
      await fs.rename(backup, destination);
    }
    throw error;
  }
  await fs.remove(backup);
}

const stubLibraryName = (productName: string) => `lib${productName}Headers.a`;

/** Returns false for a placeholder slice, which has nothing to compile against. */
async function writeSliceAsync(
  sourceXCFramework: string,
  library: XCFrameworkLibrary,
  product: HeadersProduct,
  xcframework: string,
  scratch: string
): Promise<boolean> {
  const framework = path.join(sourceXCFramework, library.LibraryIdentifier, library.LibraryPath);
  const moduleName = path.basename(library.LibraryPath, '.framework');
  const sourceHeaders = path.join(framework, 'Headers');
  const sourceSwiftModule = path.join(framework, 'Modules', `${moduleName}.swiftmodule`);
  const swiftInterfaces = (await fs.pathExists(sourceSwiftModule))
    ? (await fs.readdir(sourceSwiftModule)).filter((file) => file.endsWith('.swiftinterface'))
    : [];
  const hasHeaders = await fs.pathExists(sourceHeaders);
  if (!hasHeaders && swiftInterfaces.length === 0) {
    return false;
  }

  const slice = path.join(xcframework, library.LibraryIdentifier);
  const headers = path.join(slice, 'Headers', moduleName);
  if (hasHeaders) {
    // Copied, not linked: Xcode copies each slice into the build products directory, where a
    // relative symlink would no longer resolve. Dereferenced for versioned macOS frameworks.
    await fs.copy(sourceHeaders, headers, { dereference: true });
  }
  const moduleMap = await readModuleMapAsync(framework);
  if (moduleMap != null) {
    await fs.outputFile(
      path.join(headers, 'module.modulemap'),
      moduleMap.replace(/^(\s*)framework module /gm, '$1module ')
    );
  }
  for (const swiftInterface of swiftInterfaces) {
    await fs.copy(
      path.join(sourceSwiftModule, swiftInterface),
      path.join(slice, `${moduleName}.swiftmodule`, swiftInterface)
    );
  }

  await buildStubArchiveAsync(
    library,
    await resolveMinimumVersionAsync(library, framework, product),
    product.name,
    path.join(slice, stubLibraryName(product.name)),
    scratch
  );
  return true;
}

async function readModuleMapAsync(framework: string): Promise<string | null> {
  for (const candidate of ['Modules', 'Headers']) {
    const file = path.join(framework, candidate, 'module.modulemap');
    if (await fs.pathExists(file)) {
      return fs.readFile(file, 'utf8');
    }
  }
  return null;
}

function sliceTargetFor(library: XCFrameworkLibrary): SliceTarget {
  const key = [library.SupportedPlatform, library.SupportedPlatformVariant]
    .filter(Boolean)
    .join('-');
  const target = SLICE_TARGETS[key];
  if (!target) {
    throw new Error(
      `Cannot write a headers xcframework slice for ${library.LibraryIdentifier}: platform "${key}" ` +
        `is not supported. Supported platforms: ${Object.keys(SLICE_TARGETS).join(', ')}.`
    );
  }
  return target;
}

async function resolveMinimumVersionAsync(
  library: XCFrameworkLibrary,
  framework: string,
  product: HeadersProduct
): Promise<string> {
  const target = sliceTargetFor(library);
  for (const infoPlist of ['Info.plist', path.join('Resources', 'Info.plist')]) {
    const file = path.join(framework, infoPlist);
    if (await fs.pathExists(file)) {
      const version = (await readPlistAsync(file))[target.minimumVersionKey];
      if (typeof version === 'string') {
        return version;
      }
    }
  }
  const declared = product.platforms
    .map(parseProductPlatform)
    .find((platform) => platform?.name === target.productPlatform);
  if (declared) {
    return declared.version;
  }
  throw new Error(
    `Cannot build the ${product.name}Headers stub for slice ${library.LibraryIdentifier}: its ` +
      `framework declares no ${target.minimumVersionKey} and the product's "platforms" in ` +
      `spm.config.json have no ${target.productPlatform} entry. Add a ${target.productPlatform} ` +
      `platform with its deployment target to the product.`
  );
}

/** Parses `iOS(.v15)`, `macOS(.v10_15)` and `iOS("16.4")` into a name and a dotted version. */
function parseProductPlatform(platform: string): { name: string; version: string } | null {
  const match = platform.match(/^(\w+)\((?:\.v(\d+)(?:_(\d+))?|"([\d.]+)")\)$/);
  if (!match) {
    return null;
  }
  const [, name, major, minor, literal] = match;
  return { name, version: literal ?? `${major}.${minor ?? '0'}` };
}

async function buildStubArchiveAsync(
  library: XCFrameworkLibrary,
  minimumVersion: string,
  productName: string,
  output: string,
  scratch: string
): Promise<void> {
  const target = sliceTargetFor(library);
  const xcrunAsync = async (tool: string, args: string[]) => {
    try {
      await spawnAsync('xcrun', args);
    } catch (error) {
      const stderr = (error as { stderr?: string }).stderr?.trim();
      throw new Error(
        `Cannot build the ${productName}Headers stub for slice ${library.LibraryIdentifier}: ` +
          `\`xcrun ${tool}\` failed for the ${target.sdk} SDK. The Xcode toolchain or the ` +
          `${target.sdk} SDK may be unavailable, or the command itself failed. Check that ` +
          `\`xcode-select -p\` points at an Xcode installation and that ` +
          `\`xcrun --sdk ${target.sdk} --show-sdk-path\` prints a path.` +
          (stderr ? `\n\n${tool} output:\n${stderr}` : ''),
        { cause: error }
      );
    }
  };

  const source = path.join(scratch, `${library.LibraryIdentifier}.c`);
  await fs.writeFile(source, `int ${productName}HeadersStub_${target.sdk} = 0;\n`);
  const objects: string[] = [];
  for (const arch of library.SupportedArchitectures) {
    const object = path.join(scratch, `${library.LibraryIdentifier}-${arch}.o`);
    const triple = `${arch}-apple-${target.os}${minimumVersion}${target.environment ? `-${target.environment}` : ''}`;
    await xcrunAsync('clang', [
      '--sdk',
      target.sdk,
      'clang',
      '-target',
      triple,
      '-c',
      source,
      '-o',
      object,
    ]);
    objects.push(object);
  }
  await xcrunAsync('libtool', ['libtool', '-static', '-o', output, ...objects]);
}

async function readSourceLibrariesAsync(xcframework: string): Promise<XCFrameworkLibrary[]> {
  const infoPlist = path.join(xcframework, 'Info.plist');
  if (!(await fs.pathExists(infoPlist))) {
    throw new Error(
      `Cannot write a headers xcframework: ${infoPlist} does not exist. Compose the product's ` +
        `xcframework first.`
    );
  }
  return (await readPlistAsync(infoPlist)).AvailableLibraries as XCFrameworkLibrary[];
}

/** Reads XML and binary plists alike; xcodebuild writes framework Info.plists in binary form. */
async function readPlistAsync(file: string): Promise<Record<string, unknown>> {
  const { stdout } = await spawnAsync('plutil', ['-convert', 'json', '-o', '-', file]);
  return JSON.parse(stdout);
}
