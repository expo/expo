import * as babel from '@babel/core';

import preset from '..';

// None of the optional integrations (worklets, expo-ui, router, ...) matter for
// decorator behavior, so resolve none of them.
jest.mock('../utils/resolveModule.ts', () => ({
  ...jest.requireActual('../utils/resolveModule.ts'),
  resolveModule: jest.fn(() => null),
  hasModule: jest.fn(() => false),
}));

const DECORATED_CLASS = `
function watch(target, key, descriptor) { return descriptor; }
export class Model {
  @watch greeting = 'decorated field works';
}
`;

const PLAIN_CLASS = `
export class Plain {
  greeting = 'plain field';
}
`;

function transform(caller: Record<string, any>, code: string, filename = '/model.ts'): string {
  const result = babel.transformSync(code, {
    babelrc: false,
    configFile: false,
    filename,
    presets: [preset],
    caller: caller as babel.TransformCaller,
  });
  if (!result?.code) throw new Error('transformSync returned no code');
  return result.code;
}

/** Execute transformed CommonJS output and return its exports. */
function execute(code: string): Record<string, any> {
  const module = { exports: {} as Record<string, any> };
  // eslint-disable-next-line no-new-func
  new Function('require', 'module', 'exports', code)(require, module, module.exports);
  return module.exports;
}

const HERMES_V1_CALLER = { name: 'metro', engine: 'hermes', platform: 'ios', isDev: false };
const HERMES_V0_CALLER = { name: 'metro', platform: 'ios', isDev: false };
const WEB_CALLER = { name: 'metro', platform: 'web', isDev: false };

describe('legacy decorators on class properties', () => {
  // Legacy decorators require the class-properties transform to run after them.
  // Without it, decorated class properties compile to `initializerWarningHelper`
  // calls that throw `Decorating class property failed` at runtime.
  it.each([
    ['hermes-v1', HERMES_V1_CALLER],
    ['hermes-v0', HERMES_V0_CALLER],
    ['web', WEB_CALLER],
  ])('compiles decorated class properties to working output (%s)', (_profile, caller) => {
    const code = transform(caller, DECORATED_CLASS);
    const { Model } = execute(code);
    expect(new Model().greeting).toBe('decorated field works');
  });

  it('compiles decorated properties in classes that also use private methods (hermes-v1)', () => {
    const code = transform(
      HERMES_V1_CALLER,
      `
      function watch(target, key, descriptor) { return descriptor; }
      export class Model {
        @watch greeting = 'decorated field works';
        #suffix() { return '!'; }
        shout() { return this.greeting + this.#suffix(); }
      }
      `
    );
    const { Model } = execute(code);
    expect(new Model().shout()).toBe('decorated field works!');
  });

  it('preserves native class fields in files without decorators (hermes-v1)', () => {
    const code = transform(HERMES_V1_CALLER, PLAIN_CLASS);
    // The class field must not be compiled away into constructor assignments.
    expect(code).toMatch(/class Plain\s*\{\s*greeting\s*=/);
  });

  it('does not reference the initializer warning helper for decorated properties (hermes-v1)', () => {
    const code = transform(HERMES_V1_CALLER, DECORATED_CLASS);
    expect(code).toContain('initializerDefineProperty');
    expect(code).not.toMatch(/initializerWarningHelper[\w$]*\.default\)\(/);
  });
});
