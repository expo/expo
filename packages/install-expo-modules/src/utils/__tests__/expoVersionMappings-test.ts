import resolveFrom from 'resolve-from';

import { getDefaultSdkVersion } from '../expoVersionMappings';

jest.mock('resolve-from');

describe(getDefaultSdkVersion, () => {
  function setupReactNativeVersionMock(version: string) {
    const mockResolve = resolveFrom.silent as jest.MockedFunction<typeof resolveFrom.silent>;
    mockResolve.mockReturnValueOnce('fs');
    jest.doMock('fs', () => ({ version }));
  }

  afterEach(() => {
    jest.resetModules();
  });

  it('should resolve as sdk 45 from react-native 0.68 project', async () => {
    setupReactNativeVersionMock('0.68.0');
    expect(getDefaultSdkVersion('/projectRoot').expoSdkVersion).toBe('45.0.0');
  });

  it('should resolve as sdk 45 from react-native 0.65 project', async () => {
    setupReactNativeVersionMock('0.65.0');
    expect(getDefaultSdkVersion('/projectRoot').expoSdkVersion).toBe('45.0.0');
  });

  it('should resolve as sdk 44 from react-native 0.64 project', async () => {
    setupReactNativeVersionMock('0.64.3');
    expect(getDefaultSdkVersion('/projectRoot').expoSdkVersion).toBe('44.0.0');
  });
});
