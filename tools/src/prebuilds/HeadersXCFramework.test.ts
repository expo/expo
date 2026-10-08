import plist from '@expo/plist';
import spawnAsync from '@expo/spawn-async';
import fs from 'fs-extra';
import { glob } from 'glob';
import assert from 'node:assert/strict';
import { afterEach, describe, it, mock } from 'node:test';
import os from 'os';
import path from 'path';

import type { SPMPackageSource } from './ExternalPackage';
import { Frameworks } from './Frameworks';
import {
  getHeadersXCFrameworkPath,
  shouldWriteHeadersXCFramework,
  writeHeadersXCFrameworkAsync,
} from './HeadersXCFramework';
import type { ProductPlatform, SPMProduct } from './SPMConfig.types';
import { createContext, createRequest } from './pipeline/Context';
import { composeStep } from './pipeline/ProductSteps';
import schema from './schemas/spm.config.schema.json';

const NAME = 'Fixture';
const STUB = `lib${NAME}Headers.a`;

type FixtureSlice = {
  id: string;
  archs: string[];
  platform?: 'ios' | 'tvos';
  variant?: 'simulator' | '';
  /** `undefined` writes no framework Info.plist; `null` writes one without `MinimumOSVersion`. */
  minimumOSVersion?: string | null;
  /** A placeholder slice carries only a binary, like expo-modules-jsi's unbuilt platforms. */
  placeholder?: boolean;
};

const DEVICE: FixtureSlice = { id: 'ios-arm64', archs: ['arm64'], minimumOSVersion: '16.4' };
const SIMULATOR: FixtureSlice = {
  id: 'ios-arm64_x86_64-simulator',
  archs: ['arm64', 'x86_64'],
  variant: 'simulator',
  minimumOSVersion: '16.4',
};

const SOURCE_MODULE_MAP = `framework module ${NAME} {
    umbrella header "${NAME}_umbrella.h"
    header "${NAME}-Swift.h"

    export *
    module * { export * }
}

framework module ${NAME}_Private {
    header "${NAME}.h"
}
`;

const appleToolsOnly = {
  skip: process.platform !== 'darwin' && 'needs plutil and xcrun, which only macOS provides',
};

const product = (platforms: ProductPlatform[] = ['iOS("16.4")']) => ({ name: NAME, platforms });

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((root) => fs.remove(root)));
});

async function makeTempRootAsync(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'headers-xcframework-'));
  tempRoots.push(root);
  return root;
}

async function writeBinaryPlistAsync(file: string, contents: object): Promise<void> {
  await fs.outputFile(file, plist.build(contents));
  await spawnAsync('plutil', ['-convert', 'binary1', file]);
}

async function createSourceXCFrameworkAsync(
  xcframework: string,
  slices: FixtureSlice[]
): Promise<void> {
  for (const slice of slices) {
    const framework = path.join(xcframework, slice.id, `${NAME}.framework`);
    await fs.outputFile(path.join(framework, NAME), 'not a real binary');
    if (slice.placeholder) {
      continue;
    }
    await fs.outputFile(
      path.join(framework, 'Headers', `${NAME}_umbrella.h`),
      '#import "Fixture.h"\n'
    );
    await fs.outputFile(path.join(framework, 'Headers', `${NAME}.h`), 'int fixture(void);\n');
    await fs.outputFile(path.join(framework, 'Headers', `${NAME}-Swift.h`), '// generated\n');
    await fs.outputFile(path.join(framework, 'Modules', 'module.modulemap'), SOURCE_MODULE_MAP);
    const swiftmodule = path.join(framework, 'Modules', `${NAME}.swiftmodule`);
    for (const arch of slice.archs) {
      const triple = `${arch}-apple-${slice.platform ?? 'ios'}${slice.variant ? `-${slice.variant}` : ''}`;
      await fs.outputFile(path.join(swiftmodule, `${triple}.swiftinterface`), `// ${triple}\n`);
      await fs.outputFile(
        path.join(swiftmodule, `${triple}.private.swiftinterface`),
        '// private\n'
      );
      await fs.outputFile(path.join(swiftmodule, `${triple}.swiftmodule`), Buffer.from([0, 1, 2]));
      await fs.outputFile(path.join(swiftmodule, `${triple}.swiftdoc`), Buffer.from([3, 4]));
      await fs.outputFile(path.join(swiftmodule, `${triple}.abi.json`), '{}');
    }
    await fs.outputFile(path.join(swiftmodule, 'Project', 'x.swiftsourceinfo'), 'info');
    if (slice.minimumOSVersion !== undefined) {
      await writeBinaryPlistAsync(path.join(framework, 'Info.plist'), {
        CFBundleExecutable: NAME,
        ...(slice.minimumOSVersion ? { MinimumOSVersion: slice.minimumOSVersion } : {}),
      });
    }
  }

  await fs.outputFile(
    path.join(xcframework, 'Info.plist'),
    plist.build({
      AvailableLibraries: slices.map((slice) => ({
        BinaryPath: `${NAME}.framework/${NAME}`,
        DebugSymbolsPath: 'dSYMs',
        LibraryIdentifier: slice.id,
        LibraryPath: `${NAME}.framework`,
        SupportedArchitectures: slice.archs,
        SupportedPlatform: slice.platform ?? 'ios',
        SupportedPlatformVariant: slice.variant,
      })),
      CFBundlePackageType: 'XFWK',
      XCFrameworkFormatVersion: '1.0',
    })
  );
}

