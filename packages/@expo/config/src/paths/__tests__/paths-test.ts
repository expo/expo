import { vol } from 'memfs';

import { resolveEntryPoint } from '../paths';

jest.mock('fs', () => require('memfs').fs);
jest.mock('node:fs', () => require('memfs').fs);
jest.mock('@expo/require-utils', () => {
  const requireUtils = jest.requireActual('@expo/require-utils');
  return {
    ...requireUtils,
    resolveFrom(
      fromDirectory: string,
      moduleId: string,
      params?: { extensions?: readonly string[] }
    ) {
      const fs = require('memfs').fs;
      const path = require('path');
      const candidates: string[] = [];
      if (moduleId.startsWith('.') || moduleId.startsWith('/')) {
        candidates.push(path.resolve(fromDirectory, moduleId));
      } else {
        candidates.push(path.join(fromDirectory, 'node_modules', moduleId));
        candidates.push(path.resolve(fromDirectory, moduleId));
      }
      for (const candidate of candidates) {
        if (fs.existsSync(candidate)) return candidate;
        for (const ext of params?.extensions ?? []) {
          const e = ext[0] !== '.' ? `.${ext}` : ext;
          if (fs.existsSync(candidate + e)) return candidate + e;
        }
      }
      return null;
    },
  };
});

describe(resolveEntryPoint, () => {
  afterEach(() => vol.reset());

  it('exists-no-platform', () => {
    vol.fromJSON(
      {
        'package.json': JSON.stringify({
          main: 'index.js',
        }),
        'index.js': '',
      },
      '/'
    );

    expect(resolveEntryPoint('/')).toBe('/index.js');
  });

  // Can't test resolving modules yet
  it('exists-no-platform-no-main', () => {
    vol.fromJSON(
      {
        'package.json': JSON.stringify({}),
        'index.js': '',
      },
      '/'
    );
    expect(resolveEntryPoint('/')).toBe('/index.js');
  });

  it('Uses android-specific entry', () => {
    vol.fromJSON(
      {
        'package.json': JSON.stringify({ main: 'index.android.js' }),
        'index.android.js': '',
      },
      '/'
    );
    expect(resolveEntryPoint('/', { platform: 'android' })).toBe('/index.android.js');
  });

  it('Uses multiple platform specific entry files', () => {
    vol.fromJSON(
      {
        'package.json': JSON.stringify({}),
        'index.js': '',
        'index.ios.js': '',
        'index.android.js': '',
      },
      '/'
    );
    expect(resolveEntryPoint('/', { platform: 'android' })).toBe('/index.android.js');
    expect(resolveEntryPoint('/', { platform: 'ios' })).toBe('/index.ios.js');
    expect(resolveEntryPoint('/', { platform: 'web' })).toBe('/index.js');
    expect(resolveEntryPoint('/', { platform: undefined })).toBe('/index.js');
  });

  it('resolve ios with no others', () => {
    vol.fromJSON(
      {
        'package.json': JSON.stringify({}),
        'index.ios.js': '',
      },
      '/'
    );
    expect(resolveEntryPoint('/', { platform: 'ios' })).toBe('/index.ios.js');
  });

  it('exists-expjson', () => {
    vol.fromJSON(
      {
        'package.json': JSON.stringify({
          main: './unknown',
        }),
        'main.js': '',
      },
      '/'
    );

    expect(() => resolveEntryPoint('/')).toThrowErrorMatchingInlineSnapshot(
      `"Cannot resolve entry file: The \`main\` field defined in your \`package.json\` points to an unresolvable or non-existent path."`
    );
  });

  it('uses node_modules/expo/AppEntry as a last resort', () => {
    vol.fromJSON(
      {
        'package.json': JSON.stringify({}),
        'node_modules/expo/AppEntry.js': '',
      },
      '/'
    );

    expect(resolveEntryPoint('/')).toBe('/node_modules/expo/AppEntry.js');
  });

  it('resolves modules in package.json main', () => {
    vol.fromJSON(
      {
        'package.json': JSON.stringify({ main: 'expo/AppEntry' }),
        'node_modules/expo/AppEntry.js': '',
      },
      '/'
    );

    expect(resolveEntryPoint('/')).toBe('/node_modules/expo/AppEntry.js');
  });
});
