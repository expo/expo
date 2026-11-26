import plist from '@expo/plist';
import spawnAsync from '@expo/spawn-async';
import fs from 'fs-extra';
import assert from 'node:assert/strict';
import { after, afterEach, before, describe, it, mock } from 'node:test';
import os from 'os';
import path from 'path';

import type { SPMPackageSource } from './ExternalPackage';
import { Frameworks } from './Frameworks';
import type { BuildFlavor } from './Prebuilder.types';
import type { SPMProduct } from './SPMConfig.types';
import { makeStubXCFrameworkAsync } from './StubXCFramework';
import { FrameworkVerifier } from './Verifier';
import { createContext, createRequest } from './pipeline/Context';
import { composeStep, verifyStep } from './pipeline/ProductSteps';
import type { UnitStatus } from './pipeline/Types';

const NAME = 'Fixture';
const INSTALL_NAME = `@rpath/${NAME}.framework/${NAME}`;

const appleToolsOnly = {
  skip:
    process.platform !== 'darwin' && 'needs xcrun, lipo and xcodebuild, which only macOS provides',
};

type FixtureSlice = { sdk: string; archs: string[]; environment?: string };

const SLICES: FixtureSlice[] = [
  { sdk: 'iphoneos', archs: ['arm64'] },
  { sdk: 'iphonesimulator', archs: ['arm64', 'x86_64'], environment: 'simulator' },
];

const tempRoots: string[] = [];

after(async () => {
  await Promise.all(tempRoots.splice(0).map((root) => fs.remove(root)));
});

async function makeTempRootAsync(): Promise<string> {
  const root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'stub-xcframework-')));
  tempRoots.push(root);
  return root;
}

async function xcrunAsync(...args: string[]): Promise<string> {
  return (await spawnAsync('xcrun', args)).stdout;
}

async function buildFrameworkAsync(root: string, slice: FixtureSlice) {
  const sliceRoot = path.join(root, slice.sdk);
  const framework = path.join(sliceRoot, `${NAME}.framework`);
  await fs.outputFile(
    path.join(framework, 'Headers', `${NAME}.h`),
    'int fixture_add(int a, int b);\n'
  );
  await fs.symlink(`${NAME}.h`, path.join(framework, 'Headers', 'Alias.h'));
  await fs.outputFile(
    path.join(framework, 'Modules', 'module.modulemap'),
    `framework module ${NAME} {\n  umbrella header "${NAME}.h"\n  export *\n}\n`
  );
  const swiftModule = path.join(framework, 'Modules', `${NAME}.swiftmodule`);
  await fs.outputFile(path.join(swiftModule, 'arm64-apple-ios.swiftinterface'), '// interface\n');
  await fs.outputFile(path.join(swiftModule, 'arm64-apple-ios.abi.json'), '{}\n');
  await fs.outputFile(path.join(swiftModule, 'arm64-apple-ios.swiftdoc'), 'doc');
  await fs.outputFile(path.join(swiftModule, 'Project', 'arm64-apple-ios.swiftsourceinfo'), 'info');
  await fs.outputFile(path.join(framework, 'PrivacyInfo.xcprivacy'), plist.build({}));
  await fs.outputFile(path.join(framework, `${NAME}.bundle`, 'data.txt'), 'resource');
  await fs.outputFile(
    path.join(framework, 'Info.plist'),
    plist.build({
      CFBundleExecutable: NAME,
      CFBundleIdentifier: 'dev.expo.fixture',
      CFBundlePackageType: 'FMWK',
      MinimumOSVersion: '15.1',
    })
  );

  const source = path.join(sliceRoot, `${NAME}.c`);
  await fs.outputFile(source, 'int fixture_add(int a, int b) { return a + b; }\n');
  const sysroot = (await xcrunAsync('--sdk', slice.sdk, '--show-sdk-path')).trim();
  const thinBinaries: string[] = [];
  for (const arch of slice.archs) {
    const thin = path.join(sliceRoot, `${NAME}-${arch}`);
    const target = `${arch}-apple-ios15.1${slice.environment ? `-${slice.environment}` : ''}`;
    await xcrunAsync(
      'clang',
      ...['-dynamiclib', '-g', source, '-o', thin, '-target', target, '-isysroot', sysroot],
      ...['-install_name', INSTALL_NAME, '-current_version', '2.3.4'],
      ...['-compatibility_version', '2.0.0']
    );
    thinBinaries.push(thin);
  }
  const binary = path.join(framework, NAME);
  await xcrunAsync('lipo', '-create', ...thinBinaries, '-output', binary);
  const dsym = path.join(sliceRoot, `${NAME}.framework.dSYM`);
  await xcrunAsync('dsymutil', binary, '-o', dsym);
  return { framework, dsym };
}

