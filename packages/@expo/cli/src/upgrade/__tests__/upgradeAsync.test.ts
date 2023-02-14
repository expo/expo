import { getPackagesToModify } from '../upgradeAsync';

describe(getPackagesToModify, () => {
  it(`should remove deprecated packages`, () => {
    const pkgJson = {
      dependencies: {
        'react-native-unimodules': '0.14.0',
      },
      devDependencies: {
        '@types/react-native': '0.70.*',
      },
    };

    const { remove, add } = getPackagesToModify(pkgJson);

    expect(remove).toContain('react-native-unimodules');
    expect(remove).toContain('@types/react-native');
    expect(add).toEqual([]);
  });

  it(`should add new packages`, () => {
    const pkgJson = {
      dependencies: {
        '@react-native-community/async-storage': '1.13.2',
        'expo-auth-session': '3.3.1',
      },
    };

    const { remove, add } = getPackagesToModify(pkgJson);

    expect(remove).toEqual(['@react-native-community/async-storage']);
    expect(add).toEqual(['@react-native-async-storage/async-storage', 'expo-random']);
  });
});
