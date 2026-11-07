import { validateNativeGraph, validateVersions } from '../native';

const moduleDescriptor = (packageName: string, packageVersion = '58.0.1') => ({
  packageName,
  packageVersion,
  pods: [],
});

describe('Validating native dependencies', () => {
  it('should accept supported transitive modules from autolinking', () => {
    expect(() =>
      validateNativeGraph(
        { modules: [moduleDescriptor('expo-font')], extraDependencies: [] },
        { dependencies: {} }
      )
    ).not.toThrow();
  });

  it('should reject an unsupported transitive Expo module', () => {
    expect(() =>
      validateNativeGraph({ modules: [moduleDescriptor('expo-camera')] }, { dependencies: {} })
    ).toThrow('expo-camera');
  });

  it('should reject a React Native library with no source recipe', () => {
    expect(() =>
      validateNativeGraph(
        { modules: [] },
        {
          dependencies: {
            'react-native-example': { platforms: { ios: { podspecPath: '/example.podspec' } } },
          },
        }
      )
    ).toThrow('react-native-example');
  });

  it('should honor disabled React Native platforms', () => {
    expect(() =>
      validateNativeGraph(
        { modules: [] },
        { dependencies: { 'react-native-example': { platforms: { ios: null } } } }
      )
    ).not.toThrow();
  });

  it('should reject native build requirements it cannot apply', () => {
    expect(() =>
      validateNativeGraph(
        { modules: [], extraDependencies: [{ name: 'CustomPod' }] },
        { dependencies: {} }
      )
    ).toThrow('extraDependencies');
    expect(() =>
      validateNativeGraph({ modules: [], coreFeatures: ['worklets'] }, { dependencies: {} })
    ).toThrow('worklets');
  });

  it('should reject module recipes from another SDK', () => {
    expect(() =>
      validateNativeGraph(
        { modules: [moduleDescriptor('expo-sqlite', '59.0.0')] },
        { dependencies: {} }
      )
    ).toThrow('SDK 58');
  });

  it('should reject incompatible React Native and Expo versions', () => {
    expect(() =>
      validateVersions({ expo: '58.0.14', react: '19.3.0', 'react-native': '0.88.0' })
    ).not.toThrow();
    expect(() =>
      validateVersions({ expo: '58.0.14', react: '19.3.0', 'react-native': '0.89.0' })
    ).toThrow('0.88.0');
    expect(() =>
      validateVersions({ expo: '59.0.0', react: '19.3.0', 'react-native': '0.88.0' })
    ).toThrow('SDK 58');
  });
});
