/**
 * Pure-function tests for path builders across the prebuild pipeline.
 *
 * These test the string-returning path functions from Frameworks, SPMBuild,
 * SPMGenerator, Artifacts, and Dependencies — no filesystem, no mocking.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import path from 'path';

import { Artifacts } from './Artifacts';
import { Dependencies } from './Dependencies';
import type { SPMPackageSource } from './ExternalPackage';
import { Frameworks } from './Frameworks';
import { SPMBuild, getBuildFolderPrefixForPlatform, getBuildPlatformsForProduct } from './SPMBuild';
import type { SPMProduct, SPMTarget, BuildPlatform } from './SPMConfig.types';
import { SPMGenerator } from './SPMGenerator';

// ---------------------------------------------------------------------------
// Stub helpers — minimal objects with only the fields the path functions read
// ---------------------------------------------------------------------------

function stubPkg(overrides: Partial<SPMPackageSource> = {}): SPMPackageSource {
  return {
    path: '/repo/packages/expo-foo',
    buildPath: '/repo/packages/precompile/.build/expo-foo',
    packageName: 'expo-foo',
    packageVersion: '1.0.0',
    getSwiftPMConfiguration: () => ({ products: [] }),
    ...overrides,
  };
}

function stubProduct(overrides: Partial<SPMProduct> = {}): SPMProduct {
  return {
    name: 'ExpoFoo',
    podName: 'ExpoFoo',
    platforms: ['iOS(.v15)'],
    targets: [],
    ...overrides,
  };
}

function stubTarget(overrides: Partial<SPMTarget> = {}): SPMTarget {
  return {
    type: 'objc',
    name: 'ExpoFoo_ios',
    path: 'ios',
    ...overrides,
  } as SPMTarget;
}

// ---------------------------------------------------------------------------
// Frameworks path functions
// ---------------------------------------------------------------------------

describe('Frameworks path functions', () => {
  const buildPath = '/repo/packages/precompile/.build/expo-foo';

  describe('getFrameworksOutputPath', () => {
    it('returns correct path for Debug', () => {
      const result = Frameworks.getFrameworksOutputPath(buildPath, 'Debug');
      assert.equal(result, path.join(buildPath, 'output', 'debug', 'xcframeworks'));
    });

    it('returns correct path for Release', () => {
      const result = Frameworks.getFrameworksOutputPath(buildPath, 'Release');
      assert.equal(result, path.join(buildPath, 'output', 'release', 'xcframeworks'));
    });

    it('lowercases the flavor', () => {
      const result = Frameworks.getFrameworksOutputPath(buildPath, 'Debug');
      assert.ok(result.includes('/debug/'));
      assert.ok(!result.includes('/Debug/'));
    });
  });

  describe('getFrameworkPath', () => {
    it('returns .xcframework path for Debug', () => {
      const result = Frameworks.getFrameworkPath(buildPath, 'ExpoFoo', 'Debug');
      assert.equal(
        result,
        path.join(buildPath, 'output', 'debug', 'xcframeworks', 'ExpoFoo.xcframework')
      );
    });

    it('returns .xcframework path for Release', () => {
      const result = Frameworks.getFrameworkPath(buildPath, 'ExpoFoo', 'Release');
      assert.equal(
        result,
        path.join(buildPath, 'output', 'release', 'xcframeworks', 'ExpoFoo.xcframework')
      );
    });
  });

  describe('getTarballPath', () => {
    it('returns .tar.gz path for Debug', () => {
      const result = Frameworks.getTarballPath(buildPath, 'ExpoFoo', 'Debug');
      assert.equal(
        result,
        path.join(buildPath, 'output', 'debug', 'xcframeworks', 'ExpoFoo.tar.gz')
      );
    });

    it('returns .tar.gz path for Release', () => {
      const result = Frameworks.getTarballPath(buildPath, 'ExpoFoo', 'Release');
      assert.equal(
        result,
        path.join(buildPath, 'output', 'release', 'xcframeworks', 'ExpoFoo.tar.gz')
      );
    });
  });
});

// ---------------------------------------------------------------------------
// SPMBuild path functions
// ---------------------------------------------------------------------------

describe('SPMBuild path functions', () => {
  const pkg = stubPkg();
  const product = stubProduct();

  describe('getPackageBuildPath', () => {
    it('returns frameworks subdirectory under output/<flavor>', () => {
      const result = SPMBuild.getPackageBuildPath(pkg, product, 'Debug');
      assert.equal(result, path.join(pkg.buildPath, 'output', 'debug', 'frameworks', product.name));
    });

    it('uses lowercase flavor', () => {
      const result = SPMBuild.getPackageBuildPath(pkg, product, 'Release');
      assert.ok(result.includes('/release/'));
    });
  });

  describe('getProductArtifactsPath', () => {
    it('returns Build/Products/<flavor>-<platform> path', () => {
      const result = SPMBuild.getProductArtifactsPath(pkg, product, 'Debug', 'iOS');
      const buildBase = SPMBuild.getPackageBuildPath(pkg, product, 'Debug');
      assert.equal(result, path.join(buildBase, 'Build', 'Products', 'Debug-iphoneos'));
    });

    it('uses correct platform prefix for iOS Simulator', () => {
      const result = SPMBuild.getProductArtifactsPath(pkg, product, 'Release', 'iOS Simulator');
      assert.ok(result.endsWith('Release-iphonesimulator'));
    });
  });

  describe('getProductFrameworkArtifactsPath', () => {
    it('appends PackageFrameworks/<productName>.framework', () => {
      const result = SPMBuild.getProductFrameworkArtifactsPath(pkg, product, 'Debug', 'iOS');
      assert.ok(result.endsWith(path.join('PackageFrameworks', 'ExpoFoo.framework')));
    });
  });

  describe('getProductSymbolsBundleArtifactsPath', () => {
    it('appends <productName>.framework.dSYM', () => {
      const result = SPMBuild.getProductSymbolsBundleArtifactsPath(pkg, product, 'Debug', 'iOS');
      assert.ok(result.endsWith('ExpoFoo.framework.dSYM'));
    });
  });

  describe('getBuildFolderPrefixForPlatform', () => {
    const cases: [BuildPlatform, string][] = [
      ['iOS', 'iphoneos'],
      ['iOS Simulator', 'iphonesimulator'],
      ['macOS', 'macosx'],
      ['macOS,variant=Mac Catalyst', 'maccatalyst'],
      ['tvOS', 'appletvos'],
      ['tvOS Simulator', 'appletvsimulator'],
      ['visionOS', 'visionos'],
      ['visionOS Simulator', 'visionossimulator'],
    ];

    for (const [platform, expected] of cases) {
      it(`maps ${platform} → ${expected}`, () => {
        assert.equal(getBuildFolderPrefixForPlatform(platform), expected);
      });
    }
  });
});

// ---------------------------------------------------------------------------
// SPMGenerator path functions
// ---------------------------------------------------------------------------

describe('SPMGenerator path functions', () => {
  const pkg = stubPkg();
  const product = stubProduct();
  const target = stubTarget();

  describe('getGeneratedProductFilesPath', () => {
    it('returns <buildPath>/generated/<productName>/', () => {
      const result = SPMGenerator.getGeneratedProductFilesPath(pkg, product);
      assert.equal(result, path.join(pkg.buildPath, 'generated', product.name));
    });
  });

  describe('getHeaderFilesPath', () => {
    it('returns include/<moduleName> under target path', () => {
      const result = SPMGenerator.getHeaderFilesPath(pkg, product, target);
      const productPath = SPMGenerator.getGeneratedProductFilesPath(pkg, product);
      assert.equal(result, path.join(productPath, target.name, 'include', product.name));
    });

    it('uses target.moduleName when specified', () => {
      const customTarget = stubTarget({ moduleName: 'CustomModule' });
      const result = SPMGenerator.getHeaderFilesPath(pkg, product, customTarget);
      assert.ok(result.endsWith(path.join('include', 'CustomModule')));
    });

    it('falls back to product.name when no moduleName', () => {
      const noModuleTarget = stubTarget({ moduleName: undefined });
      const result = SPMGenerator.getHeaderFilesPath(pkg, product, noModuleTarget);
      assert.ok(result.endsWith(path.join('include', product.name)));
    });
  });

  describe('getTargetPath', () => {
    it('returns <productPath>/<targetName>', () => {
      const result = SPMGenerator.getTargetPath(pkg, product, target);
      const productPath = SPMGenerator.getGeneratedProductFilesPath(pkg, product);
      assert.equal(result, path.join(productPath, target.name));
    });
  });

  describe('getSwiftPackagePath', () => {
    it('returns Package.swift under product path', () => {
      const result = SPMGenerator.getSwiftPackagePath(pkg, product);
      const productPath = SPMGenerator.getGeneratedProductFilesPath(pkg, product);
      assert.equal(result, path.join(productPath, 'Package.swift'));
    });
  });
});

// ---------------------------------------------------------------------------
// Artifacts path functions
// ---------------------------------------------------------------------------

describe('Artifacts path functions', () => {
  describe('getCachePath', () => {
    it('returns default path when env var not set', () => {
      const original = process.env.EXPO_PREBUILD_CACHE_PATH;
      delete process.env.EXPO_PREBUILD_CACHE_PATH;
      try {
        const result = Artifacts.getCachePath('/repo/packages');
        assert.equal(result, path.join('/repo/packages', 'precompile', '.cache'));
      } finally {
        if (original !== undefined) {
          process.env.EXPO_PREBUILD_CACHE_PATH = original;
        }
      }
    });

    it('returns env var path when set', () => {
      const original = process.env.EXPO_PREBUILD_CACHE_PATH;
      process.env.EXPO_PREBUILD_CACHE_PATH = '/custom/cache';
      try {
        const result = Artifacts.getCachePath('/repo/packages');
        assert.equal(result, '/custom/cache');
      } finally {
        if (original !== undefined) {
          process.env.EXPO_PREBUILD_CACHE_PATH = original;
        } else {
          delete process.env.EXPO_PREBUILD_CACHE_PATH;
        }
      }
    });
  });

  describe('getVersionedArtifactPath', () => {
    it('returns <cache>/<name>/<version>/<flavor>/', () => {
      const result = Artifacts.getVersionedArtifactPath('/cache', 'hermes', '0.76.0', 'Debug');
      assert.equal(result, path.join('/cache', 'hermes', '0.76.0', 'debug'));
    });

    it('lowercases the flavor', () => {
      const result = Artifacts.getVersionedArtifactPath('/cache', 'react', '0.76.0', 'Release');
      assert.ok(result.endsWith('/release'));
    });
  });
});

// ---------------------------------------------------------------------------
// Dependencies path functions
// ---------------------------------------------------------------------------

describe('Dependencies path functions', () => {
  describe('getPackageDependenciesPath', () => {
    it('returns <pkg.path>/.dependencies', () => {
      const pkg = stubPkg();
      const result = Dependencies.getPackageDependenciesPath(pkg);
      assert.equal(result, path.join(pkg.path, '.dependencies'));
    });
  });
});

// ---------------------------------------------------------------------------
// getBuildPlatformsForProduct
// ---------------------------------------------------------------------------

describe('getBuildPlatformsForProduct', () => {
  it('returns all platforms for iOS product', () => {
    const product = stubProduct({ platforms: ['iOS(.v15)'] });
    const result = getBuildPlatformsForProduct(product);
    assert.deepEqual(result, ['iOS', 'iOS Simulator']);
  });

  it('returns filtered platform when platform argument is provided', () => {
    const product = stubProduct({ platforms: ['iOS(.v15)'] });
    const result = getBuildPlatformsForProduct(product, 'iOS');
    assert.deepEqual(result, ['iOS']);
  });

  it('returns empty array when filtering to non-matching platform', () => {
    const product = stubProduct({ platforms: ['iOS(.v15)'] });
    const result = getBuildPlatformsForProduct(product, 'macOS');
    assert.deepEqual(result, []);
  });

  it('returns multiple platform families when product has multiple platforms', () => {
    const product = stubProduct({ platforms: ['iOS(.v15)', 'tvOS(.v15)'] });
    const result = getBuildPlatformsForProduct(product);
    assert.deepEqual(result, ['iOS', 'iOS Simulator', 'tvOS', 'tvOS Simulator']);
  });
});