async function createFixtureAsync(slices: FixtureSlice[]) {
  const root = await makeTempRootAsync();
  const source = path.join(root, `${NAME}.xcframework`);
  await createSourceXCFrameworkAsync(source, slices);
  return { source, destination: path.join(root, 'out', `${NAME}Headers.xcframework`) };
}

async function writeFixtureAsync(slices: FixtureSlice[], platforms?: ProductPlatform[]) {
  const { source, destination } = await createFixtureAsync(slices);
  await writeHeadersXCFrameworkAsync(source, product(platforms), destination);
  return destination;
}

async function listFilesAsync(dir: string): Promise<string[]> {
  return (await glob('**/*', { cwd: dir, nodir: true, dot: true })).sort();
}

async function readPlistAsync(file: string) {
  return JSON.parse((await spawnAsync('plutil', ['-convert', 'json', '-o', '-', file])).stdout);
}

async function outputOfAsync(command: string, args: string[]): Promise<string> {
  return (await spawnAsync('xcrun', [command, ...args])).stdout;
}

function definedSymbols(nmOutput: string): string[] {
  return nmOutput
    .split('\n')
    .map((line) => line.trim().split(/\s+/))
    .filter((fields) => fields.length === 3 && fields[1] !== 'U')
    .map((fields) => fields[2]);
}

