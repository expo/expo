import JsonFile from '@expo/json-file';
import path from 'path';
import resolveFrom from 'resolve-from';

import { findUpPackageJson, getPkgVersion, getPkgVersionFromPath } from '../getPkgVersion';

jest.mock('resolve-from', () => ({
  silent: jest.fn(),
}));

jest.mock('@expo/json-file', () => ({
  read: jest.fn(),
}));

describe(getPkgVersion, () => {
  const projectRoot = '/project';

  beforeEach(() => {
    jest.mocked(resolveFrom.silent).mockReset();
    jest.mocked(JsonFile.read).mockReset();
  });

  it('should return the version string from the resolved package', () => {
    jest
      .mocked(resolveFrom.silent)
      .mockReturnValueOnce('/project/node_modules/expo/index.js')
      .mockReturnValueOnce('/project/node_modules/expo/package.json');
    jest.mocked(JsonFile.read).mockReturnValueOnce({ version: '52.0.0' } as any);

    expect(getPkgVersion(projectRoot, 'expo')).toBe('52.0.0');
  });

  it('should return null when the package cannot be resolved', () => {
    jest.mocked(resolveFrom.silent).mockReturnValue(undefined as any);

    expect(getPkgVersion(projectRoot, 'nonexistent')).toBeNull();
    expect(JsonFile.read).not.toHaveBeenCalled();
  });

  it('should return null when package.json has no version field', () => {
    jest
      .mocked(resolveFrom.silent)
      .mockReturnValueOnce('/project/node_modules/expo/index.js')
      .mockReturnValueOnce('/project/node_modules/expo/package.json');
    jest.mocked(JsonFile.read).mockReturnValueOnce({ name: 'expo' } as any);

    expect(getPkgVersion(projectRoot, 'expo')).toBeNull();
  });

  it('should return null when version is not a string', () => {
    jest
      .mocked(resolveFrom.silent)
      .mockReturnValueOnce('/project/node_modules/expo/index.js')
      .mockReturnValueOnce('/project/node_modules/expo/package.json');
    jest.mocked(JsonFile.read).mockReturnValueOnce({ version: 123 } as any);

    expect(getPkgVersion(projectRoot, 'expo')).toBeNull();
  });
});

describe(getPkgVersionFromPath, () => {
  beforeEach(() => {
    jest.mocked(JsonFile.read).mockReset();
  });

  it('should return the version string from the package.json path', () => {
    jest.mocked(JsonFile.read).mockReturnValueOnce({ version: '1.2.3' } as any);

    expect(getPkgVersionFromPath('/project/node_modules/expo/package.json')).toBe('1.2.3');
    expect(JsonFile.read).toHaveBeenCalledWith('/project/node_modules/expo/package.json');
  });

  it('should return null when package.json has no version field', () => {
    jest.mocked(JsonFile.read).mockReturnValueOnce({ name: 'expo' } as any);

    expect(getPkgVersionFromPath('/project/node_modules/expo/package.json')).toBeNull();
  });

  it('should return null when version is not a string', () => {
    jest.mocked(JsonFile.read).mockReturnValueOnce({ version: 123 } as any);

    expect(getPkgVersionFromPath('/project/node_modules/expo/package.json')).toBeNull();
  });
});

describe(findUpPackageJson, () => {
  beforeEach(() => {
    jest.mocked(resolveFrom.silent).mockReset();
  });

  it('should return package.json path when found in the given directory', () => {
    jest.mocked(resolveFrom.silent).mockReturnValueOnce('/project/node_modules/expo/package.json');

    expect(findUpPackageJson('/project/node_modules/expo/src/index.js')).toBe(
      '/project/node_modules/expo/package.json'
    );
  });

  it('should walk up directories until package.json is found', () => {
    jest
      .mocked(resolveFrom.silent)
      .mockReturnValueOnce(undefined as any)
      .mockReturnValueOnce(undefined as any)
      .mockReturnValueOnce('/project/node_modules/expo/package.json');

    expect(findUpPackageJson('/project/node_modules/expo/src/deep/index.js')).toBe(
      '/project/node_modules/expo/package.json'
    );
    expect(resolveFrom.silent).toHaveBeenCalledTimes(3);
  });

  it('should return null when reaching the root directory', () => {
    expect(findUpPackageJson(path.sep)).toBeNull();
  });

  it('should return null for relative root', () => {
    expect(findUpPackageJson('.')).toBeNull();
  });
});
