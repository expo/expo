import { vol } from 'memfs';

import { isNodeExternal, setupNodeExternals } from '../externals';

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

    expect(vol.toJSON()).toMatchSnapshot();

    expect(vol.toJSON()['/.expo/metro/polyfill.native.js']).toBeDefined();
    expect(vol.toJSON()['/.expo/metro/polyfill.js']).toBeDefined();
    expect(vol.toJSON()['/.expo/metro/externals/fs/promises/index.js']).toBeDefined();
  });
});