describe('writeHeadersXCFrameworkAsync', appleToolsOnly, () => {
  it('lays out each slice as a stub archive, a headers directory and the text Swift interfaces', async () => {
    const destination = await writeFixtureAsync([DEVICE, SIMULATOR]);

    assert.deepEqual(await listFilesAsync(destination), [
      'Info.plist',
      `ios-arm64/${NAME}.swiftmodule/arm64-apple-ios.private.swiftinterface`,
      `ios-arm64/${NAME}.swiftmodule/arm64-apple-ios.swiftinterface`,
      `ios-arm64/Headers/${NAME}/${NAME}-Swift.h`,
      `ios-arm64/Headers/${NAME}/${NAME}.h`,
      `ios-arm64/Headers/${NAME}/${NAME}_umbrella.h`,
      `ios-arm64/Headers/${NAME}/module.modulemap`,
      `ios-arm64/${STUB}`,
      `ios-arm64_x86_64-simulator/${NAME}.swiftmodule/arm64-apple-ios-simulator.private.swiftinterface`,
      `ios-arm64_x86_64-simulator/${NAME}.swiftmodule/arm64-apple-ios-simulator.swiftinterface`,
      `ios-arm64_x86_64-simulator/${NAME}.swiftmodule/x86_64-apple-ios-simulator.private.swiftinterface`,
      `ios-arm64_x86_64-simulator/${NAME}.swiftmodule/x86_64-apple-ios-simulator.swiftinterface`,
      `ios-arm64_x86_64-simulator/Headers/${NAME}/${NAME}-Swift.h`,
      `ios-arm64_x86_64-simulator/Headers/${NAME}/${NAME}.h`,
      `ios-arm64_x86_64-simulator/Headers/${NAME}/${NAME}_umbrella.h`,
      `ios-arm64_x86_64-simulator/Headers/${NAME}/module.modulemap`,
      `ios-arm64_x86_64-simulator/${STUB}`,
    ]);
  });

  it('rewrites every framework module declaration into a plain module', async () => {
    const destination = await writeFixtureAsync([DEVICE, SIMULATOR]);

    for (const slice of [DEVICE, SIMULATOR]) {
      const moduleMap = await fs.readFile(
        path.join(destination, slice.id, 'Headers', NAME, 'module.modulemap'),
        'utf8'
      );
      assert.equal(moduleMap, SOURCE_MODULE_MAP.replaceAll('framework module ', 'module '));
    }
  });

  it('describes the source slices as library slices of the stub archive', async () => {
    const destination = await writeFixtureAsync([SIMULATOR, { ...DEVICE, variant: '' }]);

    assert.deepEqual(await readPlistAsync(path.join(destination, 'Info.plist')), {
      AvailableLibraries: [
        {
          BinaryPath: STUB,
          HeadersPath: 'Headers',
          LibraryIdentifier: SIMULATOR.id,
          LibraryPath: STUB,
          SupportedArchitectures: ['arm64', 'x86_64'],
          SupportedPlatform: 'ios',
          SupportedPlatformVariant: 'simulator',
        },
        {
          BinaryPath: STUB,
          HeadersPath: 'Headers',
          LibraryIdentifier: DEVICE.id,
          LibraryPath: STUB,
          SupportedArchitectures: ['arm64'],
          SupportedPlatform: 'ios',
        },
      ],
      CFBundlePackageType: 'XFWK',
      XCFrameworkFormatVersion: '1.0',
    });
  });

  it('builds a stub archive per slice that defines one product-unique symbol', async () => {
    const destination = await writeFixtureAsync([DEVICE, SIMULATOR]);
    const device = path.join(destination, DEVICE.id, STUB);
    const simulator = path.join(destination, SIMULATOR.id, STUB);

    assert.deepEqual(definedSymbols(await outputOfAsync('nm', ['-g', device])), [
      `_${NAME}HeadersStub_iphoneos`,
    ]);
    assert.deepEqual(
      [...new Set(definedSymbols(await outputOfAsync('nm', ['-g', simulator])))],
      [`_${NAME}HeadersStub_iphonesimulator`]
    );
    assert.equal((await outputOfAsync('lipo', ['-archs', device])).trim(), 'arm64');
    assert.deepEqual(
      (await outputOfAsync('lipo', ['-archs', simulator])).trim().split(' ').sort(),
      ['arm64', 'x86_64']
    );
    assert.match(await outputOfAsync('otool', ['-l', device]), /minos 16\.4/);
    // LC_BUILD_VERSION platform 7 is the iOS simulator.
    assert.match(await outputOfAsync('otool', ['-l', simulator]), /platform 7/);
  });

  it('takes the deployment target from the product platforms when the framework has none', async () => {
    const destination = await writeFixtureAsync(
      [{ ...DEVICE, minimumOSVersion: null }],
      ['iOS(.v16)']
    );

    assert.match(
      await outputOfAsync('otool', ['-l', path.join(destination, DEVICE.id, STUB)]),
      /minos 16\.0/
    );
  });

  it('takes each slice platform from the source, including non-iOS platforms', async () => {
    const tv: FixtureSlice = {
      id: 'tvos-arm64',
      archs: ['arm64'],
      platform: 'tvos',
      minimumOSVersion: '15.0',
    };
    const destination = await writeFixtureAsync([DEVICE, SIMULATOR, tv]);
    const stub = path.join(destination, tv.id, STUB);

    const { AvailableLibraries } = await readPlistAsync(path.join(destination, 'Info.plist'));
    assert.deepEqual(
      AvailableLibraries.map((library: Record<string, string>) =>
        [library.SupportedPlatform, library.SupportedPlatformVariant].filter(Boolean).join('-')
      ),
      ['ios', 'ios-simulator', 'tvos']
    );
    assert.deepEqual(definedSymbols(await outputOfAsync('nm', ['-g', stub])), [
      `_${NAME}HeadersStub_appletvos`,
    ]);
    // LC_BUILD_VERSION platform 3 is tvOS.
    assert.match(await outputOfAsync('otool', ['-l', stub]), /platform 3\n\s+minos 15\.0/);
  });

  it('leaves out placeholder slices that carry nothing to compile against', async () => {
    const destination = await writeFixtureAsync([
      DEVICE,
      { id: 'tvos-arm64', archs: ['arm64'], placeholder: true },
    ]);

    const info = await readPlistAsync(path.join(destination, 'Info.plist'));
    assert.deepEqual(
      info.AvailableLibraries.map(
        (library: { LibraryIdentifier: string }) => library.LibraryIdentifier
      ),
      [DEVICE.id]
    );
    assert.equal(await fs.pathExists(path.join(destination, 'tvos-arm64')), false);
  });

  it('replaces a previous output cleanly', async () => {
    const { source, destination } = await createFixtureAsync([DEVICE, SIMULATOR]);

    await writeHeadersXCFrameworkAsync(source, product(), destination);
    const firstRun = await listFilesAsync(destination);
    await fs.outputFile(path.join(destination, 'ios-arm64', 'stale.h'), '');
    await writeHeadersXCFrameworkAsync(source, product(), destination);

    assert.deepEqual(await listFilesAsync(destination), firstRun);
    assert.deepEqual(await fs.readdir(path.dirname(destination)), [`${NAME}Headers.xcframework`]);
  });

  it('fails naming the slice with no known deployment target and keeps the previous output', async () => {
    const destination = await writeFixtureAsync([DEVICE, SIMULATOR]);
    const files = await listFilesAsync(destination);
    const infoPlist = await fs.readFile(path.join(destination, 'Info.plist'), 'utf8');
    const broken = await createFixtureAsync([{ ...DEVICE, minimumOSVersion: undefined }]);

    await assert.rejects(
      writeHeadersXCFrameworkAsync(broken.source, product(['macOS(.v11)']), destination),
      /slice ios-arm64: its framework declares no MinimumOSVersion/
    );

    assert.deepEqual(await listFilesAsync(destination), files);
    assert.equal(await fs.readFile(path.join(destination, 'Info.plist'), 'utf8'), infoPlist);
    assert.deepEqual(await fs.readdir(path.dirname(destination)), [`${NAME}Headers.xcframework`]);
  });

  it('keeps the previous output when moving the new one into place fails', async (t) => {
    const { source, destination } = await createFixtureAsync([DEVICE, SIMULATOR]);
    await writeHeadersXCFrameworkAsync(source, product(), destination);
    const files = await listFilesAsync(destination);

    const rename: (from: string, to: string) => Promise<void> = fs.rename;
    let movedIntoDestination = false;
    t.mock.method(fs, 'rename', async (from: string, to: string) => {
      if (to === destination && !movedIntoDestination) {
        movedIntoDestination = true;
        throw new Error('EXDEV: simulated rename failure');
      }
      return rename(from, to);
    });

    await assert.rejects(
      writeHeadersXCFrameworkAsync(source, product(), destination),
      /simulated rename failure/
    );

    assert.deepEqual(await listFilesAsync(destination), files);
    assert.deepEqual(await fs.readdir(path.dirname(destination)), [`${NAME}Headers.xcframework`]);
  });

  it('names the product, SDK and xcrun output when building a stub fails', async () => {
    const { source, destination } = await createFixtureAsync([{ ...DEVICE, archs: ['bogus'] }]);

    await assert.rejects(
      writeHeadersXCFrameworkAsync(source, product(), destination),
      (error: Error) => {
        assert.match(error.message, new RegExp(`${NAME}Headers stub`));
        assert.match(error.message, /ios-arm64/);
        assert.match(error.message, /xcrun clang/);
        assert.match(error.message, /xcrun --sdk iphoneos --show-sdk-path/);
        assert.match(error.message, /unknown target triple/);
        return true;
      }
    );
  });

  it('rejects a source Info.plist without an AvailableLibraries array before writing', async () => {
    const { source, destination } = await createFixtureAsync([DEVICE]);
    const infoPlist = path.join(source, 'Info.plist');
    await fs.writeFile(infoPlist, plist.build({ CFBundlePackageType: 'XFWK' }));

    await assert.rejects(writeHeadersXCFrameworkAsync(source, product(), destination), {
      message: `${infoPlist} has no AvailableLibraries array; it is not a valid xcframework.`,
    });
    assert.equal(await fs.pathExists(path.dirname(destination)), false);
  });
});

