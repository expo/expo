import { vol } from 'memfs';

import { getReleasedVersionsAsync } from '../../../../api/getVersions';
import { getMissingPackagesAsync } from '../getMissingPackages';

const asMock = <T extends (...args: any[]) => any>(fn: T): jest.MockedFunction<T> =>
  fn as jest.MockedFunction<T>;

jest.mock('../../../../api/getVersions', () => ({
  getReleasedVersionsAsync: jest.fn(),
}));

describe(getMissingPackagesAsync, () => {
  const projectRoot = '/test-project';

  beforeEach(() => {
    vol.reset();
  });

  it('gets missing packages', async () => {
    asMock(getReleasedVersionsAsync).mockResolvedValue({
      '43.0.0': {
        relatedPackages: {
          'react-dom': '420.0.0',
        },
      },
    });

    vol.fromJSON(
      {
        'node_modules/react-native-web/package.json': JSON.stringify({}),
        'app.json': JSON.stringify({
          expo: {
            // Mock out an SDK version to fetch from our mock endpoint.
            sdkVersion: '43.0.0',
          },
        }),
        'package.json': JSON.stringify({
          name: 'my-app',
          dependencies: {
            'react-native-web': '1.0.0',
          },
        }),
      },
      projectRoot
    );

    expect(
      await getMissingPackagesAsync(projectRoot, {
        requiredPackages: [
          { file: 'react-native-web/package.json', pkg: 'react-native-web' },
          { file: 'react-dom/package.json', pkg: 'react-dom' },
        ],
      })
    ).toStrictEqual({
      missing: [
        {
          file: 'react-dom/package.json',
          pkg: 'react-dom',
          // This version should come from our mock endpoint matching the SDK Version in the Expo config.
          version: '420.0.0',
        },
      ],
      resolutions: {
        'react-native-web': '/test-project/node_modules/react-native-web/package.json',
      },
    });
  });
});
