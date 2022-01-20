import { vol } from 'memfs';
import path from 'path';

import { mockExpoAPI } from '../../../../__tests__/mock-utils';
import { getMissingPackagesAsync } from '../getMissingPackages';

jest.mock('fs');

describe(getMissingPackagesAsync, () => {
  const projectRoot = '/test-project';

  beforeEach(() => {
    vol.reset();
  });

  it('gets missing packages', async () => {
    mockExpoAPI({
      Versions: {
        getReleasedVersionsAsync: jest.fn(() => ({
          '43.0.0': {
            relatedPackages: {
              'react-dom': '420.0.0',
            },
          },
        })),
      },
    });

    vol.fromJSON({
      [path.join(projectRoot, 'node_modules/react-native-web/package.json')]: JSON.stringify({}),
      [path.join(projectRoot, 'app.json')]: JSON.stringify({
        expo: {
          // Mock out an SDK version to fetch from our mock endpoint.
          sdkVersion: '43.0.0',
        },
      }),
      [path.join(projectRoot, 'package.json')]: JSON.stringify({
        name: 'my-app',
        dependencies: {
          'react-native-web': '1.0.0',
        },
      }),
    });

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
