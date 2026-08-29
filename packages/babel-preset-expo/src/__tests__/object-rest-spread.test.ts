import * as babel from '@babel/core';

import preset from '..';

jest.mock('../utils/resolveModule.ts', () => ({
  ...jest.requireActual('../utils/resolveModule.ts'),
  resolveModule: jest.fn(() => null),
  hasModule: jest.fn(() => false),
}));

const profiles = [
  ['web', { name: 'metro', platform: 'web', isDev: true }, false],
  ['hermes-v1', { name: 'metro', platform: 'ios', engine: 'hermes', isDev: true }, false],
  ['hermes-v0', { name: 'metro', platform: 'ios', isDev: true }, true],
  ['webview', { name: 'metro', platform: 'web', isDomComponent: true, isDev: true }, true],
] as const;

function transformObjectRest(caller: Record<string, any>): string {
  const result = babel.transformSync(
    `
      function omit(obj, spec) {
        const { [spec.key]: unused, ...rest } = obj;
        return rest;
      }
    `,
    {
      babelrc: false,
      configFile: false,
      filename: '/test.js',
      presets: [[preset, { enableBabelRuntime: false }]],
      caller: caller as babel.TransformCaller,
    }
  );
  if (!result?.code) throw new Error('Babel transform returned no code');
  return result.code;
}

describe('object-rest-spread transforms', () => {
  it.each(profiles)('%s selects the expected transform', (_name, caller, transformsObjectRest) => {
    const code = transformObjectRest(caller);

    expect(code.includes('...rest')).toBe(!transformsObjectRest);
    expect(code.includes('objectWithoutProperties')).toBe(transformsObjectRest);
  });
});

describe('computed object-rest exclusions', () => {
  it.each(profiles.filter(([, , transformsObjectRest]) => transformsObjectRest))(
    '%s assigns the computed key temporary before the loose object-rest transform',
    (_name, caller) => {
      const code = transformObjectRest(caller);

      expect(code).toMatch(/var _spec\$key\s*=\s*spec\.key/);
      expect(code).not.toMatch(/var _spec\$key\s*;/);
    }
  );

  it.each(profiles)('%s preserves the computed exclusion key', (_name, caller) => {
    const code = transformObjectRest(caller);
    // eslint-disable-next-line no-new-func
    const omit = new Function(`${code}; return omit;`)() as (
      obj: Record<string, number>,
      spec: { key: string }
    ) => Record<string, number>;

    expect(omit({ a: 1, b: 2 }, { key: 'a' })).toEqual({ b: 2 });
  });
});
