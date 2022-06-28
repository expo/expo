import { vol } from 'memfs';

import { getConfigFilePaths, modifyConfigAsync } from '../Config';
import { getDynamicConfig, getStaticConfig } from '../getConfig';

const mockConfigContext = {} as any;

jest.mock('fs');

describe(modifyConfigAsync, () => {
  beforeAll(async () => {
    vol.fromJSON(
      {
        'package.json': JSON.stringify({}),
      },
      'no-config'
    );
    vol.fromJSON(
      {
        'package.json': JSON.stringify({}),
        'app.config.js': 'export default {};',
        'app.config.json': JSON.stringify({}),
      },
      'dynamic-and-static'
    );
    vol.fromJSON(
      {
        'app.config.json': JSON.stringify(
          {
            name: 'app-config-json',
            slug: 'app-config-json',
            version: '1.0.0',
            platforms: [],
          },
          null,
          2
        ),
        'app.json': JSON.stringify(
          {
            name: 'app-json',
          },
          null,
          2
        ),
        'package.json': JSON.stringify({}),
      },
      'static-override'
    );
  });

  afterAll(() => {
    vol.reset();
  });

  it(`can write to a static only config`, async () => {
    const { type, config } = await modifyConfigAsync(
      'static-override',
      { foo: 'bar' } as any,
      { skipSDKVersionRequirement: true },
      { dryRun: true }
    );
    expect(type).toBe('success');
    // @ts-ignore: foo property is not defined
    expect(config.foo).toBe('bar');
  });
  it(`cannot write to a dynamic config`, async () => {
    const { type, config } = await modifyConfigAsync(
      'dynamic-and-static',
      {},
      { skipSDKVersionRequirement: true },
      { dryRun: true }
    );
    expect(type).toBe('warn');
    expect(config).toBe(null);
  });
  it(`cannot write to a project without a config`, async () => {
    const { type, config } = await modifyConfigAsync(
      'no-config',
      {},
      { skipSDKVersionRequirement: true },
      { dryRun: true }
    );
    expect(type).toBe('fail');
    expect(config).toBe(null);
  });
});

const invalidConfig = `/* eslint-disable */
module.exports = {
  name: 'app',
  >
  slug: 'app',
}`;

describe(getDynamicConfig, () => {
  beforeAll(async () => {
    vol.fromJSON(
      {
        'exports-function.app.config.js': `export default function (config) {
          return { ...config };
        }`,
        'exports-object.app.config.js': `export default {};`,
      },
      'dynamic-export-types'
    );
    vol.fromJSON(
      {
        // This file exists to test that an invalid app.config.ts
        // gets used instead of defaulting to a valid app.config.js
        'app.config.js': `export default {};`,
        // This is a syntax error:
        'app.config.ts': invalidConfig,
      },
      'syntax-error'
    );
    vol.fromJSON(
      {
        // This is a missing import
        'app.config.ts': [`import 'foobar'`, 'module.exports = {}'].join('\n'),
      },
      'missing-import-error'
    );
  });

  afterAll(() => {
    vol.reset();
  });

  it(`exports a function`, () => {
    expect(
      getDynamicConfig('dynamic-export-types/exports-function.app.config.js', mockConfigContext)
        .exportedObjectType
    ).toBe('function');
  });

  it(`exports an object`, () => {
    expect(
      getDynamicConfig('dynamic-export-types/exports-object.app.config.js', mockConfigContext)
        .exportedObjectType
    ).toBe('object');
  });

  // This tests error are thrown properly and ensures that a more specific
  // config is used instead of defaulting to a valid substitution.
  it(`throws a useful error for dynamic configs with a syntax error`, () => {
    const paths = getConfigFilePaths('syntax-error');
    expect(() => getDynamicConfig(paths.dynamicConfigPath, mockConfigContext)).toThrowError(
      /Error .* \(5:7\)/
    );
  });
  // This tests error are thrown properly and ensures that a more specific
  // config is used instead of defaulting to a valid substitution.
  it(`throws a useful error for dynamic configs with a missing import`, () => {
    const paths = getConfigFilePaths('missing-import-error');
    expect(() => getDynamicConfig(paths.dynamicConfigPath, mockConfigContext)).toThrowError(
      /Require stack/
    );
  });
});

describe(getStaticConfig, () => {
  beforeAll(async () => {
    vol.fromJSON(
      {
        'package.json': JSON.stringify({}),
        'app.json': JSON.stringify(
          {
            name: 'app-json',
          },
          null,
          2
        ),
        'app.config.json': JSON.stringify(
          {
            name: 'app-config-json',
            slug: 'app-config-json',
            version: '1.0.0',
            platforms: [],
          },
          null,
          2
        ),
      },
      'static-override'
    );
  });

  afterAll(() => {
    vol.reset();
  });

  // This tests error are thrown properly and ensures that a more specific
  // config is used instead of defaulting to a valid substitution.
  it(`uses app.config.json instead of app.json if both exist`, () => {
    const paths = getConfigFilePaths('static-override');
    expect(paths.staticConfigPath).toMatch(/app\.config\.json/);

    expect(getStaticConfig(paths.staticConfigPath).name).toBe('app-config-json');
  });
});
