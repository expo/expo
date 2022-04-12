import { vol } from 'memfs';

import { getReleasedVersionsAsync } from '../../../../api/getVersions';
import {
  collectMissingPackages,
  getMissingPackagesAsync,
  versionSatisfiesRequiredPackage,
} from '../getMissingPackages';

const asMock = <T extends (...args: any[]) => any>(fn: T): jest.MockedFunction<T> =>
  fn as jest.MockedFunction<T>;

jest.mock('../../../../api/getVersions', () => ({
  getReleasedVersionsAsync: jest.fn(),
}));

describe(versionSatisfiesRequiredPackage, () => {
  beforeEach(() => {
    vol.reset();
  });

  it('version is satisfied', async () => {
    vol.fromJSON(
      {
        'node_modules/react-native-web/package.json': JSON.stringify({ version: '1.0.1' }),
      },
      '/'
    );
    expect(
      versionSatisfiesRequiredPackage('/node_modules/react-native-web/package.json', {
        pkg: 'react-native-web',
        version: '~1.0.0',
      })
    ).toBe(true);
    expect(
      versionSatisfiesRequiredPackage('/node_modules/react-native-web/package.json', {
        pkg: 'react-native-web',
        version: '^1.1.0',
      })
    ).toBe(false);

    // If we don't specify a particular version range.
    expect(
      versionSatisfiesRequiredPackage('/node_modules/react-native-web/package.json', {
        pkg: 'react-native-web',
      })
    ).toBe(true);
  });
});

describe(getMissingPackagesAsync, () => {
  beforeEach(() => {
    vol.reset();
  });

  it('gets missing packages', async () => {
    const projectRoot = '/test-project';
    asMock(getReleasedVersionsAsync).mockResolvedValue({
      '43.0.0': {
        facebookReactNativeVersion: '1.0.0',
        // The `facebookReactVersion` will be added to `relatedPackages` in the form of `react-dom` and `react`.
        facebookReactVersion: '420.0.0',
        relatedPackages: {},
      },
    });

    vol.fromJSON(
      {
        'node_modules/react-native-web/package.json': JSON.stringify({}),
        'package.json': JSON.stringify({
          name: 'my-app',
          dependencies: {
            'react-native-web': '1.0.0',
          },
        }),
      },
      projectRoot
    );

    const results = await getMissingPackagesAsync(projectRoot, {
      sdkVersion: '43.0.0',
      requiredPackages: [
        { file: 'react-native-web/package.json', pkg: 'react-native-web' },
        { file: 'react-dom/package.json', pkg: 'react-dom' },
      ],
    });
    expect(results.missing).toStrictEqual([
      {
        file: 'react-dom/package.json',
        pkg: 'react-dom',
        // This version should come from our mock endpoint matching the SDK Version in the Expo config.
        version: '420.0.0',
      },
    ]);
    expect(results.resolutions).toStrictEqual({
      'react-native-web': '/test-project/node_modules/react-native-web/package.json',
    });
  });
});

describe(collectMissingPackages, () => {
  beforeEach(() => {
    vol.reset();
  });

  it('collects missing packages', async () => {
    const projectRoot = '/test-project';

    vol.fromJSON(
      {
        'node_modules/outdated/package.json': JSON.stringify({ version: '1.0.0' }),
        'node_modules/bacon/package.json': JSON.stringify({ version: '1.0.1' }),
        'node_modules/react-native-web/package.json': JSON.stringify({}),
      },
      projectRoot
    );

    const results = await collectMissingPackages(projectRoot, [
      { file: 'outdated/package.json', pkg: 'outdated', version: '^2.0.0' },
      { file: 'bacon/package.json', pkg: 'bacon', version: '~1.0.0' },
      { file: 'react-native-web/package.json', pkg: 'react-native-web' },
    ]);

    expect(results.missing).toStrictEqual([
      {
        file: 'outdated/package.json',
        pkg: 'outdated',
        version: '^2.0.0',
      },
    ]);
    expect(results.resolutions).toStrictEqual({
      bacon: '/test-project/node_modules/bacon/package.json',
      'react-native-web': '/test-project/node_modules/react-native-web/package.json',
    });
  });
});
