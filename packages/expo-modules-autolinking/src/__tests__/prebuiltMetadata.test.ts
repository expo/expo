import { vol } from 'memfs';
import path from 'path';

import type { LinkingOptionsLoader } from '../commands/autolinkingOptions';
import { resolvePrebuiltMetadataAsync } from '../prebuiltMetadata';

jest.mock('../autolinking/findModules');
jest.mock('../reactNativeConfig');

const { findModulesAsync } = require('../autolinking/findModules');
const { createReactNativeConfigAsync } = require('../reactNativeConfig');

const APP_ROOT = '/app';
const EXTERNAL_CONFIGS_DIR = path.resolve(__dirname, '../../external-configs/ios');
const VERSION_PREFIX = '15.15.4/0.87.1/250829098.0.17';

/** findExpoRepoRoot() resolves this from its own location, so a test that wants the
 * monorepo candidates has to plant the marker it probes for. */
const REPO_ROOT = path.resolve(__dirname, '../../../..');
const MONOREPO_BASE = path.join(REPO_ROOT, 'packages/precompile/.build');
const REPO_MARKER = path.join(REPO_ROOT, 'packages/expo-modules-core/spm.config.json');

const optionsLoader = {
  getCommandRoot: () => APP_ROOT,
  getAppRoot: async () => APP_ROOT,
  getPlatformOptions: async () => ({}),
} as unknown as LinkingOptionsLoader;

function mockInternalPackage(name: string, products: unknown[], { inRepo = false } = {}) {
  const packageRoot = `${APP_ROOT}/node_modules/${name}`;
  vol.fromJSON(
    {
      'package.json': JSON.stringify({ name }),
      'spm.config.json': JSON.stringify({ products }),
    },
    packageRoot
  );
  if (inRepo) {
    vol.fromJSON({ [REPO_MARKER]: '{}' });
  }
  findModulesAsync.mockResolvedValue({ [name]: { path: packageRoot } });
  return packageRoot;
}

function mockExternalPackage(name: string, products: unknown[]) {
  const packageRoot = `${APP_ROOT}/node_modules/${name}`;
  vol.fromJSON({
    [`${EXTERNAL_CONFIGS_DIR}/${name}/spm.config.json`]: JSON.stringify({ products }),
  });
  createReactNativeConfigAsync.mockResolvedValue({
    dependencies: { [name]: { root: packageRoot, name } },
  });
  return packageRoot;
}

beforeEach(() => {
  vol.reset();
  // The resolver falls back to this variable, so an exported one would silently add a
  // candidate base and turn the suite red on a machine set up for the pipeline.
  delete process.env.EXPO_PRECOMPILED_MODULES_PATH;
  findModulesAsync.mockResolvedValue({});
  createReactNativeConfigAsync.mockResolvedValue({ dependencies: {} });
});

