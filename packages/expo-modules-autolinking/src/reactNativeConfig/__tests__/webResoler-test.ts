import { vol } from 'memfs';

import { checkDependencyWebAsync } from '../webResolver';

jest.mock('fs/promises');
jest.mock('glob');

describe(checkDependencyWebAsync, () => {
  afterEach(() => {
    vol.reset();
  });

  it('should return web config if react-native config found', async () => {
    const result = await checkDependencyWebAsync(
      { path: '/app/node_modules/react-native-test', version: '1.0.0' },
      { root: '/app/node_modules/react-native-test' }
    );
    expect(result).toMatchInlineSnapshot(`
      {
        "version": "1.0.0",
      }
    `);
  });

  it('should return web config if heuristic matches a native module', async () => {
    vol.fromJSON({
      '/app/node_modules/react-native-maps/package.json': JSON.stringify({
        name: 'react-native-maps',
        peerDependencies: {
          'react-native': '*',
        },
        codegenConfig: {
          name: 'rnmaps',
        },
      }),
    });
    const result = await checkDependencyWebAsync(
      { path: '/app/node_modules/react-native-maps', version: '1.0.0' },
      {}
    );
    expect(result).toMatchInlineSnapshot(`
      {
        "version": "1.0.0",
      }
    `);
  });

  it('should return null if heuristic does not match a native module', async () => {
    vol.fromJSON({
      '/app/node_modules/react-native-maps/package.json': JSON.stringify({
        name: 'react-native-maps',
      }),
    });
    const result = await checkDependencyWebAsync(
      { path: '/app/node_modules/react-native-maps', version: '1.0.0' },
      {}
    );
    expect(result).toBeNull();
  });
});
