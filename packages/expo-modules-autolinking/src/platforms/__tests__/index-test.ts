import { getLinkingImplementationForPlatform } from '../index';

// The dispatcher loads each platform through its `index.ts`, whose explicit re-export list is what
// exists at runtime. The `PlatformImplementations` types point at the implementation files instead,
// so a function missing from the re-exports is invisible at runtime while still type-checking.
// These tests pin the expected surface so a new platform function can't be silently dropped.
describe(getLinkingImplementationForPlatform, () => {
  it.each(['apple', 'ios', 'macos', 'tvos'] as const)(
    'exposes the apple platform functions for %s',
    (platform) => {
      const implementation = getLinkingImplementationForPlatform(platform);
      expect(typeof implementation.getConfiguration).toBe('function');
      expect(typeof implementation.generateModulesProviderAsync).toBe('function');
      expect(typeof implementation.resolveModuleAsync).toBe('function');
      expect(typeof implementation.resolveExtraBuildDependenciesAsync).toBe('function');
      expect(typeof implementation.scanNativeModulesAsync).toBe('function');
    }
  );

  it('exposes the android platform functions', () => {
    const implementation = getLinkingImplementationForPlatform('android');
    expect(typeof implementation.resolveModuleAsync).toBe('function');
    expect(typeof implementation.resolveExtraBuildDependenciesAsync).toBe('function');
  });
});
