import resolveFrom from 'resolve-from';

import { transitiveResolveFrom } from '../transitiveResolveFrom';

jest.mock('resolve-from', () => ({
  silent: jest.fn(),
}));

describe(transitiveResolveFrom, () => {
  const projectRoot = '/project';

  beforeEach(() => {
    jest.mocked(resolveFrom.silent).mockReset();
  });

  it('should return the first resolved module path', () => {
    jest.mocked(resolveFrom.silent).mockReturnValueOnce('/project/node_modules/expo/package.json');

    const result = transitiveResolveFrom(projectRoot, [
      'expo/package.json',
      'expo-modules-core/package.json',
    ]);

    expect(result).toBe('/project/node_modules/expo/package.json');
    expect(resolveFrom.silent).toHaveBeenCalledTimes(1);
    expect(resolveFrom.silent).toHaveBeenCalledWith(projectRoot, 'expo/package.json');
  });

  it('should skip unresolvable modules and return the next resolved one', () => {
    jest
      .mocked(resolveFrom.silent)
      .mockReturnValueOnce(undefined as any)
      .mockReturnValueOnce('/project/node_modules/expo-modules-core/package.json');

    const result = transitiveResolveFrom(projectRoot, [
      'expo/package.json',
      'expo-modules-core/package.json',
    ]);

    expect(result).toBe('/project/node_modules/expo-modules-core/package.json');
    expect(resolveFrom.silent).toHaveBeenCalledTimes(2);
  });

  it('should return null when no modules can be resolved', () => {
    jest.mocked(resolveFrom.silent).mockReturnValue(undefined as any);

    const result = transitiveResolveFrom(projectRoot, [
      'nonexistent/package.json',
      'also-nonexistent/package.json',
    ]);

    expect(result).toBeNull();
    expect(resolveFrom.silent).toHaveBeenCalledTimes(2);
  });

  it('should return null for an empty module list', () => {
    const result = transitiveResolveFrom(projectRoot, []);

    expect(result).toBeNull();
    expect(resolveFrom.silent).not.toHaveBeenCalled();
  });
});