async function buildDebugXCFrameworkAsync(output: string): Promise<void> {
  const root = await makeTempRootAsync();
  const args: string[] = [];
  for (const slice of SLICES) {
    const { framework, dsym } = await buildFrameworkAsync(root, slice);
    args.push('-framework', framework, '-debug-symbols', dsym);
  }
  await spawnAsync('xcodebuild', ['-create-xcframework', ...args, '-output', output]);
}

async function listFilesAsync(root: string, relative = ''): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await fs.readdir(path.join(root, relative), { withFileTypes: true })) {
    const entryPath = path.join(relative, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFilesAsync(root, entryPath)));
    } else {
      files.push(entryPath);
    }
  }
  return files.sort();
}

async function readEntryAsync(file: string): Promise<string> {
  const stat = await fs.lstat(file);
  return stat.isSymbolicLink()
    ? `symlink -> ${await fs.readlink(file)}`
    : (await fs.readFile(file)).toString('base64');
}

/** The LC_ID_DYLIB and LC_BUILD_VERSION fields a consumer links and loads against. */
async function dylibIdentityAsync(binary: string, arch: string): Promise<string[]> {
  const output = await xcrunAsync('otool', '-arch', arch, '-l', binary);
  return output
    .split(/^Load command \d+$/m)
    .filter((block) => /cmd (LC_ID_DYLIB|LC_BUILD_VERSION)$/m.test(block))
    .flatMap((block) =>
      block
        .split('\n')
        .map((line) => line.trim())
        .filter((line) =>
          /^(name|current version|compatibility version|platform|minos) /.test(line)
        )
    );
}

const isKeptInStub = (file: string) =>
  file === 'Info.plist' ||
  (new RegExp(`^[^/]+/${NAME}\\.framework/(Info\\.plist|Headers/|Modules/|${NAME}$)`).test(file) &&
    !/\.(abi\.json|swiftdoc|swiftsourceinfo)$/.test(file));

