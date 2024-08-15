import { setReactNativeSettingsPlugin, getReactNativeMinorVersion } from '../Settings';

const mockSettingsGradle = `pluginManagement {
  includeBuild(new File(["node", "--print", "require.resolve('@react-native/gradle-plugin/package.json')"].execute(null, rootDir).text.trim()).getParentFile().toString())
}

plugins { }
`;

const mockPackageJson074 = {
  package: 'react-native',
  version: '0.74.0',
};

const mockPackageJson075 = {
  package: 'react-native',
  version: '0.75.0',
};

const mock = jest.mock('react-native/package.json', () => mockPackageJson074);

describe(getReactNativeMinorVersion, () => {
  it('Tests with RN 0.74', () => {
    expect(getReactNativeMinorVersion('0.74')).toBe(74);
  });
  it('Tests with RN 0.75-rc.7', () => {
    expect(getReactNativeMinorVersion('0.75-rc.7')).toBe(75);
  });
});

describe(setReactNativeSettingsPlugin, () => {
  afterEach(() => {
    mock.resetModules();
  });

  it('Tests with RN 0.74', () => {
    jest.mock('react-native/package.json', () => mockPackageJson074);

    const modified = setReactNativeSettingsPlugin(mockSettingsGradle);

    expect(modified.includes(`plugins { id("com.facebook.react.settings") }`)).toBe(false);
  });
  it('Tests with RN 0.75 or higher', () => {
    jest.mock('react-native/package.json', () => mockPackageJson075);

    const modified = setReactNativeSettingsPlugin(mockSettingsGradle);

    expect(modified.includes(`plugins { id("com.facebook.react.settings") }`)).toBe(true);
  });
});