describe('getHeadersXCFrameworkPath', () => {
  it('places the headers xcframework beside the flavor directories, under any version prefix', () => {
    assert.equal(
      getHeadersXCFrameworkPath('/build', NAME),
      path.join('/build/output/headers/xcframeworks', `${NAME}Headers.xcframework`)
    );
    assert.equal(
      getHeadersXCFrameworkPath('/build', NAME, '1.0.0/0.85.0/1.0.0'),
      path.join(
        '/build/output/1.0.0/0.85.0/1.0.0/headers/xcframeworks',
        `${NAME}Headers.xcframework`
      )
    );
  });
});

describe('shouldWriteHeadersXCFramework', () => {
  const unflagged: SPMProduct = { ...product(), podName: NAME, targets: [] };
  const flagged: SPMProduct = { ...unflagged, headersXCFramework: true };

  it('writes from the debug flavor when the run builds debug, in either flavor order', () => {
    assert.equal(shouldWriteHeadersXCFramework(flagged, 'Debug', ['Debug', 'Release']), true);
    assert.equal(shouldWriteHeadersXCFramework(flagged, 'Release', ['Debug', 'Release']), false);
    assert.equal(shouldWriteHeadersXCFramework(flagged, 'Debug', ['Release', 'Debug']), true);
    assert.equal(shouldWriteHeadersXCFramework(flagged, 'Release', ['Release', 'Debug']), false);
  });

  it('writes from the release flavor when the run builds only release', () => {
    assert.equal(shouldWriteHeadersXCFramework(flagged, 'Release', ['Release']), true);
  });

  it('never writes for a product that did not opt in', () => {
    assert.equal(shouldWriteHeadersXCFramework(unflagged, 'Debug', ['Debug']), false);
    assert.equal(shouldWriteHeadersXCFramework(unflagged, 'Release', ['Release']), false);
  });
});