describe('makeStubXCFrameworkAsync', () => {
  let debugXCFramework: string;
  let stubXCFramework: string;

  before(async () => {
    if (process.platform !== 'darwin') return;
    const root = await makeTempRootAsync();
    debugXCFramework = path.join(root, 'debug', `${NAME}.xcframework`);
    stubXCFramework = path.join(root, 'release', `${NAME}.xcframework`);
    await buildDebugXCFrameworkAsync(debugXCFramework);
    await makeStubXCFrameworkAsync(debugXCFramework, stubXCFramework);
  });

  it(
    'keeps only the Info.plists, Headers, Modules and binary of each slice',
    appleToolsOnly,
    async () => {
      const debugFiles = await listFilesAsync(debugXCFramework);
      assert.ok(debugFiles.some((file) => file.endsWith('PrivacyInfo.xcprivacy')));
      assert.ok(debugFiles.some((file) => file.includes('.dSYM/')));
      assert.ok(debugFiles.some((file) => file.endsWith(`${NAME}.bundle/data.txt`)));
      assert.ok(debugFiles.some((file) => file.endsWith('.abi.json')));

      assert.deepEqual(await listFilesAsync(stubXCFramework), debugFiles.filter(isKeptInStub));
    }
  );

  it(
    'copies the framework Info.plists, Headers and Modules byte for byte, symlinks included',
    appleToolsOnly,
    async () => {
      const copied = (await listFilesAsync(stubXCFramework)).filter(
        (file) => file !== 'Info.plist' && !file.endsWith(`/${NAME}`)
      );
      assert.ok(copied.some((file) => file.endsWith('Headers/Alias.h')));
      for (const file of copied) {
        assert.equal(
          await readEntryAsync(path.join(stubXCFramework, file)),
          await readEntryAsync(path.join(debugXCFramework, file)),
          file
        );
      }
      const alias = (await listFilesAsync(debugXCFramework)).find((file) =>
        file.endsWith('Headers/Alias.h')
      )!;
      assert.ok((await fs.lstat(path.join(stubXCFramework, alias))).isSymbolicLink());
    }
  );

  it('drops only DebugSymbolsPath from the XCFramework Info.plist', appleToolsOnly, async () => {
    const debugInfoPlist = await fs.readFile(path.join(debugXCFramework, 'Info.plist'), 'utf8');
    const debugSymbolsEntry = /^\s*<key>DebugSymbolsPath<\/key>\n\s*<string>[^<]*<\/string>\n/gm;
    assert.equal(debugInfoPlist.match(debugSymbolsEntry)?.length, SLICES.length);

    assert.equal(
      await fs.readFile(path.join(stubXCFramework, 'Info.plist'), 'utf8'),
      debugInfoPlist.replace(debugSymbolsEntry, '')
    );
  });

  it(
    'replaces each binary with an empty dylib with the same identity',
    appleToolsOnly,
    async () => {
      const binaries = (await listFilesAsync(debugXCFramework)).filter((file) =>
        file.endsWith(`.framework/${NAME}`)
      );
      assert.equal(binaries.length, SLICES.length);
      for (const binary of binaries) {
        const debugBinary = path.join(debugXCFramework, binary);
        const stubBinary = path.join(stubXCFramework, binary);
        const archs = (await xcrunAsync('lipo', '-archs', debugBinary)).trim();
        assert.equal((await xcrunAsync('lipo', '-archs', stubBinary)).trim(), archs, binary);

        for (const arch of archs.split(' ')) {
          const identity = await dylibIdentityAsync(stubBinary, arch);
          assert.ok(identity.includes(`name ${INSTALL_NAME} (offset 24)`), identity.join('\n'));
          assert.deepEqual(
            identity,
            await dylibIdentityAsync(debugBinary, arch),
            `${binary} ${arch}`
          );
        }

        assert.match(await xcrunAsync('nm', '-gU', debugBinary), /_fixture_add/);
        assert.doesNotMatch(await xcrunAsync('nm', '-gU', stubBinary), /_fixture_add/);
      }
    }
  );

  it('rejects a versioned framework bundle before writing anything', appleToolsOnly, async () => {
    const root = await makeTempRootAsync();
    const source = path.join(root, `${NAME}.xcframework`);
    const output = path.join(root, 'out', `${NAME}.xcframework`);
    await fs.outputFile(
      path.join(source, 'Info.plist'),
      plist.build({
        AvailableLibraries: [
          {
            BinaryPath: `${NAME}.framework/Versions/A/${NAME}`,
            LibraryIdentifier: 'macos-arm64',
            LibraryPath: `${NAME}.framework`,
            SupportedArchitectures: ['arm64'],
            SupportedPlatform: 'macos',
          },
        ],
        CFBundlePackageType: 'XFWK',
        XCFrameworkFormatVersion: '1.0',
      })
    );

    await assert.rejects(makeStubXCFrameworkAsync(source, output), /macos-arm64.*versioned/s);
    assert.equal(await fs.pathExists(output), false);
  });
});

