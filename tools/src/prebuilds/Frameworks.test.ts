/**
 * Tests for composed xcframeworks:
 *  - copyResourceBundlesIntoXCFrameworkAsync — resource bundle placement
 *  - Frameworks.findFrameworkAtAnyVersion — locating a built product on disk
 */
import fs from 'fs-extra';
import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import os from 'os';
import path from 'path';

import type { SPMPackageSource } from './ExternalPackage';
import { copyResourceBundlesIntoXCFrameworkAsync, Frameworks } from './Frameworks';
import { SPMBuild } from './SPMBuild';
import type { SPMConfig, SPMProduct } from './SPMConfig.types';
import { setForceNonInteractive } from './Utils';

setForceNonInteractive(true);

const PACKAGE_NAME = 'expo-media-library';
const PRODUCT_NAME = 'ExpoMediaLibrary';
const TARGET_NAME = 'ExpoMediaLibrary';
const BUNDLE_NAME = `${PACKAGE_NAME}_${TARGET_NAME}.bundle`;
const MARKER = 'Photos.strings';

const SLICE_SDKS: Record<string, string> = {
  'ios-arm64': 'iphoneos',
  'ios-arm64_x86_64-simulator': 'iphonesimulator',
};

const productWithResources: SPMProduct = {
  name: PRODUCT_NAME,
  podName: PRODUCT_NAME,
  platforms: ['iOS(.v15)'],
  targets: [
    {
      type: 'swift',
      name: TARGET_NAME,
      path: 'ios',
      resources: [{ path: 'Resources', rule: 'process' }],
    },
  ],
};

const productWithoutResources: SPMProduct = {
  ...productWithResources,
  targets: [{ type: 'swift', name: TARGET_NAME, path: 'ios' }],
};

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((root) => fs.remove(root)));
});

/**
 * Lays out an xcframework whose slices contain only the product framework, plus the SPM build
 * output the copier reads the resource bundle from.
 */
async function createFixtureAsync(options: {
  slices: string[];
  builtBundleSlices?: string[];
  product?: typeof productWithResources;
}): Promise<{ pkg: SPMPackageSource; xcframeworkPath: string }> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'prebuild-resource-bundles-'));
  tempRoots.push(root);

  const pkg: SPMPackageSource = {
    path: path.join(root, 'packages', PACKAGE_NAME),
    buildPath: path.join(root, 'build'),
    packageName: PACKAGE_NAME,
    packageVersion: '1.0.0',
    getSwiftPMConfiguration: (): SPMConfig => ({
      products: [options.product ?? productWithResources],
    }),
  };

  const xcframeworkPath = path.join(root, `${PRODUCT_NAME}.xcframework`);
  for (const slice of options.slices) {
    await fs.mkdirp(path.join(xcframeworkPath, slice, `${PRODUCT_NAME}.framework`));
  }

  const buildProductsPath = path.join(
    SPMBuild.getPackageBuildPath(pkg, productWithResources, 'Debug'),
    'Build',
    'Products'
  );
  for (const slice of options.builtBundleSlices ?? options.slices) {
    const sdk = SLICE_SDKS[slice];
    if (!sdk) {
      continue;
    }
    await fs.outputFile(
      path.join(buildProductsPath, `Debug-${sdk}`, BUNDLE_NAME, MARKER),
      `${slice}\n`
    );
  }

  return { pkg, xcframeworkPath };
}

describe('copyResourceBundlesIntoXCFrameworkAsync', () => {
  it('copies the resource bundle into the product framework of every slice', async () => {
    const slices = Object.keys(SLICE_SDKS);
    const { pkg, xcframeworkPath } = await createFixtureAsync({ slices });

    await copyResourceBundlesIntoXCFrameworkAsync(
      pkg,
      productWithResources,
      'Debug',
      slices,
      xcframeworkPath
    );

    for (const slice of slices) {
      const markerPath = path.join(
        xcframeworkPath,
        slice,
        `${PRODUCT_NAME}.framework`,
        BUNDLE_NAME,
        MARKER
      );
      assert.equal(
        await fs.readFile(markerPath, 'utf8'),
        `${slice}\n`,
        `Expected the slice's own resource bundle inside ${slice}/${PRODUCT_NAME}.framework`
      );
    }
  });

  it('leaves no resource bundle beside the framework, where embedding cannot reach it', async () => {
    const slices = Object.keys(SLICE_SDKS);
    const { pkg, xcframeworkPath } = await createFixtureAsync({ slices });

    await copyResourceBundlesIntoXCFrameworkAsync(
      pkg,
      productWithResources,
      'Debug',
      slices,
      xcframeworkPath
    );

    for (const slice of slices) {
      const sliceEntries = await fs.readdir(path.join(xcframeworkPath, slice));
      assert.deepEqual(
        sliceEntries.filter((entry) => entry.endsWith('.bundle')),
        [],
        `Slice ${slice} must not carry a resource bundle beside the framework`
      );
    }
  });

  it('skips slices with an unrecognized identifier', async () => {
    const slices = ['ios-arm64', 'watchos-arm64_32'];
    const { pkg, xcframeworkPath } = await createFixtureAsync({ slices });

    await copyResourceBundlesIntoXCFrameworkAsync(
      pkg,
      productWithResources,
      'Debug',
      slices,
      xcframeworkPath
    );

    assert.deepEqual(
      await fs.readdir(path.join(xcframeworkPath, 'watchos-arm64_32', `${PRODUCT_NAME}.framework`)),
      []
    );
  });

  it('does nothing when no target declares resources', async () => {
    const slices = ['ios-arm64'];
    const { pkg, xcframeworkPath } = await createFixtureAsync({
      slices,
      product: productWithoutResources,
    });

    await copyResourceBundlesIntoXCFrameworkAsync(
      pkg,
      productWithoutResources,
      'Debug',
      slices,
      xcframeworkPath
    );

    assert.deepEqual(
      await fs.readdir(path.join(xcframeworkPath, 'ios-arm64', `${PRODUCT_NAME}.framework`)),
      []
    );
  });
});

