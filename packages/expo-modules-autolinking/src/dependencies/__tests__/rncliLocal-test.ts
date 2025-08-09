import { vol } from 'memfs';

import { scanDependenciesFromRNProjectConfig } from '../rncliLocal';

const projectRoot = '/fake/project';

describe(scanDependenciesFromRNProjectConfig, () => {
  afterEach(() => {
    vol.reset();
  });

  it('resolves local dependencies by react-native.config.js roots', async () => {
    vol.fromNestedJSON(
      {
        'local-module': { '.keep': '' },
      },
      projectRoot
    );

    const result = await scanDependenciesFromRNProjectConfig(projectRoot, {
      dependencies: {
        'local-module': {
          root: 'local-module',
        },
      },
    });

    expect(result).toMatchInlineSnapshot(`
      {
        "local-module": {
          "depth": 0,
          "duplicates": null,
          "name": "local-module",
          "originPath": "/fake/project/local-module",
          "path": "/fake/project/local-module",
          "source": 2,
          "version": "",
        },
      }
    `);
  });

  it('ignores the reference when the root path is invalid', async () => {
    const result = await scanDependenciesFromRNProjectConfig(projectRoot, {
      dependencies: {
        'invalid-module': {
          root: 'invalid-module',
        },
      },
    });

    expect(result).toEqual({});
  });
});
