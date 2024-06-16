import { vol } from 'memfs';

import {
  collectMissingPackages,
  getMissingPackagesAsync,
  versionSatisfiesRequiredPackage,
} from '../getMissingPackages';
import { getCombinedKnownVersionsAsync } from '../getVersionedPackages';

jest.mock('../getVersionedPackages', () => ({
  getCombinedKnownVersionsAsync: jest.fn(() => []),
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
    jest.mocked(getCombinedKnownVersionsAsync).mockResolvedValue({
      'react-native': '1.0.0',
      'react-dom': '420.0.0',
      react: '420.0.0',
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