const VERSION_PREFIX = path.join('2.2.0', '0.87.1', '250829098.0.17');

interface BuiltArtifact {
  flavor: 'debug' | 'release';
  versionPrefix?: string;
  productName?: string;
}

function artifactPath(
  buildPath: string,
  { flavor, versionPrefix, productName = PRODUCT_NAME }: BuiltArtifact
): string {
  return path.join(
    buildPath,
    'output',
    ...(versionPrefix ? [versionPrefix] : []),
    flavor,
    'xcframeworks',
    `${productName}.xcframework`
  );
}

async function createBuildPathAsync(artifacts: BuiltArtifact[]): Promise<string> {
  const buildPath = await fs.mkdtemp(path.join(os.tmpdir(), 'prebuild-find-framework-'));
  tempRoots.push(buildPath);
  for (const artifact of artifacts) {
    await fs.mkdirp(artifactPath(buildPath, artifact));
  }
  return buildPath;
}

describe('findFrameworkAtAnyVersion', () => {
  it('returns the non-versioned xcframework when the package has one', async () => {
    const buildPath = await createBuildPathAsync([{ flavor: 'debug' }]);

    assert.equal(
      Frameworks.findFrameworkAtAnyVersion(buildPath, PRODUCT_NAME, 'Debug'),
      artifactPath(buildPath, { flavor: 'debug' })
    );
  });

  it('falls back to a versioned xcframework when only that one was built', async () => {
    const artifact: BuiltArtifact = { flavor: 'release', versionPrefix: VERSION_PREFIX };
    const buildPath = await createBuildPathAsync([artifact]);

    assert.equal(
      Frameworks.findFrameworkAtAnyVersion(buildPath, PRODUCT_NAME, 'Release'),
      artifactPath(buildPath, artifact)
    );
  });

  it('prefers the non-versioned xcframework when a versioned one also exists', async () => {
    const versioned: BuiltArtifact = { flavor: 'debug', versionPrefix: VERSION_PREFIX };
    const buildPath = await createBuildPathAsync([versioned, { flavor: 'debug' }]);

    assert.equal(
      Frameworks.findFrameworkAtAnyVersion(buildPath, PRODUCT_NAME, 'Debug'),
      artifactPath(buildPath, { flavor: 'debug' })
    );
  });

  it('returns null when the product has not been built', async () => {
    const buildPath = await createBuildPathAsync([]);

    assert.equal(Frameworks.findFrameworkAtAnyVersion(buildPath, PRODUCT_NAME, 'Debug'), null);
  });

  it('chooses the lexicographically first version when several are built', async () => {
    const earlier: BuiltArtifact = { flavor: 'debug', versionPrefix: VERSION_PREFIX };
    const later: BuiltArtifact = {
      flavor: 'debug',
      versionPrefix: path.join('2.3.0', '0.87.1', '250829098.0.17'),
    };
    // Created newest-first so the expected answer is not simply the one created first. Glob does
    // not promise enumeration order either way, so the real guard is the sort itself.
    const buildPath = await createBuildPathAsync([later, earlier]);

    assert.equal(
      Frameworks.findFrameworkAtAnyVersion(buildPath, PRODUCT_NAME, 'Debug'),
      artifactPath(buildPath, earlier)
    );
  });

  it('ignores an xcframework whose version prefix has the wrong number of segments', async () => {
    const buildPath = await createBuildPathAsync([{ flavor: 'debug', versionPrefix: '1.0.0' }]);

    assert.equal(Frameworks.findFrameworkAtAnyVersion(buildPath, PRODUCT_NAME, 'Debug'), null);
  });

  it('returns the requested product, not another one built beside it', async () => {
    const requested: BuiltArtifact = { flavor: 'debug', versionPrefix: VERSION_PREFIX };
    const buildPath = await createBuildPathAsync([
      { ...requested, productName: 'ExpoImage' },
      requested,
    ]);

    assert.equal(
      Frameworks.findFrameworkAtAnyVersion(buildPath, PRODUCT_NAME, 'Debug'),
      artifactPath(buildPath, requested)
    );
  });

  it('never returns an artifact built for the other flavor', async () => {
    const buildPath = await createBuildPathAsync([
      { flavor: 'debug' },
      { flavor: 'debug', versionPrefix: VERSION_PREFIX },
    ]);

    assert.equal(Frameworks.findFrameworkAtAnyVersion(buildPath, PRODUCT_NAME, 'Release'), null);
  });
});
