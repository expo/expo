import { vol } from 'memfs';

import { getVersionedNativeModuleNamesAsync } from '../../utils/versionedNativeModules';
import { PeerDependencyChecks } from '../PeerDependencyChecks';

jest.mock('fs');
jest.mock('../../utils/versionedNativeModules', () => ({
  getVersionedNativeModuleNamesAsync: jest.fn(),
}));

const projectRoot = '/tmp/project';

const additionalProjectProps = {
  exp: {
    name: 'name',
    slug: 'slug',
    sdkVersion: '50.0.0',
  },
  projectRoot,
  hasUnusedStaticConfig: false,
  staticConfigPath: null,
  dynamicConfigPath: null,
};

describe('PeerDependencyChecks', () => {
  beforeEach(() => {
    vol.reset();
    jest.mocked(getVersionedNativeModuleNamesAsync).mockResolvedValue([]);
  });

  it('returns successful result when no dependencies exist', async () => {
    const check = new PeerDependencyChecks();
    const result = await check.runAsync({
      pkg: { name: 'test-project', version: '1.0.0' },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeTruthy();
    expect(result.issues).toHaveLength(0);
  });

  it('returns successful result when dependencies have no peer dependencies', async () => {
    vol.fromJSON({
      [`${projectRoot}/node_modules/some-package/package.json`]: JSON.stringify({
        name: 'some-package',
        version: '1.0.0',
      }),
    });

    const check = new PeerDependencyChecks();
    const result = await check.runAsync({
      pkg: {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          'some-package': '^1.0.0',
        },
      },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeTruthy();
    expect(result.issues).toHaveLength(0);
  });

  it('detects missing required peer dependencies', async () => {
    jest
      .mocked(getVersionedNativeModuleNamesAsync)
      .mockResolvedValue(['react-native-safe-area-context']);

    vol.fromJSON({
      [`${projectRoot}/node_modules/expo-router/package.json`]: JSON.stringify({
        name: 'expo-router',
        version: '5.1.4',
        peerDependencies: {
          'react-native-safe-area-context': '*',
        },
      }),
    });

    const check = new PeerDependencyChecks();
    const result = await check.runAsync({
      pkg: {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          'expo-router': '^5.1.4',
        },
      },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeFalsy();
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]).toContain(
      'Missing peer dependency: react-native-safe-area-context\nRequired by: expo-router'
    );
    expect(result.advice).toHaveLength(2);
    expect(result.advice[0]).toContain(
      'Install missing required peer dependency with "npx expo install react-native-safe-area-context"'
    );
    expect(result.advice[1]).toContain(
      'Your app may crash outside of Expo Go without this dependency. Native module peer dependencies must be installed directly.'
    );
  });

  it('detects multiple missing required peer dependencies', async () => {
    jest
      .mocked(getVersionedNativeModuleNamesAsync)
      .mockResolvedValue(['react-native-safe-area-context', 'react-native-screens']);

    vol.fromJSON({
      [`${projectRoot}/node_modules/expo-router/package.json`]: JSON.stringify({
        name: 'expo-router',
        version: '5.1.4',
        peerDependencies: {
          'react-native-safe-area-context': '*',
          'react-native-screens': '*',
        },
      }),
    });

    const check = new PeerDependencyChecks();
    const result = await check.runAsync({
      pkg: {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          'expo-router': '^5.1.4',
        },
      },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeFalsy();
    expect(result.issues).toHaveLength(2);
    expect(result.issues[0]).toContain(
      'Missing peer dependency: react-native-safe-area-context\nRequired by: expo-router'
    );
    expect(result.issues[1]).toContain(
      'Missing peer dependency: react-native-screens\nRequired by: expo-router'
    );
    expect(result.advice).toHaveLength(2);
    expect(result.advice[0]).toContain(
      'Install missing required peer dependencies with "npx expo install react-native-safe-area-context react-native-screens"'
    );
    expect(result.advice[1]).toContain(
      'Your app may crash outside of Expo Go without these dependencies. Native module peer dependencies must be installed directly.'
    );
  });

  it('groups missing peer dependencies', async () => {
    jest
      .mocked(getVersionedNativeModuleNamesAsync)
      .mockResolvedValue(['react-native-safe-area-context']);

    vol.fromJSON({
      [`${projectRoot}/node_modules/expo-router/package.json`]: JSON.stringify({
        name: 'expo-router',
        version: '5.1.4',
        peerDependencies: {
          'react-native-safe-area-context': '*',
        },
      }),

      [`${projectRoot}/node_modules/@react-navigation/bottom-tabs/package.json`]: JSON.stringify({
        name: '@react-navigation/bottom-tabs',
        version: '7.0.0',
        peerDependencies: {
          'react-native-safe-area-context': '>= 4.0.0',
        },
      }),
    });

    const check = new PeerDependencyChecks();
    const result = await check.runAsync({
      pkg: {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          'expo-router': '^5.1.4',
          '@react-navigation/bottom-tabs': '^7.0.0',
        },
      },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeFalsy();
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]).toContain(
      'Missing peer dependency: react-native-safe-area-context\nRequired by: expo-router, @react-navigation/bottom-tabs'
    );
    expect(result.advice).toHaveLength(2);
    expect(result.advice[0]).toContain(
      'Install missing required peer dependency with "npx expo install react-native-safe-area-context"'
    );
    expect(result.advice[1]).toContain(
      'Your app may crash outside of Expo Go without this dependency. Native module peer dependencies must be installed directly.'
    );
  });

  it('ignores optional peer dependencies', async () => {
    vol.fromJSON({
      [`${projectRoot}/node_modules/some-ui-lib/package.json`]: JSON.stringify({
        name: 'some-ui-lib',
        version: '1.0.0',
        peerDependencies: {
          'styled-components': '^5.0.0',
        },
        peerDependenciesMeta: {
          'styled-components': {
            optional: true,
          },
        },
      }),
    });

    const check = new PeerDependencyChecks();
    const result = await check.runAsync({
      pkg: {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          'some-ui-lib': '^1.0.0',
        },
      },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeTruthy();
    expect(result.issues).toHaveLength(0);
  });

  it('handles missing package.json gracefully', async () => {
    const check = new PeerDependencyChecks();
    const result = await check.runAsync({
      pkg: {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          'non-existent-package': '^1.0.0',
        },
      },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeTruthy();
    expect(result.issues).toHaveLength(0);
  });

  it('only reports bundled native modules as missing peer dependencies', async () => {
    jest
      .mocked(getVersionedNativeModuleNamesAsync)
      .mockResolvedValue(['react-native-safe-area-context', 'react-native-screens']);

    vol.fromJSON({
      [`${projectRoot}/node_modules/expo-router/package.json`]: JSON.stringify({
        name: 'expo-router',
        version: '5.1.4',
        peerDependencies: {
          'react-native-safe-area-context': '*',
          'non-bundled-package': '*',
        },
      }),
    });

    const check = new PeerDependencyChecks();
    const result = await check.runAsync({
      pkg: {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          'expo-router': '^5.1.4',
        },
      },
      exp: {
        name: 'name',
        slug: 'slug',
        sdkVersion: '50.0.0',
      },
      projectRoot,
      hasUnusedStaticConfig: false,
      staticConfigPath: null,
      dynamicConfigPath: null,
    });

    expect(result.isSuccessful).toBeFalsy();
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]).toContain(
      'Missing peer dependency: react-native-safe-area-context\nRequired by: expo-router'
    );
    expect(result.issues[0]).not.toContain('non-bundled-package');
    expect(jest.mocked(getVersionedNativeModuleNamesAsync)).toHaveBeenCalledWith(
      projectRoot,
      '50.0.0'
    );
  });
});
