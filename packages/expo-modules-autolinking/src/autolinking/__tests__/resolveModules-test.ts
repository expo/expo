import { getLinkingImplementationForPlatform } from '../../platforms';
import { resolveModulesAsync } from '../resolveModules';

jest.mock('../../platforms');

const mockGetLinkingImplementation = getLinkingImplementationForPlatform as jest.MockedFunction<
  typeof getLinkingImplementationForPlatform
>;

const searchResults = {
  'expo-clipboard': {
    name: 'expo-clipboard',
    path: '/app/node_modules/expo-clipboard',
    version: '1.0.0',
  },
};

const autolinkingOptions = {
  platform: 'apple' as const,
  searchPaths: [],
  nativeModulesDir: null,
  exclude: [],
  include: [],
  legacy_shallowReactNativeLinking: false,
};

describe(resolveModulesAsync, () => {
  it('hands the scan results to resolveModuleAsync through extraOutput', async () => {
    const scannedModules = { 'expo-clipboard': [{ name: null, class: 'ClipboardModule' }] };
    const resolveModuleAsync = jest.fn().mockResolvedValue({ packageName: 'expo-clipboard' });
    mockGetLinkingImplementation.mockReturnValue({
      scanNativeModulesAsync: jest.fn().mockResolvedValue(scannedModules),
      resolveModuleAsync,
    } as any);

    await resolveModulesAsync(searchResults, autolinkingOptions);

    expect(resolveModuleAsync).toHaveBeenCalledWith(
      'expo-clipboard',
      searchResults['expo-clipboard'],
      expect.objectContaining({ scannedModules })
    );
  });

  it('resolves without scan results when the platform has no scan hook', async () => {
    const resolveModuleAsync = jest.fn().mockResolvedValue({ packageName: 'expo-clipboard' });
    mockGetLinkingImplementation.mockReturnValue({ resolveModuleAsync } as any);

    const result = await resolveModulesAsync(searchResults, autolinkingOptions);

    expect(result).toHaveLength(1);
    expect(resolveModuleAsync).toHaveBeenCalledWith(
      'expo-clipboard',
      searchResults['expo-clipboard'],
      expect.objectContaining({ scannedModules: null })
    );
  });

  it('resolves without scan results when the scan hook throws', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation();
    const resolveModuleAsync = jest.fn().mockResolvedValue({ packageName: 'expo-clipboard' });
    mockGetLinkingImplementation.mockReturnValue({
      scanNativeModulesAsync: jest.fn().mockRejectedValue(new Error('scan exploded')),
      resolveModuleAsync,
    } as any);

    const result = await resolveModulesAsync(searchResults, autolinkingOptions);

    expect(result).toHaveLength(1);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('scan exploded'));
  });
});
