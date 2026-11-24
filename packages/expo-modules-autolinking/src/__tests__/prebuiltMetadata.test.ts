import { vol } from 'memfs';
import path from 'path';

import { findModulesAsync } from '../autolinking/findModules';
import type { LinkingOptionsLoader } from '../commands/autolinkingOptions';
import { resolvePrebuiltMetadataAsync } from '../prebuiltMetadata';
import { createReactNativeConfigAsync } from '../reactNativeConfig';

jest.mock('../autolinking/findModules', () => ({ findModulesAsync: jest.fn() }));
jest.mock('../reactNativeConfig', () => ({ createReactNativeConfigAsync: jest.fn() }));

const externalConfigsDir = path.join(__dirname, '..', '..', 'external-configs', 'ios');

const optionsLoader = {
  getCommandRoot: () => '/app',
  getAppRoot: async () => '/app',
  getPlatformOptions: async () => ({}),
} as unknown as LinkingOptionsLoader;

const config = (products: object[]) => JSON.stringify({ products });

const findModulesMock = jest.mocked(findModulesAsync) as jest.Mock;
const createReactNativeConfigMock = jest.mocked(createReactNativeConfigAsync) as jest.Mock;

const APP_ROOT = '/app';
const PACKAGE_VERSION = '15.15.4';
const VERSIONS = { reactNativeVersion: '0.87.1', hermesVersion: '250829098.0.17' };
const VERSION_PREFIX = `${PACKAGE_VERSION}/${VERSIONS.reactNativeVersion}/${VERSIONS.hermesVersion}`;

/** findExpoRepoRoot() resolves this from its own location, so a test that wants the
 * monorepo candidates has to plant the marker it probes for. */
const REPO_ROOT = path.resolve(__dirname, '../../../..');
const MONOREPO_BASE = path.join(REPO_ROOT, 'packages/precompile/.build');
const REPO_MARKER = path.join(REPO_ROOT, 'packages/expo-modules-core/spm.config.json');

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
  findModulesMock.mockResolvedValue({ [name]: { path: packageRoot } });
  return packageRoot;
}

/** Accumulates across calls so a test can install more than one external package. */
let externalDependencies: Record<string, unknown> = {};

function mockExternalPackage(
  name: string,
  products: unknown[],
  { iosVersion, manifestVersion }: { iosVersion?: string; manifestVersion?: string } = {}
) {
  const packageRoot = `${APP_ROOT}/node_modules/${name}`;
  vol.fromJSON({
    [`${externalConfigsDir}/${name}/spm.config.json`]: JSON.stringify({ products }),
    [`${packageRoot}/package.json`]: JSON.stringify({ name, version: manifestVersion }),
  });
  externalDependencies[name] = {
    root: packageRoot,
    name,
    ...(iosVersion && { platforms: { ios: { version: iosVersion } } }),
  };
  createReactNativeConfigMock.mockResolvedValue({ dependencies: externalDependencies });
  return packageRoot;
}

