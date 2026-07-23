import { vol } from 'memfs';
import resolveFrom from 'resolve-from';

import { getPackageSourceAsync } from '../Packages';

const FAKE_REACT_NATIVE_PACKAGE_JSON = {
  name: 'react-native',
  version: '1.0.0',
};
jest.mock('fs/promises');
jest.mock('resolve-from');

describe(getPackageSourceAsync, () => {
  afterEach(() => {
    vol.reset();
  });

  it('should return a package source with embedded name and version when sourceType is package', async () => {
    vol.fromJSON({
      '/app/node_modules/react-native/package.json': JSON.stringify(FAKE_REACT_NATIVE_PACKAGE_JSON),
    });
    const mockedResolveFrom = resolveFrom.silent as jest.MockedFunction<typeof resolveFrom.silent>;
    mockedResolveFrom.mockReturnValueOnce('/app/node_modules/react-native/package.json');

    const source = await getPackageSourceAsync('/app', {
      packageName: 'react-native',
      sourceType: 'package',
    });
    expect(source).toEqual({
      type: 'package',
      name: 'react-native',
      version: '1.0.0',
      filePath: 'node_modules/react-native/package.json',
      reasons: ['package:react-native'],
    });
  });

  it('should return a directory source when sourceType is files', async () => {
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
      sourceType: 'files',
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
      sourceType: 'package',
    });
    expect(source).toBe(null);
  });
});
