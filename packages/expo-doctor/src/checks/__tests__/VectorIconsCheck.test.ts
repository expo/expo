import { explainAsync } from '../../utils/explainAsync';
import { RootNodePackage } from '../../utils/explainDependencies.types';
import { VectorIconsCheck } from '../VectorIconsCheck';

jest.mock('../../utils/explainAsync');

// required by runAsync
const additionalProjectProps = {
  exp: {
    name: 'name',
    slug: 'slug',
    sdkVersion: '54.0.0',
  },
  pkg: {},
  hasUnusedStaticConfig: false,
  staticConfigPath: null,
  dynamicConfigPath: null,
};

describe('VectorIconsCheck', () => {
  it('returns result with isSuccessful = true if @expo/vector-icons is not installed', async () => {
    jest.mocked(explainAsync).mockResolvedValueOnce(null);

    const check = new VectorIconsCheck();
    const result = await check.runAsync({
      projectRoot: '/path/to/project',
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeTruthy();
    expect(result.issues).toHaveLength(0);
    expect(result.advice).toHaveLength(0);
  });

  it('returns result with isSuccessful = false if @expo/vector-icons is installed', async () => {
    // Mock explainAsync to return our fixture data
    jest.mocked(explainAsync).mockResolvedValueOnce(expoGoProjectWithExpoIconsSimplifiedFixture);

    const check = new VectorIconsCheck();
    const result = await check.runAsync({
      projectRoot: '/path/to/project',
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeFalsy();
    expect(result.issues).toHaveLength(1);
    expect(result.issues).toHaveLength(1);
  });
});

const expoGoProjectWithExpoIconsSimplifiedFixture: RootNodePackage[] = [
  {
    name: '@expo/vector-icons',
    version: '14.1.0',
    location: 'node_modules/@expo/vector-icons',
    isWorkspace: false,
    dependents: [
      {
        type: 'prod',
        name: '@expo/vector-icons',
        spec: '^14.0.0',
        from: {
          name: 'expo',
          version: '54.0.18',
          location: 'node_modules/expo',
          isWorkspace: false,
          dependents: [
            {
              type: 'prod',
              name: 'expo',
              spec: '~54.0.17',
              from: {
                name: 'test-project',
                version: '1.0.0',
                location: '/Users/vojta/_dev/repros/icons-expo-go',
                isWorkspace: false,
                dependents: [],
              },
            },
            {
              type: 'peer',
              name: 'expo',
              spec: '*',
              from: {
                name: 'expo-asset',
                version: '11.1.7',
                location: 'node_modules/expo-asset',
                isWorkspace: false,
                dependents: [
                  {
                    type: 'prod',
                    name: 'expo-asset',
                    spec: '~11.1.7',
                    from: {
                      name: 'expo',
                      version: '54.0.18',
                      location: 'node_modules/expo',
                      isWorkspace: false,
                      dependents: [],
                    },
                  },
                ],
              },
            },
            {
              type: 'peer',
              name: 'expo',
              spec: '*',
              from: {
                name: 'expo-font',
                version: '13.3.2',
                location: 'node_modules/expo-font',
                isWorkspace: false,
                dependents: [
                  {
                    type: 'prod',
                    name: 'expo-font',
                    spec: '~13.3.2',
                    from: {
                      name: 'test-project',
                      version: '1.0.0',
                      location: '/Users/vojta/_dev/repros/icons-expo-go',
                      isWorkspace: false,
                      dependents: [],
                    },
                  },
                  {
                    type: 'prod',
                    name: 'expo-font',
                    spec: '~13.3.2',
                    from: {
                      name: 'expo',
                      version: '54.0.18',
                      location: 'node_modules/expo',
                      isWorkspace: false,
                      dependents: [],
                    },
                  },
                  {
                    type: 'peer',
                    name: 'expo-font',
                    spec: '*',
                    from: {
                      name: '@expo/vector-icons',
                      version: '14.1.0',
                      location: 'node_modules/@expo/vector-icons',
                      isWorkspace: false,
                      dependents: [],
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    ],
    dev: false,
    optional: false,
    devOptional: false,
    peer: false,
    bundled: false,
  },
];