beforeEach(() => {
  vol.reset();
  // The resolver falls back to this variable, so an exported one would silently add a
  // candidate base and turn the suite red on a machine set up for the pipeline.
  delete process.env.EXPO_PRECOMPILED_MODULES_PATH;
  externalDependencies = {};
  findModulesMock.mockResolvedValue({});
  createReactNativeConfigMock.mockResolvedValue({ dependencies: {} });
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

  it('describes an external product completely, under its own version prefix', async () => {
    const packageRoot = mockExternalPackage(
      'react-native-svg',
      [{ name: 'RNSVG', podName: 'RNSVG', spmPackages: [{ productName: 'SVGNative' }] }],
      { iosVersion: PACKAGE_VERSION }
    );

    const document = await resolvePrebuiltMetadataAsync(optionsLoader, {
      mode: 'app-plan',
      ...VERSIONS,
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

  it('never versions an internal product, whatever versions the caller supplies', async () => {
    const packageRoot = mockInternalPackage('expo-image', [
      { name: 'ExpoImage', podName: 'ExpoImage' },
    ]);

    const document = await resolvePrebuiltMetadataAsync(optionsLoader, {
      mode: 'app-plan',
      ...VERSIONS,
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

  it('prefixes each external package with its own version', async () => {
    const svgRoot = mockExternalPackage('react-native-svg', [{ podName: 'RNSVG' }], {
      iosVersion: '15.15.4',
    });
    const screensRoot = mockExternalPackage('react-native-screens', [{ podName: 'RNScreens' }], {
      iosVersion: '4.26.0',
    });

    const document = await resolvePrebuiltMetadataAsync(optionsLoader, {
      mode: 'app-plan',
      ...VERSIONS,
    });

    const suffix = `${VERSIONS.reactNativeVersion}/${VERSIONS.hermesVersion}`;
    expect(document.RNSVG?.artifact.bases).toEqual([
      `${svgRoot}/prebuilds/output/15.15.4/${suffix}`,
      `${svgRoot}/prebuilds/output`,
    ]);
    expect(document.RNSVG?.artifact.debug.remoteKey).toBe(
      `react-native-svg/output/15.15.4/${suffix}/debug/xcframeworks/RNSVG.tar.gz`
    );
    expect(document.RNScreens?.artifact.bases).toEqual([
      `${screensRoot}/prebuilds/output/4.26.0/${suffix}`,
      `${screensRoot}/prebuilds/output`,
    ]);
    expect(document.RNScreens?.artifact.release.remoteKey).toBe(
      `react-native-screens/output/4.26.0/${suffix}/release/xcframeworks/RNScreens.tar.gz`
    );
  });

  it('falls back to the package manifest when the React Native config carries no ios version', async () => {
    const packageRoot = mockExternalPackage('react-native-svg', [{ podName: 'RNSVG' }], {
      manifestVersion: '15.15.4',
    });

    const document = await resolvePrebuiltMetadataAsync(optionsLoader, {
      mode: 'app-plan',
      ...VERSIONS,
    });

    expect(document.RNSVG?.artifact.bases).toEqual([
      `${packageRoot}/prebuilds/output/${VERSION_PREFIX}`,
      `${packageRoot}/prebuilds/output`,
    ]);
  });

  it('prefers the React Native config version over the package manifest', async () => {
    mockExternalPackage('react-native-svg', [{ podName: 'RNSVG' }], {
      iosVersion: '15.15.4',
      manifestVersion: '9.9.9',
    });

    const document = await resolvePrebuiltMetadataAsync(optionsLoader, {
      mode: 'app-plan',
      ...VERSIONS,
    });

    expect(document.RNSVG?.artifact.debug.remoteKey).toBe(
      `react-native-svg/output/${VERSION_PREFIX}/debug/xcframeworks/RNSVG.tar.gz`
    );
  });

  it.each([
    ['the package version', {}, VERSIONS],
    [
      'the React Native version',
      { iosVersion: PACKAGE_VERSION },
      { ...VERSIONS, reactNativeVersion: undefined },
    ],
    [
      'the Hermes version',
      { iosVersion: PACKAGE_VERSION },
      { ...VERSIONS, hermesVersion: undefined },
    ],
  ])('leaves an external product unversioned when %s is missing', async (_, pkg, versions) => {
    const packageRoot = mockExternalPackage('react-native-svg', [{ podName: 'RNSVG' }], pkg);

    const document = await resolvePrebuiltMetadataAsync(optionsLoader, {
      mode: 'app-plan',
      ...versions,
    });

    expect(document.RNSVG?.artifact.bases).toEqual([`${packageRoot}/prebuilds/output`]);
    expect(document.RNSVG?.artifact.debug.remoteKey).toBe(
      'react-native-svg/output/debug/xcframeworks/RNSVG.tar.gz'
    );
    expect(document.RNSVG?.artifact.release.remoteKey).toBe(
      'react-native-svg/output/release/xcframeworks/RNSVG.tar.gz'
    );
  });
});

describe('resolvePrebuiltMetadataAsync', () => {
  beforeEach(() => {
    vol.reset();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.mocked(findModulesAsync).mockResolvedValue({
      'expo-modules-core': {
        name: 'expo-modules-core',
        path: '/app/node_modules/expo-modules-core',
        version: '58.0.0',
      },
    });
    jest.mocked(createReactNativeConfigAsync).mockResolvedValue({
      root: '/app',
      reactNativePath: '/app/node_modules/react-native',
      project: {},
      dependencies: {
        'react-native-worklets': {
          root: '/app/node_modules/react-native-worklets',
          name: 'react-native-worklets',
          platforms: {},
        },
      },
    });
    vol.fromJSON({
      '/app/node_modules/expo-modules-core/package.json': '{ "name": "expo-modules-core" }',
      '/app/node_modules/expo-modules-core/spm.config.json': config([
        {
          name: 'ExpoModulesCore',
          podName: 'ExpoModulesCore',
          platforms: ['iOS("16.4")', 'macOS("13.0")'],
        },
        {
          name: 'ExpoModulesWorkletsAdapter',
          podName: 'ExpoModulesWorkletsAdapter',
          sourceOnly: true,
          platforms: ['iOS(.v15)'],
        },
        { name: 'ExpoFloorless', podName: 'ExpoFloorless' },
        {
          name: 'ExpoSpmCoordinates',
          podName: 'ExpoSpmCoordinates',
          spmPackages: [
            {
              url: 'https://github.com/SDWebImage/SDWebImage.git',
              productName: 'SDWebImage',
              version: { exact: '5.21.6' },
            },
            {
              url: 'https://github.com/SDWebImage/libavif-Xcode.git',
              productName: 'libavif',
              version: { from: '1.0.0' },
            },
            {
              url: 'https://github.com/expo/spm-branch.git',
              productName: 'Branchy',
              version: { branch: 'main' },
            },
            {
              url: 'https://github.com/expo/spm-revision.git',
              productName: 'Pinned',
              version: { revision: 'c0ffee' },
            },
            {
              url: 'https://github.com/expo/spm-floating.git',
              productName: 'Floating',
            },
            {
              url: 'https://github.com/expo/spm-numeric.git',
              productName: 'Numeric',
              version: { exact: 5 },
            },
            {
              url: 'https://github.com/expo/spm-ambiguous.git',
              productName: 'Ambiguous',
              version: { exact: '1.0.0', branch: 'main' },
            },
            {
              url: 'https://github.com/expo/spm-renamed.git',
              productName: 'Renamed',
              packageName: 'spm-renamed',
              version: { exact: '2.0.0' },
            },
            {
              url: '',
              productName: 'Urlless',
              version: { exact: '3.0.0' },
            },
            {
              url: 'https://github.com/expo/spm-anonymous.git',
              productName: '',
              version: { exact: '4.0.0' },
            },
          ],
        },
        {
          name: 'ExpoWithDeps',
          podName: 'ExpoWithDeps',
          spmPackages: [
            { productName: 'SDWebImage' },
            { packageName: 'nameless-package' },
            { productName: 'libavif' },
          ],
        },
        { name: 'ExpoMacOnly', podName: 'ExpoMacOnly', platforms: ['macOS("13.0")'] },
        { name: 'ExpoOddFloor', podName: 'ExpoOddFloor', platforms: ['iOS(SomeConstant)'] },
        {
          name: 'ExpoTwoFloors',
          podName: 'ExpoTwoFloors',
          platforms: ['iOS(.v16)', 'iOS("16.4")'],
        },
        {
          name: 'ExpoGatedByProperty',
          podName: 'ExpoGatedByProperty',
          autolinkWhen: {
            podfileProperty: 'expo.camera.barcode-scanner-enabled',
            disabledValue: 'false',
          },
        },
        {
          name: 'ExpoGatedByPod',
          podName: 'ExpoGatedByPod',
          autolinkWhen: { podName: 'ExpoCamera', reason: 'companion' },
        },
        {
          name: 'ExpoConditionString',
          podName: 'ExpoConditionString',
          autolinkWhen: 'ExpoCamera',
        },
        {
          name: 'ExpoConditionArray',
          podName: 'ExpoConditionArray',
          autolinkWhen: [{ podName: 'ExpoCamera' }],
        },
        { name: 'ExpoConditionEmpty', podName: 'ExpoConditionEmpty', autolinkWhen: {} },
        {
          name: 'ExpoConditionValueOnly',
          podName: 'ExpoConditionValueOnly',
          autolinkWhen: { disabledValue: 'false' },
        },
        {
          name: 'ExpoConditionNumericSubject',
          podName: 'ExpoConditionNumericSubject',
          autolinkWhen: { podName: 42, disabledValue: 'false' },
        },
        {
          name: 'ExpoConditionBooleanValue',
          podName: 'ExpoConditionBooleanValue',
          autolinkWhen: { podfileProperty: 'expo.flag', disabledValue: false },
        },
        {
          name: 'ExpoConditionNumericValue',
          podName: 'ExpoConditionNumericValue',
          autolinkWhen: { podfileProperty: 'expo.count', disabledValue: 0 },
        },
        {
          name: 'ExpoConditionNullValue',
          podName: 'ExpoConditionNullValue',
          autolinkWhen: { podfileProperty: 'expo.unset', disabledValue: null },
        },
        {
          name: 'ExpoConditionObjectValue',
          podName: 'ExpoConditionObjectValue',
          autolinkWhen: { podfileProperty: 'expo.deep', disabledValue: { nested: true } },
        },
        {
          name: 'ExpoConditionArrayValue',
          podName: 'ExpoConditionArrayValue',
          autolinkWhen: { podfileProperty: 'expo.list', disabledValue: ['off'] },
        },
        {
          name: 'ExpoConditionNullCondition',
          podName: 'ExpoConditionNullCondition',
          autolinkWhen: null,
        },
      ]),
      [path.join(externalConfigsDir, 'react-native-worklets', 'spm.config.json')]: config([
        {
          name: 'RNWorklets',
          podName: 'RNWorklets',
          sourceOnly: true,
          platforms: ['iOS("16.4")'],
          spmPackages: [
            {
              url: 'https://github.com/expo/rn-worklets-dep.git',
              productName: 'RNWorkletsDep',
              version: { exact: '0.6.0' },
            },
            { url: 'https://github.com/expo/rn-worklets-unpinned.git', productName: 'Unpinned' },
          ],
        },
        {
          name: 'RNWorkletsCompanion',
          podName: 'RNWorkletsCompanion',
          autolinkWhen: { npmPackage: 'react-native-reanimated' },
        },
      ]),
    });
  });

  // A source-only product never becomes an artifact — consumers need that from
  // the document, because the config it comes from is not theirs to read.
  it('marks a source-only internal product', async () => {
    const document = await resolvePrebuiltMetadataAsync(optionsLoader, { mode: 'app-plan' });

    expect(document.ExpoModulesWorkletsAdapter).toMatchObject({
      type: 'internal',
      productName: 'ExpoModulesWorkletsAdapter',
      sourceOnly: true,
    });
  });

  it('marks a source-only external product', async () => {
    const document = await resolvePrebuiltMetadataAsync(optionsLoader, { mode: 'app-plan' });

    expect(document.RNWorklets).toMatchObject({
      type: 'external',
      productName: 'RNWorklets',
      sourceOnly: true,
    });
  });

  it('leaves the flag off a product that does build an artifact', async () => {
    const document = await resolvePrebuiltMetadataAsync(optionsLoader, { mode: 'app-plan' });

    expect(document.ExpoModulesCore).toMatchObject({ productName: 'ExpoModulesCore' });
    expect(document.ExpoModulesCore).not.toHaveProperty('sourceOnly');
  });

  // The iOS floor belongs to the product, and consumers outside CocoaPods have
  // nowhere else to read it from.
  it('publishes the iOS floor a product declares as a version literal', async () => {
    const document = await resolvePrebuiltMetadataAsync(optionsLoader, { mode: 'app-plan' });

    expect(document.ExpoModulesCore).toMatchObject({ iosDeploymentTarget: '16.4' });
  });

  it('publishes a floor declared as a PackageDescription case as the version it means', async () => {
    const document = await resolvePrebuiltMetadataAsync(optionsLoader, { mode: 'app-plan' });

    expect(document.ExpoModulesWorkletsAdapter).toMatchObject({ iosDeploymentTarget: '15.0' });
  });

  it('publishes the floor of an external product too', async () => {
    const document = await resolvePrebuiltMetadataAsync(optionsLoader, { mode: 'app-plan' });

    expect(document.RNWorklets).toMatchObject({ type: 'external', iosDeploymentTarget: '16.4' });
  });

  // The schema admits three iOS literals, so a product may legally declare two.
  // The first wins, the way a Package.swift would take the first `.iOS` it sees.
  it('takes the first iOS floor where a product declares several', async () => {
    const document = await resolvePrebuiltMetadataAsync(optionsLoader, { mode: 'app-plan' });

    expect(document.ExpoTwoFloors).toMatchObject({ iosDeploymentTarget: '16.0' });
  });

  // No floor is a floor the consumer picks itself, not a floor of zero.
  it('omits the floor where the product declares none this can read', async () => {
    const document = await resolvePrebuiltMetadataAsync(optionsLoader, { mode: 'app-plan' });

    expect(document.ExpoFloorless).not.toHaveProperty('iosDeploymentTarget');
    expect(document.ExpoMacOnly).not.toHaveProperty('iosDeploymentTarget');
    expect(document.ExpoOddFloor).not.toHaveProperty('iosDeploymentTarget');
  });

  // A consumer linking a precompiled product's SPM packages as the XCFrameworks
  // shipped beside it reads their product names from spmPackages. A second list
  // of names could only disagree with it.
  it.each([
    ['an internal', 'ExpoSpmCoordinates', ['SDWebImage', 'libavif', 'Branchy', 'Pinned']],
    ['an external', 'RNWorklets', ['RNWorkletsDep']],
  ])(
    'publishes the SPM packages of %s product as spmPackages alone',
    async (_, podName, productNames) => {
      const document = await resolvePrebuiltMetadataAsync(optionsLoader, { mode: 'app-plan' });

      expect(document[podName]?.spmPackages?.map((pkg) => pkg.productName)).toEqual(productNames);
      expect(document[podName]).not.toHaveProperty('spmDependencies');
    }
  );

  // A source-emitted module declares its SwiftPM dependencies in the generated
  // manifest, which needs the whole coordinate — a product name alone resolves
  // to no package.
  it('publishes the full SPM coordinates of an internal product', async () => {
    const document = await resolvePrebuiltMetadataAsync(optionsLoader, { mode: 'app-plan' });

    expect(document.ExpoSpmCoordinates?.spmPackages).toEqual([
      {
        url: 'https://github.com/SDWebImage/SDWebImage.git',
        productName: 'SDWebImage',
        version: { exact: '5.21.6' },
      },
      {
        url: 'https://github.com/SDWebImage/libavif-Xcode.git',
        productName: 'libavif',
        version: { from: '1.0.0' },
      },
      {
        url: 'https://github.com/expo/spm-branch.git',
        productName: 'Branchy',
        version: { branch: 'main' },
      },
      {
        url: 'https://github.com/expo/spm-revision.git',
        productName: 'Pinned',
        version: { revision: 'c0ffee' },
      },
    ]);
  });

  it('publishes the full SPM coordinates of an external product too', async () => {
    const document = await resolvePrebuiltMetadataAsync(optionsLoader, { mode: 'app-plan' });

    expect(document.RNWorklets?.spmPackages).toEqual([
      {
        url: 'https://github.com/expo/rn-worklets-dep.git',
        productName: 'RNWorkletsDep',
        version: { exact: '0.6.0' },
      },
    ]);
  });

  // A coordinate that cannot be rendered into a manifest is worse than none: it
  // would emit a `.package` declaration SwiftPM refuses to resolve.
  it('skips entries that carry no renderable coordinate', async () => {
    const document = await resolvePrebuiltMetadataAsync(optionsLoader, { mode: 'app-plan' });

    const products = document.ExpoSpmCoordinates?.spmPackages?.map((pkg) => pkg.productName);
    expect(products).not.toContain('Floating');
    expect(products).not.toContain('Numeric');
    expect(products).not.toContain('Ambiguous');
    expect(document.ExpoWithDeps).not.toHaveProperty('spmPackages');
  });

  // An empty string is a string, so the coordinate reads as present and renders
  // `.package(url: "")` or `package: ""` — a declaration SwiftPM cannot resolve,
  // which is the whole class this skip exists to keep out of a manifest.
  it('skips entries whose url or product name is empty', async () => {
    const document = await resolvePrebuiltMetadataAsync(optionsLoader, { mode: 'app-plan' });

    const products = document.ExpoSpmCoordinates?.spmPackages?.map((pkg) => pkg.productName);
    expect(products).not.toContain('Urlless');
    expect(products).not.toContain('');
  });

  // SwiftPM derives a package's identity from its URL, and that is the only
  // identity a generated manifest can render. An entry naming its own is a
  // coordinate this cannot honour, so it is skipped and the pod behind it is
  // reported as having no SwiftPM counterpart.
  it('skips an entry that names its own package identity', async () => {
    const document = await resolvePrebuiltMetadataAsync(optionsLoader, { mode: 'app-plan' });

    const products = document.ExpoSpmCoordinates?.spmPackages?.map((pkg) => pkg.productName);
    expect(products).not.toContain('Renamed');
  });

  // CocoaPods links every entry that names a product, so an entry skipped here
  // without a word links under CocoaPods and silently not under SwiftPM.
  it.each([
    ['ExpoSpmCoordinates', '"Floating"', 'no version requirement'],
    ['ExpoSpmCoordinates', '"Numeric"', 'no version requirement'],
    ['ExpoSpmCoordinates', '"Ambiguous"', 'no version requirement'],
    ['ExpoSpmCoordinates', '"Renamed"', 'packageName'],
    ['ExpoSpmCoordinates', '"Urlless"', 'no url'],
    ['ExpoSpmCoordinates', 'spmPackages[9]', 'no productName'],
    ['ExpoWithDeps', '"SDWebImage"', 'no url'],
    ['ExpoWithDeps', 'spmPackages[1]', 'no productName'],
    ['RNWorklets', '"Unpinned"', 'no version requirement'],
  ])('warns once, naming %s and %s, about an SPM package it skips', async (podName, pkg, why) => {
    await resolvePrebuiltMetadataAsync(optionsLoader, { mode: 'app-plan' });

    const warnings = warningsAbout(podName).filter((message) => message.includes(pkg));
    expect(warnings).toEqual([expect.stringContaining(why)]);
    expect(warnings[0]).toMatch(/^\[prebuilt-metadata\] /);
    expect(warnings[0]).toContain('spm.config.json');
  });

  it('warns about the entries it skips and no others', async () => {
    await resolvePrebuiltMetadataAsync(optionsLoader, { mode: 'app-plan' });

    expect(warningsAbout('ExpoSpmCoordinates')).toHaveLength(6);
    expect(warningsAbout('ExpoWithDeps')).toHaveLength(3);
    expect(warningsAbout('RNWorklets')).toHaveLength(1);
  });

  it('omits the coordinates of a product that declares none', async () => {
    const document = await resolvePrebuiltMetadataAsync(optionsLoader, { mode: 'app-plan' });

    expect(document.ExpoModulesCore).not.toHaveProperty('spmPackages');
  });

  // The gate that decides whether a companion product is linked at all lives in
  // the config, which no consumer outside CocoaPods can read.
  it('publishes the autolinking condition of an internal product', async () => {
    const document = await resolvePrebuiltMetadataAsync(optionsLoader, { mode: 'app-plan' });

    expect(document.ExpoGatedByProperty?.autolinkWhen).toEqual({
      podfileProperty: 'expo.camera.barcode-scanner-enabled',
      disabledValue: 'false',
    });
  });

  it('publishes the autolinking condition of an external product too', async () => {
    const document = await resolvePrebuiltMetadataAsync(optionsLoader, { mode: 'app-plan' });

    expect(document.RNWorkletsCompanion).toMatchObject({
      type: 'external',
      autolinkWhen: { npmPackage: 'react-native-reanimated' },
    });
  });

  // A key this cannot honour would read as a condition the consumer must
  // evaluate, so only the four the gate understands survive.
  it('keeps only the keys the condition is made of', async () => {
    const document = await resolvePrebuiltMetadataAsync(optionsLoader, { mode: 'app-plan' });

    expect(document.ExpoGatedByPod?.autolinkWhen).toEqual({ podName: 'ExpoCamera' });
  });

  it('drops a subject that is not a string, keeping the condition', async () => {
    const document = await resolvePrebuiltMetadataAsync(optionsLoader, { mode: 'app-plan' });

    expect(document.ExpoConditionNumericSubject?.autolinkWhen).toEqual({ disabledValue: 'false' });
  });

  // disabledValue is compared against a Podfile property, never rendered, so
  // narrowing its type to a string would answer a comparison the config did not
  // ask for — and differently from CocoaPods.
  it('keeps a disabledValue of any scalar type verbatim', async () => {
    const document = await resolvePrebuiltMetadataAsync(optionsLoader, { mode: 'app-plan' });

    expect(document.ExpoConditionBooleanValue?.autolinkWhen).toEqual({
      podfileProperty: 'expo.flag',
      disabledValue: false,
    });
    expect(document.ExpoConditionNumericValue?.autolinkWhen).toEqual({
      podfileProperty: 'expo.count',
      disabledValue: 0,
    });
    expect(document.ExpoConditionNullValue?.autolinkWhen).toEqual({
      podfileProperty: 'expo.unset',
      disabledValue: null,
    });
  });

  // Dropping a container would change the answer rather than withhold it: Ruby
  // compares an unset property against it as not-equal and links the product,
  // where a gate left with only a podfileProperty is never met.
  it('keeps a container disabledValue verbatim', async () => {
    const document = await resolvePrebuiltMetadataAsync(optionsLoader, { mode: 'app-plan' });

    expect(document.ExpoConditionObjectValue?.autolinkWhen).toEqual({
      podfileProperty: 'expo.deep',
      disabledValue: { nested: true },
    });
    expect(document.ExpoConditionArrayValue?.autolinkWhen).toEqual({
      podfileProperty: 'expo.list',
      disabledValue: ['off'],
    });
  });

  // An unreadable gate is a gate that is never met, not an absent one: dropping
  // the key would link a product under SwiftPM that CocoaPods leaves out.
  it('keeps the key for a declared condition nothing survives', async () => {
    const document = await resolvePrebuiltMetadataAsync(optionsLoader, { mode: 'app-plan' });

    expect(document.ExpoConditionString?.autolinkWhen).toEqual({});
    expect(document.ExpoConditionArray?.autolinkWhen).toEqual({});
    expect(document.ExpoConditionEmpty?.autolinkWhen).toEqual({});
    expect(document.ExpoConditionValueOnly?.autolinkWhen).toEqual({ disabledValue: 'false' });
  });

  // An unconditional product is linked always, which is not the same as a
  // condition a consumer has to evaluate and find unmet.
  it('omits the condition where the product declares none', async () => {
    const document = await resolvePrebuiltMetadataAsync(optionsLoader, { mode: 'app-plan' });

    expect(document.ExpoModulesCore).not.toHaveProperty('autolinkWhen');
    expect(document.RNWorklets).not.toHaveProperty('autolinkWhen');
    expect(document.ExpoConditionNullCondition).not.toHaveProperty('autolinkWhen');
  });

  // A typo in a gate is otherwise invisible: it withholds a native module from
  // the build and nothing anywhere says so.
  it('warns once, naming the pod and the config, about a condition it cannot read whole', async () => {
    await resolvePrebuiltMetadataAsync(optionsLoader, { mode: 'app-plan' });

    expect(warningsAbout('ExpoGatedByPod')).toEqual([
      expect.stringContaining('/app/node_modules/expo-modules-core/spm.config.json'),
    ]);
    expect(warningsAbout('ExpoGatedByPod')[0]).toContain('reason');
    expect(warningsAbout('ExpoConditionString')).toHaveLength(1);
    expect(warningsAbout('ExpoConditionValueOnly')).toHaveLength(1);
  });

  it('stays silent about a condition it reads whole', async () => {
    await resolvePrebuiltMetadataAsync(optionsLoader, { mode: 'app-plan' });

    expect(warningsAbout('ExpoGatedByProperty')).toEqual([]);
    expect(warningsAbout('RNWorkletsCompanion')).toEqual([]);
    expect(warningsAbout('ExpoConditionNullCondition')).toEqual([]);
    expect(warningsAbout('ExpoConditionObjectValue')).toEqual([]);
  });
});

function warningsAbout(podName: string): string[] {
  return jest
    .mocked(console.warn)
    .mock.calls.map(([message]) => String(message))
    .filter((message) => message.includes(podName));
}
