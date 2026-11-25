const expoModules = require('../../src/preset/moduleMocks/expoModules');

const BLACKLIST = [
  // Modules with hand-written mocks.
  'ExpoCrypto',
  'ExpoClipboard',
  'ExpoLocalization',
  'ExpoLinking',
  'ExpoFont',
  'ExpoFileSystem',
  // bare-expo local test modules — must not leak into the public preset.
  'JestMockSchemaModule',
  'TestExpoUi',
  'WorkletsTesterModule',
  'ExpoVideoDashSupportModule',
  // Dev-client tooling — not shipped by published apps.
  'ExpoDevMenu',
  'ExpoDevLauncher',
  'DevMenuPreferences',
];

describe('generated expoModules mock', () => {
  const proxy = expoModules.NativeUnimoduleProxy;

  it('keeps the required top-level shape', () => {
    expect(proxy).toBeDefined();
    expect(proxy.exportedMethods.type).toBe('object');
    expect(proxy.modulesConstants.type).toBe('mock');
    expect(proxy.viewManagersMetadata.type).toBe('object');
  });

  it('does not include blacklisted modules', () => {
    const methodModules = Object.keys(proxy.exportedMethods.mock);
    for (const name of BLACKLIST) {
      expect(methodModules).not.toContain(name);
    }
  });

  it('has no anonymous (empty-name) module', () => {
    expect(Object.keys(proxy.exportedMethods.mock)).not.toContain('');
    expect(Object.keys(proxy.modulesConstants.mockDefinition)).not.toContain('');
  });

  it('includes a representative sample of SDK modules', () => {
    const methodModules = Object.keys(proxy.exportedMethods.mock);
    expect(methodModules.length).toBeGreaterThan(30);
  });
});