describe('releaseFlavor "stub" in the product pipeline', () => {
  const product: SPMProduct = {
    name: NAME,
    podName: NAME,
    platforms: ['iOS(.v15)'],
    targets: [],
    releaseFlavor: 'stub',
  };

  type UnitOptions = {
    /** The `--flavor` of the run; both flavors when absent. */
    requestedFlavor?: BuildFlavor;
    /** What this run recorded for the Debug unit; nothing when absent. */
    debugUnit?: Pick<UnitStatus, 'stages' | 'skipReason'>;
    unitProduct?: SPMProduct;
  };

  const composedDebugUnit = {
    stages: { generate: 'success', build: 'success', compose: 'success', verify: 'success' },
  } satisfies UnitOptions['debugUnit'];

  async function makeReleaseUnitAsync({
    requestedFlavor,
    debugUnit,
    unitProduct = product,
  }: UnitOptions = {}) {
    const root = await makeTempRootAsync();
    const pkg: SPMPackageSource = {
      path: path.join(root, 'fixture-package'),
      buildPath: path.join(root, '.build', 'fixture-package'),
      packageName: 'fixture-package',
      packageVersion: '1.0.0',
      getSwiftPMConfiguration: () => ({ products: [unitProduct] }),
    };
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
        flavor: requestedFlavor,
      })
    );
    if (debugUnit) {
      ctx.statuses.push({
        packageName: pkg.packageName,
        productName: unitProduct.name,
        flavor: 'Debug',
        unitId: `${pkg.packageName}/${unitProduct.name}[Debug]`,
        elapsedMs: 0,
        ...debugUnit,
      });
    }
    ctx.currentPackage = pkg;
    ctx.currentProduct = unitProduct;
    ctx.currentFlavor = 'Release';
    return { pkg, ctx };
  }

  async function listTarballAsync(
    pkg: SPMPackageSource,
    tarball = Frameworks.getTarballPath(pkg.buildPath, NAME, 'Release')
  ): Promise<string[]> {
    const { stdout } = await spawnAsync('tar', ['-tzf', tarball]);
    return stdout
      .split('\n')
      .filter((entry) => entry && !entry.endsWith('/'))
      .sort();
  }

  for (const [debugOutcome, debugUnit, reason] of [
    [
      'failed',
      { stages: { ...composedDebugUnit.stages, compose: 'failed', verify: 'skipped' } },
      /Debug flavor of Fixture failed in this run/,
    ],
    [
      'was skipped',
      {
        stages: { generate: 'skipped', build: 'skipped', compose: 'skipped', verify: 'skipped' },
        skipReason: 'dependency expo-dev-menu-interface failed',
      },
      /Debug flavor of Fixture was skipped in this run \(dependency expo-dev-menu-interface failed\)/,
    ],
  ] as const) {
    it(`does not stub an older Debug XCFramework when this run's Debug unit ${debugOutcome}`, async () => {
      const { pkg, ctx } = await makeReleaseUnitAsync({ debugUnit });
      await fs.outputFile(
        path.join(Frameworks.getFrameworkPath(pkg.buildPath, NAME, 'Debug'), 'Info.plist'),
        plist.build({ AvailableLibraries: [] })
      );

      await assert.rejects(composeStep.run(ctx), (error: Error) => {
        assert.match(error.message, /Cannot compose the Release flavor of Fixture/);
        assert.match(error.message, reason);
        assert.match(error.message, /older Debug XCFramework/);
        assert.match(error.message, /run the prebuild again/);
        return true;
      });
      assert.equal(
        await fs.pathExists(Frameworks.getFrameworkPath(pkg.buildPath, NAME, 'Release')),
        false
      );
    });
  }

  it('fails the Release flavor with a next step when no Debug XCFramework exists', async () => {
    const { ctx } = await makeReleaseUnitAsync({ requestedFlavor: 'Release' });
    await assert.rejects(composeStep.run(ctx), (error: Error) => {
      assert.match(error.message, /Release flavor of Fixture/);
      assert.match(error.message, /"releaseFlavor": "stub"/);
      assert.match(error.message, /Debug XCFramework/);
      assert.match(error.message, /Build the Debug flavor/);
      return true;
    });
  });

  it(
    'writes, packs and verifies the stub of a Debug XCFramework on disk in a Release-only run',
    appleToolsOnly,
    async () => {
      const { pkg, ctx } = await makeReleaseUnitAsync({ requestedFlavor: 'Release' });
      await buildDebugXCFrameworkAsync(Frameworks.getFrameworkPath(pkg.buildPath, NAME, 'Debug'));

      await composeStep.run(ctx);

      const releaseXCFramework = Frameworks.getFrameworkPath(pkg.buildPath, NAME, 'Release');
      const written = (await listFilesAsync(releaseXCFramework)).map((file) =>
        path.join(`${NAME}.xcframework`, file)
      );
      assert.deepEqual(await listTarballAsync(pkg), written);
      assert.ok(written.some((file) => file.endsWith('Modules/module.modulemap')));

      await verifyStep.run(ctx);
    }
  );

  it(
    'packs only the stub, not dependency frameworks left in the release output',
    appleToolsOnly,
    async () => {
      const { pkg, ctx } = await makeReleaseUnitAsync({
        debugUnit: composedDebugUnit,
        unitProduct: {
          ...product,
          spmPackages: [
            {
              url: 'https://example.com/stale-dep.git',
              productName: 'StaleDep',
              version: { exact: '1.0.0' },
            },
          ],
        },
      });
      await buildDebugXCFrameworkAsync(Frameworks.getFrameworkPath(pkg.buildPath, NAME, 'Debug'));
      const releaseOutput = Frameworks.getFrameworksOutputPath(pkg.buildPath, 'Release');
      await fs.outputFile(path.join(releaseOutput, 'StaleDep.xcframework', 'Info.plist'), 'stale');

      await composeStep.run(ctx);

      const packed = await listTarballAsync(pkg);
      assert.ok(packed.length > 0);
      assert.deepEqual(
        packed.filter((entry) => !entry.startsWith(`${NAME}.xcframework/`)),
        []
      );
    }
  );

  it('fails verification when a stub header differs from Debug', appleToolsOnly, async () => {
    const { pkg, ctx } = await makeReleaseUnitAsync({ debugUnit: composedDebugUnit });
    await buildDebugXCFrameworkAsync(Frameworks.getFrameworkPath(pkg.buildPath, NAME, 'Debug'));
    await composeStep.run(ctx);
    const releaseXCFramework = Frameworks.getFrameworkPath(pkg.buildPath, NAME, 'Release');
    const header = path.join('ios-arm64', `${NAME}.framework`, 'Headers', `${NAME}.h`);
    await fs.appendFile(path.join(releaseXCFramework, header), '// drift\n');

    await assert.rejects(verifyStep.run(ctx), (error: Error) => {
      assert.ok(error.message.includes(header), error.message);
      return true;
    });
  });

  describe('"realAndStub": a real Release flavor plus a stub in release-stub', () => {
    const realAndStub: SPMProduct = { ...product, releaseFlavor: 'realAndStub' };
    const REAL_RELEASE_MARKER = 'real release';

    afterEach(() => mock.restoreAll());

    async function makeRealAndStubUnitAsync(options: Omit<UnitOptions, 'unitProduct'> = {}) {
      const unit = await makeReleaseUnitAsync({ ...options, unitProduct: realAndStub });
      const composeXCFramework = mock.method(Frameworks, 'composeXCFrameworkAsync', async () => {
        await fs.outputFile(
          path.join(Frameworks.getFrameworkPath(unit.pkg.buildPath, NAME, 'Release'), 'Info.plist'),
          REAL_RELEASE_MARKER
        );
      });
      const releaseStub = Frameworks.getReleaseStubFrameworkPath(unit.pkg.buildPath, NAME);
      return { ...unit, composeXCFramework, releaseStub };
    }

    async function readRealReleaseAsync(pkg: SPMPackageSource): Promise<string> {
      const release = Frameworks.getFrameworkPath(pkg.buildPath, NAME, 'Release');
      return fs.readFile(path.join(release, 'Info.plist'), 'utf8');
    }

    it('composes the real Release flavor, then fails the stub with a next step when no Debug XCFramework exists', async () => {
      const { pkg, ctx, composeXCFramework, releaseStub } = await makeRealAndStubUnitAsync({
        requestedFlavor: 'Release',
      });

      await assert.rejects(composeStep.run(ctx), (error: Error) => {
        assert.match(error.message, /Release stub of Fixture/);
        assert.match(error.message, /"releaseFlavor": "realAndStub"/);
        assert.match(error.message, /Debug XCFramework/);
        assert.match(error.message, /Build the Debug flavor/);
        return true;
      });
      assert.equal(composeXCFramework.mock.callCount(), 1);
      assert.equal(await readRealReleaseAsync(pkg), REAL_RELEASE_MARKER);
      assert.equal(await fs.pathExists(releaseStub), false);
    });

    it("does not stub an older Debug XCFramework when this run's Debug unit failed", async () => {
      const { pkg, ctx, releaseStub } = await makeRealAndStubUnitAsync({
        debugUnit: { stages: { ...composedDebugUnit.stages, compose: 'failed' } },
      });
      await fs.outputFile(
        path.join(Frameworks.getFrameworkPath(pkg.buildPath, NAME, 'Debug'), 'Info.plist'),
        plist.build({ AvailableLibraries: [] })
      );

      await assert.rejects(composeStep.run(ctx), (error: Error) => {
        assert.match(error.message, /Release stub of Fixture/);
        assert.match(error.message, /"releaseFlavor": "realAndStub"/);
        assert.match(error.message, /Debug flavor of Fixture failed in this run/);
        return true;
      });
      assert.equal(await fs.pathExists(releaseStub), false);
    });

    it(
      'writes, packs and verifies the stub in release-stub and leaves the real Release flavor alone',
      appleToolsOnly,
      async () => {
        const { pkg, ctx, composeXCFramework, releaseStub } = await makeRealAndStubUnitAsync({
          debugUnit: composedDebugUnit,
        });
        await buildDebugXCFrameworkAsync(Frameworks.getFrameworkPath(pkg.buildPath, NAME, 'Debug'));

        await composeStep.run(ctx);

        assert.equal(composeXCFramework.mock.callCount(), 1);
        assert.equal(await readRealReleaseAsync(pkg), REAL_RELEASE_MARKER);
        const written = (await listFilesAsync(releaseStub)).map((file) =>
          path.join(`${NAME}.xcframework`, file)
        );
        assert.ok(written.some((file) => file.endsWith('Modules/module.modulemap')));
        assert.deepEqual(
          await listTarballAsync(pkg, Frameworks.getReleaseStubTarballPath(pkg.buildPath, NAME)),
          written
        );

        const verifyXCFramework = mock.method(
          FrameworkVerifier,
          'verifyXCFrameworkAsync',
          async () => new Map()
        );
        await verifyStep.run(ctx);
        assert.equal(verifyXCFramework.mock.callCount(), 1);

        const header = path.join('ios-arm64', `${NAME}.framework`, 'Headers', `${NAME}.h`);
        await fs.appendFile(path.join(releaseStub, header), '// drift\n');
        await assert.rejects(verifyStep.run(ctx), (error: Error) => {
          assert.ok(error.message.includes(header), error.message);
          return true;
        });
      }
    );
  });
});