describe('resolvePrebuiltMetadataAsync artifact locator', () => {
  it('locates an internal product and its shared SPM dependencies, without a version prefix', async () => {
    const packageRoot = mockInternalPackage('expo-image', [
      { name: 'ExpoImage', podName: 'ExpoImage', spmPackages: [{ productName: 'Lottie' }] },
    ]);

    const document = await resolvePrebuiltMetadataAsync(optionsLoader, { mode: 'app-plan' });

    expect(document.ExpoImage?.artifact).toEqual({
      bases: [`${packageRoot}/prebuilds/output`],
      debug: {
        dir: 'debug/xcframeworks',
        framework: 'debug/xcframeworks/ExpoImage.xcframework',
        tarball: 'debug/xcframeworks/ExpoImage.tar.gz',
      },
      release: {
        dir: 'release/xcframeworks',
        framework: 'release/xcframeworks/ExpoImage.xcframework',
        tarball: 'release/xcframeworks/ExpoImage.tar.gz',
      },
      sharedSpmDeps: {
        Lottie: {
          bases: [`${packageRoot}/prebuilds/spm-deps/Lottie`],
          debug: 'debug/Lottie.xcframework',
          release: 'release/Lottie.xcframework',
        },
      },
    });
  });

  it('describes an external product completely, under the caller-supplied version prefix', async () => {
    const packageRoot = mockExternalPackage('react-native-svg', [
      { name: 'RNSVG', podName: 'RNSVG', spmPackages: [{ productName: 'SVGNative' }] },
    ]);

    const document = await resolvePrebuiltMetadataAsync(optionsLoader, {
      mode: 'app-plan',
      versionPrefix: VERSION_PREFIX,
    });

    expect(document.RNSVG?.artifact).toEqual({
      bases: [
        `${packageRoot}/prebuilds/output/${VERSION_PREFIX}`,
        `${packageRoot}/prebuilds/output`,
      ],
      debug: {
        dir: 'debug/xcframeworks',
        framework: 'debug/xcframeworks/RNSVG.xcframework',
        tarball: 'debug/xcframeworks/RNSVG.tar.gz',
        remoteKey: `react-native-svg/output/${VERSION_PREFIX}/debug/xcframeworks/RNSVG.tar.gz`,
      },
      release: {
        dir: 'release/xcframeworks',
        framework: 'release/xcframeworks/RNSVG.xcframework',
        tarball: 'release/xcframeworks/RNSVG.tar.gz',
        remoteKey: `react-native-svg/output/${VERSION_PREFIX}/release/xcframeworks/RNSVG.tar.gz`,
      },
      sharedSpmDeps: {
        SVGNative: {
          bases: [`${packageRoot}/prebuilds/spm-deps/SVGNative`],
          debug: 'debug/SVGNative.xcframework',
          release: 'release/SVGNative.xcframework',
        },
      },
    });
  });

  it('prefers a custom modules path over the package-bundled directory', async () => {
    const packageRoot = mockInternalPackage('expo-image', [
      { name: 'ExpoImage', podName: 'ExpoImage' },
    ]);

    const document = await resolvePrebuiltMetadataAsync(optionsLoader, {
      mode: 'app-plan',
      customModulesPath: '/custom',
    });

    expect(document.ExpoImage?.artifact.bases).toEqual([
      '/custom/expo-image/output',
      `${packageRoot}/prebuilds/output`,
    ]);
  });

  it('offers the monorepo build directory when running inside an expo checkout', async () => {
    const packageRoot = mockInternalPackage(
      'expo-image',
      [{ name: 'ExpoImage', podName: 'ExpoImage', spmPackages: [{ productName: 'Lottie' }] }],
      { inRepo: true }
    );

    const document = await resolvePrebuiltMetadataAsync(optionsLoader, { mode: 'app-plan' });

    expect(document.ExpoImage?.artifact.bases).toEqual([
      `${MONOREPO_BASE}/expo-image/output`,
      `${packageRoot}/prebuilds/output`,
    ]);
    expect(document.ExpoImage?.artifact.sharedSpmDeps.Lottie?.bases).toEqual([
      `${MONOREPO_BASE}/.spm-deps/Lottie`,
      `${packageRoot}/prebuilds/spm-deps/Lottie`,
    ]);
  });

  it('keeps the monorepo directory for shared SPM deps that a custom path replaces for products', async () => {
    const packageRoot = mockInternalPackage(
      'expo-image',
      [{ name: 'ExpoImage', podName: 'ExpoImage', spmPackages: [{ productName: 'Lottie' }] }],
      { inRepo: true }
    );

    const document = await resolvePrebuiltMetadataAsync(optionsLoader, {
      mode: 'app-plan',
      customModulesPath: '/custom',
    });

    expect(document.ExpoImage?.artifact.bases).toEqual([
      '/custom/expo-image/output',
      `${packageRoot}/prebuilds/output`,
    ]);
    expect(document.ExpoImage?.artifact.sharedSpmDeps.Lottie?.bases).toEqual([
      '/custom/.spm-deps/Lottie',
      `${MONOREPO_BASE}/.spm-deps/Lottie`,
      `${packageRoot}/prebuilds/spm-deps/Lottie`,
    ]);
  });

  it('never versions an internal product, whatever prefix the caller supplies', async () => {
    const packageRoot = mockInternalPackage('expo-image', [
      { name: 'ExpoImage', podName: 'ExpoImage' },
    ]);

    const document = await resolvePrebuiltMetadataAsync(optionsLoader, {
      mode: 'app-plan',
      versionPrefix: VERSION_PREFIX,
    });

    expect(document.ExpoImage?.artifact.bases).toEqual([`${packageRoot}/prebuilds/output`]);
    expect(document.ExpoImage?.artifact.debug).not.toHaveProperty('remoteKey');
  });

  it('omits the remote key for internal products, which the store never holds', async () => {
    mockInternalPackage('expo-image', [{ name: 'ExpoImage', podName: 'ExpoImage' }]);

    const document = await resolvePrebuiltMetadataAsync(optionsLoader, { mode: 'app-plan' });

    expect(document.ExpoImage?.artifact.release).not.toHaveProperty('remoteKey');
  });

  it('names artifacts after the product, not the pod', async () => {
    mockInternalPackage('expo-image', [{ name: 'ExpoImageCore', podName: 'ExpoImage' }]);

    const document = await resolvePrebuiltMetadataAsync(optionsLoader, { mode: 'app-plan' });

    expect(document.ExpoImage?.artifact.debug.framework).toBe(
      'debug/xcframeworks/ExpoImageCore.xcframework'
    );
  });

  it('lets an explicit null custom path suppress the environment fallback', async () => {
    const packageRoot = mockInternalPackage('expo-image', [
      { name: 'ExpoImage', podName: 'ExpoImage' },
    ]);
    process.env.EXPO_PRECOMPILED_MODULES_PATH = '/from-env';

    const document = await resolvePrebuiltMetadataAsync(optionsLoader, {
      mode: 'app-plan',
      customModulesPath: null,
    });

    expect(document.ExpoImage?.artifact.bases).toEqual([`${packageRoot}/prebuilds/output`]);
  });

  it('reads the environment fallback when the caller says nothing', async () => {
    const packageRoot = mockInternalPackage('expo-image', [
      { name: 'ExpoImage', podName: 'ExpoImage' },
    ]);
    process.env.EXPO_PRECOMPILED_MODULES_PATH = '/from-env';

    const document = await resolvePrebuiltMetadataAsync(optionsLoader, { mode: 'app-plan' });

    expect(document.ExpoImage?.artifact.bases).toEqual([
      '/from-env/expo-image/output',
      `${packageRoot}/prebuilds/output`,
    ]);
  });
});
