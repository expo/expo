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

describe('resolvePrebuiltMetadataAsync', () => {
  beforeEach(() => {
    vol.reset();
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
          ],
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

  // A precompiled product's SPM package dependencies ship as separate
  // xcframeworks. Consumers cannot read the config that names them, so the
  // document has to carry them. Mirrors Ruby's `spm_dependency_frameworks`.
  it('publishes the SPM dependency products of an internal product', async () => {
    const document = await resolvePrebuiltMetadataAsync(optionsLoader, { mode: 'app-plan' });

    expect(document.ExpoWithDeps).toMatchObject({ spmDependencies: ['SDWebImage', 'libavif'] });
  });

  it('publishes the SPM dependency products of an external product too', async () => {
    const document = await resolvePrebuiltMetadataAsync(optionsLoader, { mode: 'app-plan' });

    expect(document.RNWorklets).toMatchObject({ spmDependencies: ['RNWorkletsDep'] });
  });

  it('omits the dependencies of a product that declares none', async () => {
    const document = await resolvePrebuiltMetadataAsync(optionsLoader, { mode: 'app-plan' });

    expect(document.ExpoModulesCore).not.toHaveProperty('spmDependencies');
  });
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

  // The framework-side field keeps its own meaning: it names the XCFrameworks
  // shipped beside a precompiled product, whatever the coordinates say.
  it('leaves spmDependencies listing the products of entries it skips', async () => {
    const document = await resolvePrebuiltMetadataAsync(optionsLoader, { mode: 'app-plan' });

    expect(document.ExpoWithDeps).toMatchObject({ spmDependencies: ['SDWebImage', 'libavif'] });
    expect(document.ExpoWithDeps).not.toHaveProperty('spmPackages');
    expect(document.ExpoSpmCoordinates).toMatchObject({
      spmDependencies: [
        'SDWebImage',
        'libavif',
        'Branchy',
        'Pinned',
        'Floating',
        'Numeric',
        'Ambiguous',
        'Renamed',
        'Urlless',
        '',
      ],
    });
  });

  it('omits the coordinates of a product that declares none', async () => {
    const document = await resolvePrebuiltMetadataAsync(optionsLoader, { mode: 'app-plan' });

    expect(document.ExpoModulesCore).not.toHaveProperty('spmPackages');
  });
});
