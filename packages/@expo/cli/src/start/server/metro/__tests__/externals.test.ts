import { vol } from 'memfs';

import { NODE_STDLIB_MODULES, isNodeExternal, setupNodeExternals } from '../externals';

describe('NODE_STDLIB_MODULES', () => {
  it(`works`, () => {
    expect(NODE_STDLIB_MODULES.length).toBeGreaterThan(5);
    expect(NODE_STDLIB_MODULES.includes('path')).toBe(true);
  });
});

describe(isNodeExternal, () => {
  it('should return the correct module id', () => {
    expect(isNodeExternal('node:fs')).toBe('fs');
    expect(isNodeExternal('fs')).toBe('fs');
  });

  it('should return null for non-node modules', () => {
    expect(isNodeExternal('expo')).toBe(null);
    expect(isNodeExternal('expo:fs')).toBe(null);
  });
});

describe(setupNodeExternals, () => {
  afterEach(() => vol.reset());
  it('should create the correct files', async () => {
    const projectRoot = '/';

    vol.fromJSON({}, '/');

    await setupNodeExternals(projectRoot);

    expect(Object.keys(vol.toJSON()).length).toBeGreaterThan(42);
    expect(vol.toJSON()['/.expo/metro/polyfill.native.js']).toBeDefined();
    expect(vol.toJSON()['/.expo/metro/polyfill.js']).toBeDefined();
    expect(vol.toJSON()['/.expo/metro/externals/fs/promises/index.js']).toBeDefined();
    expect(vol.toJSON()['/.expo/metro/externals/assert/index.js']).toBeDefined();
  });
});