describe('composeStep', appleToolsOnly, () => {
  afterEach(() => mock.restoreAll());

  /** Runs the compose step for the Debug flavor of a Debug + Release run. */
  async function composeAsync(overrides: Partial<SPMProduct>) {
    const root = await makeTempRootAsync();
    const stepProduct: SPMProduct = { ...product(), podName: NAME, targets: [], ...overrides };
    const pkg: SPMPackageSource = {
      path: path.join(root, 'package'),
      buildPath: path.join(root, 'build'),
      packageName: 'fixture-package',
      packageVersion: '1.0.0',
      getSwiftPMConfiguration: () => ({ products: [stepProduct] }),
    };
    await createSourceXCFrameworkAsync(path.join(pkg.path, 'Products', `${NAME}.xcframework`), [
      DEVICE,
    ]);
    const composeXCFramework = mock.method(Frameworks, 'composeXCFrameworkAsync', async () => {
      await createSourceXCFrameworkAsync(
        Frameworks.getFrameworkPath(pkg.buildPath, NAME, 'Debug'),
        [DEVICE]
      );
    });

    const ctx = createContext(
      createRequest([], {
        clean: false,
        cleanCache: false,
        skipGenerate: false,
        skipArtifacts: false,
        skipBuild: false,
        skipCompose: false,
        skipVerify: false,
        verbose: false,
      })
    );
    ctx.currentPackage = pkg;
    ctx.currentProduct = stepProduct;
    ctx.currentFlavor = 'Debug';
    await composeStep.run(ctx);

    return {
      composeXCFrameworkCalls: composeXCFramework.mock.callCount(),
      headersWritten: await fs.pathExists(
        path.join(getHeadersXCFrameworkPath(pkg.buildPath, NAME), DEVICE.id, STUB)
      ),
    };
  }

  it('writes the headers xcframework after composing an opted-in SPM product', async () => {
    assert.deepEqual(await composeAsync({ headersXCFramework: true }), {
      composeXCFrameworkCalls: 1,
      headersWritten: true,
    });
  });

  it('writes the headers xcframework after composing an opted-in customBuild product', async () => {
    const customBuild = { script: 'build.sh', output: `Products/${NAME}.xcframework` };
    assert.deepEqual(await composeAsync({ headersXCFramework: true, customBuild }), {
      composeXCFrameworkCalls: 0,
      headersWritten: true,
    });
  });

  it('writes no headers xcframework for a product that did not opt in', async () => {
    assert.deepEqual(await composeAsync({}), {
      composeXCFrameworkCalls: 1,
      headersWritten: false,
    });
  });
});

describe('spm.config.json schema', () => {
  it('accepts headersXCFramework as a boolean product option', () => {
    assert.equal(schema.definitions.product.additionalProperties, false);
    assert.equal(schema.definitions.product.properties.headersXCFramework.type, 'boolean');
  });
});
