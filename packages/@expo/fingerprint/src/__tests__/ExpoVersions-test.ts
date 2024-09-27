import resolveFrom from 'resolve-from';

import {
  resolveExpoVersion,
  resolveExpoAutolinkingVersion,
  satisfyExpoVersion,
} from '../ExpoVersions';

jest.mock('resolve-from');

const projectRoot = '/app';
const mockedResolveFrom = resolveFrom.silent as jest.MockedFunction<typeof resolveFrom.silent>;

describe(resolveExpoVersion, () => {
  const expoPackageJsonPath = `${projectRoot}/node_modules/expo/package.json`;
  afterEach(() => {
    jest.dontMock(expoPackageJsonPath);
  });

  it('should return the version of the expo package if found', () => {
    jest.isolateModules(() => {
      const expoPackageJson = { version: '1.0.0' };

      mockedResolveFrom.mockReturnValueOnce(expoPackageJsonPath);
      jest.doMock(expoPackageJsonPath, () => expoPackageJson, { virtual: true });

      const version = resolveExpoVersion(projectRoot);
      expect(version).toBe('1.0.0');
    });
  });

  it('should return null if the expo package is not found', () => {
    mockedResolveFrom.mockReturnValueOnce(undefined);
    const version = resolveExpoVersion(projectRoot);
    expect(version).toBeNull();
  });
});

describe(resolveExpoAutolinkingVersion, () => {
  const expoPackageJsonPath = `${projectRoot}/node_modules/expo/package.json`;
  const autolinkingPackageJsonPath = `${projectRoot}/node_modules/expo-modules-autolinking/package.json`;

  afterEach(() => {
    mockedResolveFrom.mockReset();
    jest.dontMock(autolinkingPackageJsonPath);
  });

  it('should return the version of the expo-modules-autolinking package if found', () => {
    jest.isolateModules(() => {
      const autolinkingPackageJson = { version: '1.0.0' };

      mockedResolveFrom.mockImplementation((_, moduleId) => {
        if (moduleId === 'expo/package.json') {
          return expoPackageJsonPath;
        } else if (moduleId === 'expo-modules-autolinking/package.json') {
          return autolinkingPackageJsonPath;
        }
        return undefined;
      });
      jest.doMock(autolinkingPackageJsonPath, () => autolinkingPackageJson, { virtual: true });

      const version = resolveExpoAutolinkingVersion(projectRoot);
      expect(version).toBe('1.0.0');
    });
  });

  it('should return null if the expo-modules-autolinking package is not found', () => {
    mockedResolveFrom.mockReturnValueOnce(undefined);
    const version = resolveExpoAutolinkingVersion(projectRoot);
    expect(version).toBeNull();
  });
});

describe(satisfyExpoVersion, () => {
  const expoPackageJsonPath = `${projectRoot}/node_modules/expo/package.json`;
  afterEach(() => {
    mockedResolveFrom.mockReset();
    jest.dontMock(expoPackageJsonPath);
  });

  it('should return true if the expo version satisfies the range', () => {
    jest.isolateModules(() => {
      const expoPackageJson = { version: '51.0.0' };

      mockedResolveFrom.mockReturnValue(expoPackageJsonPath);
      jest.doMock(expoPackageJsonPath, () => expoPackageJson, { virtual: true });

      expect(satisfyExpoVersion(projectRoot, '^51.0.0')).toBe(true);
      expect(satisfyExpoVersion(projectRoot, '<52.0.0')).toBe(true);
    });
  });

  it('should return false if the expo version does not satisfy the range', () => {
    jest.isolateModules(() => {
      const expoPackageJson = { version: '51.0.0' };

      mockedResolveFrom.mockReturnValue(expoPackageJsonPath);
      jest.doMock(expoPackageJsonPath, () => expoPackageJson, { virtual: true });

      expect(satisfyExpoVersion(projectRoot, '<51.0.0')).toBe(false);
      expect(satisfyExpoVersion(projectRoot, '50.0.0')).toBe(false);
    });
  });

  it('should return null if the expo package is not found', () => {
    mockedResolveFrom.mockReturnValueOnce(undefined);
    const version = satisfyExpoVersion(projectRoot, '^1.0.0');
    expect(version).toBeNull();
  });
});
