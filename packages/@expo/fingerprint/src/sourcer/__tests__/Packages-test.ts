import { vol } from 'memfs';
import resolveFrom from 'resolve-from';

import { getPackageSourceAsync } from '../Packages';

const FAKE_REACT_NATIVE_PACKAGE_JSON = {
  name: 'react-native',
  version: '1.0.0',
};
jest.mock('fs/promises');
jest.mock('resolve-from');
jest.mock('/app/node_modules/react-native/package.json', () => FAKE_REACT_NATIVE_PACKAGE_JSON, {
  virtual: true,
});

describe(getPackageSourceAsync, () => {
  afterEach(() => {
    vol.reset();
  });

  it('should return package.json contents when packageJsonOnly=true', async () => {
    const mockedResolveFrom = resolveFrom.silent as jest.MockedFunction<typeof resolveFrom.silent>;
    mockedResolveFrom.mockReturnValueOnce('/app/node_modules/react-native/package.json');

    const source = await getPackageSourceAsync('/app', {
      packageName: 'react-native',
      packageJsonOnly: true,
    });
    expect(source).toEqual({
      type: 'contents',
      id: 'package:react-native',
      contents: JSON.stringify(FAKE_REACT_NATIVE_PACKAGE_JSON),
      reasons: ['package:react-native'],
    });
  });

  it('should return directory when packageJsonOnly=false', async () => {
    vol.mkdirpSync('/app/node_modules/react-native');
    vol.writeFileSync(
      '/app/node_modules/react-native/package.json',
      JSON.stringify(FAKE_REACT_NATIVE_PACKAGE_JSON)
    );
    vol.writeFileSync('/app/node_modules/react-native/test.cpp', 'int foo() { return 0; }');
    const mockedResolveFrom = resolveFrom.silent as jest.MockedFunction<typeof resolveFrom.silent>;
    mockedResolveFrom.mockReturnValueOnce('/app/node_modules/react-native/package.json');

    const source = await getPackageSourceAsync('/app', {
      packageName: 'react-native',
      packageJsonOnly: false,
    });
    expect(source).toEqual({
      type: 'dir',
      filePath: 'node_modules/react-native',
      reasons: ['package:react-native'],
    });
  });

  it('should return null if package.json is not found', async () => {
    const source = await getPackageSourceAsync('/app', {
      packageName: 'nonexistent-package',
      packageJsonOnly: true,
    });
    expect(source).toBe(null);
  });
});
