/**
 * Tests for xcframework composition:
 *  - copyResourceBundlesIntoXCFrameworkAsync (resource bundle placement)
 *  - rewriteInternalTargetModuleReferences (.swiftinterface module rewriting)
 */
import fs from 'fs-extra';
import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import os from 'os';
import path from 'path';

import type { SPMPackageSource } from './ExternalPackage';
import {
  copyResourceBundlesIntoXCFrameworkAsync,
  rewriteInternalTargetModuleReferences,
} from './Frameworks';
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

describe('rewriteInternalTargetModuleReferences', () => {
  const CORE_CONFIG: SPMConfig = {
    products: [
      {
        name: 'ExpoModulesCore',
        podName: 'ExpoModulesCore',
        platforms: ['iOS(.v15)'],
        targets: [
          { type: 'swift', name: 'ExpoModulesCore', path: 'ios' },
          { type: 'objc', name: 'ExpoModulesCore_ios_objc', path: 'ios/ObjC' },
        ],
      },
    ],
  };

  it('rewrites module selector references, keeping the `::` separator', () => {
    assert.equal(
      rewriteInternalTargetModuleReferences(
        'public func register(_ registry: ExpoModulesCore_ios_objc::EXModuleRegistry)',
        CORE_CONFIG
      ),
      'public func register(_ registry: ExpoModulesCore::EXModuleRegistry)'
    );
  });

  it('rewrites dot-qualified references, keeping the `.` separator', () => {
    assert.equal(
      rewriteInternalTargetModuleReferences(
        'public func register(_ registry: ExpoModulesCore_ios_objc.EXModuleRegistry)',
        CORE_CONFIG
      ),
      'public func register(_ registry: ExpoModulesCore.EXModuleRegistry)'
    );
  });

  it('rewrites both separators in the same interface, each keeping its own', () => {
    const contents = [
      'public var registry: ExpoModulesCore_ios_objc::EXModuleRegistry',
      'public var legacyRegistry: ExpoModulesCore_ios_objc.EXModuleRegistry',
    ].join('\n');

    assert.equal(
      rewriteInternalTargetModuleReferences(contents, CORE_CONFIG),
      [
        'public var registry: ExpoModulesCore::EXModuleRegistry',
        'public var legacyRegistry: ExpoModulesCore.EXModuleRegistry',
      ].join('\n')
    );
  });

  it('rewrites imports of the internal target to the product module', () => {
    const contents = [
      '@_exported import ExpoModulesCore_ios_objc',
      'import ExpoModulesCore_ios_objc',
    ].join('\n');

    assert.equal(
      rewriteInternalTargetModuleReferences(contents, CORE_CONFIG),
      ['@_exported import ExpoModulesCore', 'import ExpoModulesCore'].join('\n')
    );
  });

  it('leaves references to the target named after the product untouched', () => {
    const contents = [
      '@_exported import ExpoModulesCore',
      'public var view: ExpoModulesCore::ExpoView',
    ].join('\n');

    assert.equal(rewriteInternalTargetModuleReferences(contents, CORE_CONFIG), contents);
  });

  it('does not let a target corrupt the sibling target whose name it prefixes', () => {
    const siblingConfig: SPMConfig = {
      products: [
        {
          name: 'ExpoModulesCore',
          podName: 'ExpoModulesCore',
          platforms: ['iOS(.v15)'],
          targets: [
            { type: 'swift', name: 'ExpoModulesCore_ios', path: 'ios' },
            { type: 'objc', name: 'ExpoModulesCore_ios_objc', path: 'ios/ObjC' },
          ],
        },
      ],
    };
    const contents = [
      'public var registry: ExpoModulesCore_ios_objc::EXModuleRegistry',
      'public var view: ExpoModulesCore_ios::ExpoView',
    ].join('\n');

    assert.equal(
      rewriteInternalTargetModuleReferences(contents, siblingConfig),
      [
        'public var registry: ExpoModulesCore::EXModuleRegistry',
        'public var view: ExpoModulesCore::ExpoView',
      ].join('\n')
    );
  });

  it('leaves qualified references to other modules untouched', () => {
    const contents = [
      'public var name: Swift::String',
      '/// Wraps expo::createReactSchedulerHandle from the C++ runtime.',
      'public var jsi: ExpoModulesJSI::JavaScriptRuntime',
    ].join('\n');

    assert.equal(rewriteInternalTargetModuleReferences(contents, CORE_CONFIG), contents);
  });
});
