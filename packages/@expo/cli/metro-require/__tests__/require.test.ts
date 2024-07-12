/**
 * Copyright © 2024 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * https://github.com/facebook/metro/blob/ebd40efa3bd3363930ffe21120714a4d9e0b7bac/packages/metro-runtime/src/polyfills/__tests__/require-test.js#L1
 */

import { createModuleSystem, moduleSystemCode } from './MetroFastRefreshMockRuntime';

jest.useFakeTimers();
jest.unmock('fs');

function createModule(
  moduleSystem: any,
  moduleId: string | number,
  verboseName?: string,
  factory?: (...args: any[]) => any,
  dependencyMap: (string | number)[] = [],
  globalPrefix = ''
) {
  moduleSystem[globalPrefix + '__d'](factory, moduleId, dependencyMap, verboseName);
}

const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

describe('require', () => {
  function createReactRefreshMock(moduleSystem) {
    const familiesByID = new Map();
    const familiesByType = new Map();
    const Refresh = {
      register(id, type) {
        if (familiesByType.has(type)) {
          return;
        }
        let family = familiesByID.get(id);
        if (!family) {
          family = { id };
          familiesByID.set(id, family);
        }
        familiesByType.set(type, family);
      },
      // A simplified version of the logic in react-refresh/runtime.
      isLikelyComponentType(type) {
        return typeof type === 'function' && /^[A-Z]/.test(type.name);
      },
      getFamilyByType(type) {
        return familiesByType.get(type);
      },
      performReactRefresh: jest.fn(),
      performFullRefresh: jest.fn(),
    };
    moduleSystem.__r.Refresh = Refresh;
    return Refresh;
  }

  let moduleSystem;

  beforeEach(() => {
    moduleSystem = {};
    consoleWarnSpy.mockClear();
  });

  it('does not need any babel helper logic', () => {
    // The react native preset uses @babel/transform-runtime so helpers will be
    // imported from @babel/runtime.
    expect(moduleSystemCode.includes('@babel/runtime')).toBe(false);
  });

  it('works with plain bundles', () => {
    createModuleSystem(moduleSystem, false, '');
    expect(moduleSystem.__r).not.toBeUndefined();
    expect(moduleSystem.__d).not.toBeUndefined();

    const mockExports = { foo: 'bar' };
    const mockFactory = jest
      .fn()
      .mockImplementation(
        (global, require, importDefault, importAll, moduleObject, exports, dependencyMap) => {
          moduleObject.exports = mockExports;
        }
      );

    moduleSystem.__d(mockFactory, 1, [2, 3]);
    expect(mockFactory).not.toBeCalled();

    const m = moduleSystem.__r(1);
    expect(mockFactory.mock.calls.length).toBe(1);
    expect(mockFactory.mock.calls[0][0]).toBe(moduleSystem);
    expect(m).toBe(mockExports);
    expect(mockFactory.mock.calls[0][6]).toEqual([2, 3]);
  });

  it('properly prefixes __d with global prefix', () => {
    createModuleSystem(moduleSystem, false, '__metro');
    expect(moduleSystem.__d).toBeUndefined();
    expect(moduleSystem.__metro__d).not.toBeUndefined();
  });

  xit('works with Random Access Modules (RAM) bundles', () => {
    const mockExports = { foo: 'bar' };
    const mockFactory = jest
      .fn()
      .mockImplementation(
        (global, require, importDefault, importAll, moduleObject, exports, dependencyMap) => {
          moduleObject.exports = mockExports;
        }
      );

    moduleSystem.nativeRequire = jest.fn().mockImplementation((localId, bundleId) => {
      // eslint-disable-next-line no-bitwise
      moduleSystem.__d(mockFactory, (bundleId << 16) + localId, [2, 3]);
    });
    createModuleSystem(moduleSystem, false, '');
    expect(moduleSystem.__r).not.toBeUndefined();
    expect(moduleSystem.__d).not.toBeUndefined();

    expect(moduleSystem.nativeRequire).not.toBeCalled();
    expect(mockFactory).not.toBeCalled();

    const CASES = [
      [1, 1, 0],
      [42, 42, 0],
      [196650, 42, 3],
    ];

    CASES.forEach(([moduleId, localId, bundleId]) => {
      moduleSystem.nativeRequire.mockClear();
      mockFactory.mockClear();

      const m = moduleSystem.__r(moduleId);

      expect(moduleSystem.nativeRequire.mock.calls.length).toBe(1);
      expect(moduleSystem.nativeRequire).toBeCalledWith(localId, bundleId);

      expect(mockFactory.mock.calls.length).toBe(1);
      expect(mockFactory.mock.calls[0][0]).toBe(moduleSystem);
      expect(m).toBe(mockExports);
      expect(mockFactory.mock.calls[0][6]).toEqual([2, 3]);
    });
  });

  it('works with segmented bundles', () => {
    const createSegmentDefiner = (modules) => {
      return jest.fn(function (moduleId) {
        const mockModule = modules.find((m) => m.moduleId === moduleId);
        moduleSystem.__d(mockModule.factory, mockModule.moduleId, []);
      });
    };

    const createMockSegment = (segmentId, modules) => {
      modules.forEach((mockModule, localId) => {
        mockModule.factory = jest.fn(
          (global, require, importDefault, importAll, moduleObject, exports, dependencyMap) => {
            moduleObject.exports = mockModule.exports;
          }
        );
        // eslint-disable-next-line no-bitwise
        mockModule.moduleId = (segmentId << 16) + localId;
      });
      return { modules, definer: createSegmentDefiner(modules) };
    };

    const seg = {
      0: createMockSegment(0, [
        {
          exports: {
            name: 'A',
          },
        },
        {
          exports: {
            name: 'B',
          },
        },
      ]),
      1: createMockSegment(1, [
        {
          exports: {
            name: 'C',
          },
        },
        {
          exports: {
            name: 'D',
          },
        },
      ]),
      2: createMockSegment(2, [
        {
          exports: {
            name: 'E',
          },
        },
        {
          exports: {
            name: 'F',
          },
        },
      ]),
    };

    createModuleSystem(moduleSystem, false, '');

    const { __r, __registerSegment } = moduleSystem;

    __registerSegment(
      0,
      seg[0].definer
      // No module IDs for main segment
    );
    __registerSegment(
      1,
      seg[1].definer,
      seg[1].modules.map(({ moduleId }) => moduleId)
    );
    __registerSegment(
      2,
      seg[2].definer,
      seg[2].modules.map(({ moduleId }) => moduleId)
    );

    expect(seg[0].definer).not.toBeCalled();
    expect(seg[0].modules[0].factory).not.toBeCalled();
    expect(__r(seg[0].modules[0].moduleId)).toBe(seg[0].modules[0].exports);
    expect(__r(seg[0].modules[0].moduleId)).toBe(seg[0].modules[0].exports);
    expect(seg[0].modules[1].factory).not.toBeCalled();
    expect(__r(seg[0].modules[1].moduleId)).toBe(seg[0].modules[1].exports);
    expect(__r(seg[0].modules[1].moduleId)).toBe(seg[0].modules[1].exports);

    expect(seg[1].definer).not.toBeCalled();
    expect(seg[1].modules[0].factory).not.toBeCalled();
    expect(__r(seg[1].modules[0].moduleId)).toBe(seg[1].modules[0].exports);
    expect(__r(seg[1].modules[0].moduleId)).toBe(seg[1].modules[0].exports);
    expect(seg[1].modules[1].factory).not.toBeCalled();
    expect(__r(seg[1].modules[1].moduleId)).toBe(seg[1].modules[1].exports);
    expect(__r(seg[1].modules[1].moduleId)).toBe(seg[1].modules[1].exports);

    expect(seg[2].definer).not.toBeCalled();
    expect(seg[2].modules[0].factory).not.toBeCalled();
    expect(__r(seg[2].modules[0].moduleId)).toBe(seg[2].modules[0].exports);
    expect(__r(seg[2].modules[0].moduleId)).toBe(seg[2].modules[0].exports);
    expect(seg[2].modules[1].factory).not.toBeCalled();
    expect(__r(seg[2].modules[1].moduleId)).toBe(seg[2].modules[1].exports);
    expect(__r(seg[2].modules[1].moduleId)).toBe(seg[2].modules[1].exports);

    expect(seg[0].definer).toBeCalledTimes(2);
    expect(seg[1].definer).toBeCalledTimes(2);
    expect(seg[2].definer).toBeCalledTimes(2);
    expect(seg[0].modules[0].factory).toBeCalledTimes(1);
    expect(seg[0].modules[1].factory).toBeCalledTimes(1);
    expect(seg[1].modules[0].factory).toBeCalledTimes(1);
    expect(seg[1].modules[1].factory).toBeCalledTimes(1);
    expect(seg[2].modules[0].factory).toBeCalledTimes(1);
    expect(seg[2].modules[1].factory).toBeCalledTimes(1);

    // eslint-disable-next-line no-bitwise
    const NONEXISTENT_MODULE_ID = 50 << (16 + 5);
    expect(() => __r(NONEXISTENT_MODULE_ID)).toThrow();
  });

  describe('functionality tests', () => {
    it('module.exports === exports', (done) => {
      createModuleSystem(moduleSystem, false, '');

      createModule(
        moduleSystem,
        0,
        'index.js',
        (global, require, importDefault, importAll, module, exports) => {
          expect(module.exports).toBe(exports);
          done();
        }
      );

      moduleSystem.__r(0);
    });

    it('exports values correctly via the module.exports variable', () => {
      createModuleSystem(moduleSystem, false, '');

      createModule(
        moduleSystem,
        0,
        'index.js',
        (global, require, importDefault, importAll, module) => {
          module.exports = 'foo';
        }
      );

      expect(moduleSystem.__r(0)).toEqual('foo');
    });

    it('exports values correctly via the exports variable', () => {
      createModuleSystem(moduleSystem, false, '');

      createModule(
        moduleSystem,
        0,
        'index.js',
        (global, require, importDefault, importAll, module, exports) => {
          exports.foo = 'foo';
        }
      );

      expect(moduleSystem.__r(0)).toEqual({ foo: 'foo' });
    });

    it('exports an empty object by default', () => {
      createModuleSystem(moduleSystem, false, '');

      createModule(
        moduleSystem,
        0,
        'index.js',
        (global, require, importDefault, importAll, module, exports) => {
          // do nothing
        }
      );

      expect(moduleSystem.__r(0)).toEqual({});
    });

    it('has the same reference to exports and module.exports', () => {
      createModuleSystem(moduleSystem, false, '');

      createModule(
        moduleSystem,
        0,
        'index.js',
        (global, require, importDefault, importAll, module, exports) => {
          module.exports.a = 'test';
          exports.b = 'test2';
        }
      );

      expect(moduleSystem.__r(0)).toEqual({ a: 'test', b: 'test2' });
    });

    it('exposes the verboseName in dev mode', (done) => {
      createModuleSystem(moduleSystem, true, '');

      createModule(moduleSystem, 0, 'index.js', (global, require) => {
        expect(require.getModules().get(0).verboseName).toEqual('index.js');
        done();
      });

      moduleSystem.__r(0);
    });

    it('exposes module.id as moduleId on the module in dev mode', () => {
      createModuleSystem(moduleSystem, true, '');

      createModule(
        moduleSystem,
        1254,
        'index.js',
        (global, require, importDefault, importAll, module) => {
          module.exports = module.id;
        }
      );

      expect(moduleSystem.__r(1254)).toEqual(1254);
    });

    it('exposes module.id as moduleId on the module in prod mode', () => {
      createModuleSystem(moduleSystem, false, '');

      createModule(
        moduleSystem,
        1337,
        'index.js',
        (global, require, importDefault, importAll, module) => {
          module.exports = module.id;
        }
      );

      expect(moduleSystem.__r(1337)).toEqual(1337);
    });

    it('handles requires/exports correctly', () => {
      createModuleSystem(moduleSystem, false, '');

      createModule(
        moduleSystem,
        0,
        'foo.js',
        (global, require, importDefault, importAll, module) => {
          module.exports = require(1).bar;
        }
      );

      createModule(
        moduleSystem,
        1,
        'bar.js',
        (global, require, importDefault, importAll, module) => {
          module.exports = {
            bar: 'barExported',
          };
        }
      );

      expect(moduleSystem.__r(0)).toEqual('barExported');
    });

    it('only evaluates a module once', () => {
      createModuleSystem(moduleSystem, false, '');

      const fn = jest.fn();

      createModule(
        moduleSystem,
        0,
        'foo.js',
        (global, require, importDefault, importAll, module) => {
          fn();

          module.exports = 'my value';
        }
      );

      expect(moduleSystem.__r(0)).toEqual('my value');
      expect(moduleSystem.__r(0)).toEqual('my value');

      expect(fn.mock.calls.length).toBe(1);
    });

    it('throws when using require.context directly', () => {
      createModuleSystem(moduleSystem, false, '');
      expect(() => moduleSystem.__r.context('foobar')).toThrow(
        'The experimental Metro feature `require.context` is not enabled in your project.'
      );
    });

    it('throws an error when trying to require an unknown module', () => {
      createModuleSystem(moduleSystem, false, '');

      createModule(
        moduleSystem,
        0,
        'foo.js',
        (global, require, importDefault, importAll, module) => {
          require(99);
        }
      );

      expect(() => moduleSystem.__r(0)).toThrow('Requiring unknown module "99"');
    });

    it('throws an error when a module throws an error', () => {
      createModuleSystem(moduleSystem, false, '');

      const error = new Error('foo!');
      const factory = jest.fn((global, require, importDefault, importAll, module) => {
        throw error;
      });
      createModule(moduleSystem, 0, 'foo.js', factory);

      // First time it throws the original error.
      expect(() => moduleSystem.__r(0)).toThrowStrictEquals(error);

      // Afterwards it throws the exact same error.
      expect(() => moduleSystem.__r(0)).toThrowStrictEquals(error);

      // The module is not reevaluated.
      expect(factory).toHaveBeenCalledTimes(1);
    });

    it('can make use of the dependencyMap correctly', () => {
      createModuleSystem(moduleSystem, false, '');

      createModule(
        moduleSystem,
        0,
        'foo.js',
        (global, require, importDefault, importAll, module, exports, dependencyMap) => {
          module.exports = require(dependencyMap[0]);
        },
        [33]
      );
      createModule(
        moduleSystem,
        33,
        'foo.js',
        (global, require, importDefault, importAll, module) => {
          module.exports = 'module 33';
        }
      );

      expect(moduleSystem.__r(0)).toEqual('module 33');
    });

    // NOTE(EvanBacon): This functionality has been removed to support using strings as the module names.
    xit('allows to require verboseNames in dev mode', () => {
      createModuleSystem(moduleSystem, true, '');

      createModule(
        moduleSystem,
        0,
        'foo.js',
        (global, require, importDefault, importAll, module) => {
          module.exports = 'Hi!';
        }
      );

      expect(moduleSystem.__r('foo.js')).toEqual('Hi!');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Requiring module "foo.js" by name is only supported for debugging purposes and will BREAK IN PRODUCTION!'
      );
    });

    // NOTE(EvanBacon): This functionality has been removed to support using strings as the module names.
    xit('throws an error when requiring an incorrect verboseNames in dev mode', () => {
      createModuleSystem(moduleSystem, true, '');

      createModule(
        moduleSystem,
        0,
        'foo.js',
        (global, require, importDefault, importAll, module) => {
          module.exports = 'Hi!';
        }
      );

      expect(() => moduleSystem.__r('wrong.js')).toThrow('Unknown named module: "wrong.js"');
    });
  });

  describe('clearing require cache', () => {
    it('exposes a method', () => {
      let requireOld;
      let requireNew;

      const factory = jest.fn((global, require, importDefault, importAll, module) => {
        module.exports.name = 'foo';
      });

      function defineModule0() {
        createModule(moduleSystem, 0, 'foo.js', factory);
      }

      createModuleSystem(moduleSystem, false, '');

      // The clearing function exists.
      expect(moduleSystem.__c).toBeInstanceOf(Function);

      // Resetting the cache will make the module disappear.
      defineModule0();
      expect(() => moduleSystem.__r(0)).not.toThrow();
      moduleSystem.__c();
      expect(() => moduleSystem.__r(0)).toThrow();

      // Not resetting the cache, the same require twice returns the same instance.
      defineModule0();
      requireOld = moduleSystem.__r(0);
      requireNew = moduleSystem.__r(0);
      expect(requireOld).toBe(requireNew);

      // Resetting the cache, the same require twice will return a new instance.
      factory.mockClear();

      moduleSystem.__c();
      defineModule0();
      requireOld = moduleSystem.__r(0);

      moduleSystem.__c();
      defineModule0();
      requireNew = moduleSystem.__r(0);

      expect(requireOld).not.toBe(requireNew);
      expect(factory).toHaveBeenCalledTimes(2);

      // But they are equal in structure, because the same code was executed.
      expect(requireOld).toEqual(requireNew);
    });
  });

  describe('cyclic dependencies', () => {
    it('logs a warning when there is a cyclic dependency in dev mode', () => {
      createModuleSystem(moduleSystem, true, '');

      createModule(moduleSystem, 0, 'foo.js', (global, require) => {
        require(1);
      });

      createModule(moduleSystem, 1, 'bar.js', (global, require) => {
        require(2);
      });

      createModule(moduleSystem, 2, 'baz.js', (global, require) => {
        require(0);
      });

      const warn = console.warn;
      console.warn = jest.fn();

      moduleSystem.__r(0);
      expect(console.warn).toHaveBeenCalledWith(
        [
          'Require cycle: foo.js -> bar.js -> baz.js -> foo.js',
          '',
          'Require cycles are allowed, but can result in uninitialized values. Consider refactoring to remove the need for a cycle.',
        ].join('\n')
      );

      console.warn = warn;
    });

    it('does not log warning for cyclic dependency in ignore list', () => {
      moduleSystem.__customPrefix__requireCycleIgnorePatterns = [/foo/];
      createModuleSystem(moduleSystem, true, '__customPrefix');

      createModule(
        moduleSystem,
        0,
        'foo.js',
        (global, require) => {
          require(1);
        },
        [],
        '__customPrefix'
      );

      createModule(
        moduleSystem,
        1,
        'bar.js',
        (global, require) => {
          require(2);
        },
        [],
        '__customPrefix'
      );

      createModule(
        moduleSystem,
        2,
        'baz.js',
        (global, require) => {
          require(0);
        },
        [],
        '__customPrefix'
      );

      const warn = console.warn;
      console.warn = jest.fn();

      moduleSystem.__r(0);
      expect(console.warn).toHaveBeenCalledTimes(0);
      console.warn = warn;
    });

    it('sets the exports value to their current value', () => {
      createModuleSystem(moduleSystem, false, '');

      createModule(
        moduleSystem,
        0,
        'foo.js',
        (global, require, importDefault, importAll, module) => {
          module.exports = require(1).bar();
        }
      );

      createModule(
        moduleSystem,
        1,
        'foo.js',
        (global, require, importDefault, importAll, module) => {
          module.exports.bar = function () {
            return require(0);
          };
        }
      );

      expect(moduleSystem.__r(0)).toEqual({});
    });

    it('handles well requires on previously defined exports', () => {
      createModuleSystem(moduleSystem, false, '');

      createModule(
        moduleSystem,
        0,
        'foo.js',
        (global, require, importDefault, importAll, module) => {
          module.exports.foo = 'foo';
          module.exports.bar = require(1).bar();
          module.exports.baz = 'baz';
        }
      );

      createModule(
        moduleSystem,
        1,
        'foo.js',
        (global, require, importDefault, importAll, module) => {
          module.exports.bar = function () {
            expect(require(0).baz).not.toBeDefined();
            return require(0).foo + '-cyclic';
          };
        }
      );

      expect(moduleSystem.__r(0)).toEqual({
        bar: 'foo-cyclic',
        baz: 'baz',
        foo: 'foo',
      });
    });

    it('handles well requires when redefining module.exports', () => {
      createModuleSystem(moduleSystem, false, '');

      createModule(
        moduleSystem,
        0,
        'foo.js',
        (global, require, importDefault, importAll, module) => {
          module.exports = {
            foo: 'foo',
          };
          module.exports.bar = require(1).bar();
        }
      );

      createModule(
        moduleSystem,
        1,
        'foo.js',
        (global, require, importDefault, importAll, module) => {
          module.exports.bar = function () {
            return require(0).foo + '-cyclic';
          };
        }
      );

      expect(moduleSystem.__r(0)).toEqual({ foo: 'foo', bar: 'foo-cyclic' });
    });
  });

  describe('ES6 module support with Babel interoperability', () => {
    it('supports default imports from ES6 modules', () => {
      createModuleSystem(moduleSystem, false, '');

      createModule(
        moduleSystem,
        0,
        'foo.js',
        (global, require, importDefault, importAll, module, exports) => {
          expect(importDefault(1)).toEqual({ bar: 'bar' });
        }
      );

      createModule(
        moduleSystem,
        1,
        'bar.js',
        (global, require, importDefault, importAll, module, exports) => {
          exports.__esModule = true;
          exports.default = { bar: 'bar' };
        }
      );

      expect.assertions(1);
      moduleSystem.__r(0);
    });

    it('supports default imports from non-ES6 modules', () => {
      createModuleSystem(moduleSystem, false, '');

      createModule(
        moduleSystem,
        0,
        'foo.js',
        (global, require, importDefault, importAll, module, exports) => {
          expect(importDefault(1)).toEqual({ bar: 'bar' });
          expect(importDefault(2)).toBe(null);
        }
      );

      createModule(
        moduleSystem,
        1,
        'bar.js',
        (global, require, importDefault, importAll, module, exports) => {
          module.exports = { bar: 'bar' };
        }
      );

      createModule(
        moduleSystem,
        2,
        'bar.js',
        (global, require, importDefault, importAll, module, exports) => {
          module.exports = null;
        }
      );

      expect.assertions(2);
      moduleSystem.__r(0);
    });

    it('supports named imports', () => {
      createModuleSystem(moduleSystem, false, '');

      createModule(
        moduleSystem,
        0,
        'foo.js',
        (global, require, importDefault, importAll, module, exports) => {
          expect(require(1).bar).toBe('potato');
        }
      );

      createModule(
        moduleSystem,
        1,
        'bar.js',
        (global, require, importDefault, importAll, module, exports) => {
          module.exports.bar = 'potato';
        }
      );

      expect.assertions(1);
      moduleSystem.__r(0);
    });

    it('supports wildcard imports from ES6 modules', () => {
      createModuleSystem(moduleSystem, false, '');

      createModule(
        moduleSystem,
        0,
        'foo.js',
        (global, require, importDefault, importAll, module, exports) => {
          expect(importAll(1)).toMatchObject({ default: 'bar', baz: 'baz' });
        }
      );

      createModule(
        moduleSystem,
        1,
        'bar.js',
        (global, require, importDefault, importAll, module, exports) => {
          exports.__esModule = true;
          exports.default = 'bar';
          exports.baz = 'baz';
        }
      );

      expect.assertions(1);
      moduleSystem.__r(0);
    });

    it('supports wildcard imports from non-ES6 modules', () => {
      createModuleSystem(moduleSystem, false, '');

      createModule(
        moduleSystem,
        0,
        'foo.js',
        (global, require, importDefault, importAll, module, exports) => {
          expect(importAll(1).default).toBeInstanceOf(Function);
          expect(importAll(1).default).toBe(importDefault(1));
          expect(importAll(1).bar).toBe('bar');
        }
      );

      createModule(
        moduleSystem,
        1,
        'bar.js',
        (global, require, importDefault, importAll, module, exports) => {
          module.exports = function bar() {};
          module.exports.bar = 'bar';
        }
      );

      expect.assertions(3);
      moduleSystem.__r(0);
    });
  });

  describe('packModuleId and unpackModuleId', () => {
    it('packModuleId and unpackModuleId are inverse operations', () => {
      createModuleSystem(moduleSystem, false, '');

      const resultSet = new Set();
      // eslint-disable-next-line no-bitwise
      for (const id of [0, 1, (1 << 16) - 1, 1 << 16, (1 << 16) + 1]) {
        const result = moduleSystem.__r.unpackModuleId(id);
        expect(resultSet.has(result)).not.toBe(true);
        resultSet.add(result);
        expect(moduleSystem.__r.packModuleId(result)).toBe(id);
      }
    });
  });

  describe('hot reloading', () => {
    it('is disabled in production', () => {
      createModuleSystem(moduleSystem, false, '');
      createModule(
        moduleSystem,
        0,
        'foo.js',
        (global, require, importDefault, importAll, module, exports) => {
          expect(module.hot).toBe(undefined);
        }
      );
      expect.assertions(1);
      moduleSystem.__r(0);
    });

    // This tests the legacy module.hot.accept API.
    // We don't use it for Fast Refresh but there might be external consumers.
    it('propagates a hot update to closest accepted module for legacy API', () => {
      let log: string[] = [];
      createModuleSystem(moduleSystem, true, '');
      createModule(
        moduleSystem,
        0,
        'foo.js',
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init FooV1');
          require(1);
          // This module accepts itself:
          module.hot.accept();
        }
      );
      createModule(
        moduleSystem,
        1,
        'bar.js',
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init BarV1');
        }
      );
      moduleSystem.__r(0);
      expect(log).toEqual(['init FooV1', 'init BarV1']);
      log = [];

      // We edited Bar, but it doesn't accept.
      // So we expect it to re-run together with Foo which does.
      moduleSystem.__accept(
        1,
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init BarV2');
        },
        [],
        { 1: [0], 0: [] },
        undefined
      );
      expect(log).toEqual(['init BarV2', 'init FooV1']);
      log = [];

      // We edited Bar, but it doesn't accept.
      // So we expect it to re-run together with Foo which does.
      moduleSystem.__accept(
        1,
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init BarV3');
        },
        [],
        { 1: [0], 0: [] },
        undefined
      );
      expect(log).toEqual(['init BarV3', 'init FooV1']);
      log = [];
    });

    // This tests the legacy module.hot.accept API.
    // We don't use it for Fast Refresh but there might be external consumers.
    it('runs custom accept and dispose handlers for the legacy API', () => {
      let log: string[] = [];
      createModuleSystem(moduleSystem, true, '');
      createModule(
        moduleSystem,
        0,
        'foo.js',
        (global, require, importDefault, importAll, module, exports) => {
          module.hot.accept(() => {
            log.push('accept V1');
          });
          module.hot.dispose(() => {
            log.push('dispose V1');
          });
        }
      );
      moduleSystem.__r(0);
      expect(log).toEqual([]);
      log = [];

      moduleSystem.__accept(
        0,
        (global, require, importDefault, importAll, module, exports) => {
          module.hot.accept(() => {
            log.push('accept V2');
          });
          module.hot.dispose(() => {
            log.push('dispose V2');
          });
        },
        [],
        { 0: [] },
        undefined
      );

      // TODO: this is existing behavior but it deviates from webpack.
      // In webpack, the "accept" callback only fires on errors in module init.
      // This is because otherwise you might as well put your code directly
      // into the module initialization path.
      // We might want to either align with webpack or intentionally deviate
      // but for now let's test the existing behavior.
      expect(log).toEqual(['dispose V1', 'accept V2']);
      log = [];
    });

    it('re-runs accepted modules', () => {
      let log: string[] = [];
      createModuleSystem(moduleSystem, true, '');
      const Refresh = createReactRefreshMock(moduleSystem);
      createModule(
        moduleSystem,
        0,
        'foo.js',
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init FooV1');
          require(1);
        }
      );
      createModule(
        moduleSystem,
        1,
        'bar.js',
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init BarV1');
          // This module exports a component:
          module.exports = function Bar() {};
        }
      );
      moduleSystem.__r(0);
      expect(log).toEqual(['init FooV1', 'init BarV1']);
      log = [];

      // We only edited Bar, and it accepted.
      // So we expect it to re-run alone.
      moduleSystem.__accept(
        1,
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init BarV2');
          module.exports = function Bar() {};
        },
        [],
        { 1: [0], 0: [] },
        undefined
      );
      expect(log).toEqual(['init BarV2']);
      log = [];

      // We only edited Bar, and it accepted.
      // So we expect it to re-run alone.
      moduleSystem.__accept(
        1,
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init BarV3');
          module.exports = function Bar() {};
        },
        [],
        { 1: [0], 0: [] },
        undefined
      );
      expect(log).toEqual(['init BarV3']);
      log = [];
      jest.runAllTimers();
      expect(Refresh.performReactRefresh).toHaveBeenCalled();
      expect(Refresh.performFullRefresh).not.toHaveBeenCalled();
    });

    it('propagates a hot update to closest accepted module', () => {
      let log: string[] = [];
      createModuleSystem(moduleSystem, true, '');
      const Refresh = createReactRefreshMock(moduleSystem);
      createModule(
        moduleSystem,
        0,
        'foo.js',
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init FooV1');
          require(1);
          // Exporting a component marks it as auto-accepting.
          module.exports = function Foo() {};
        }
      );
      createModule(
        moduleSystem,
        1,
        'bar.js',
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init BarV1');
        }
      );
      moduleSystem.__r(0);
      expect(log).toEqual(['init FooV1', 'init BarV1']);
      log = [];

      // We edited Bar, but it doesn't accept.
      // So we expect it to re-run together with Foo which does.
      moduleSystem.__accept(
        1,
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init BarV2');
        },
        [],
        { 1: [0], 0: [] },
        undefined
      );
      expect(log).toEqual(['init BarV2', 'init FooV1']);
      log = [];

      // We edited Bar, but it doesn't accept.
      // So we expect it to re-run together with Foo which does.
      moduleSystem.__accept(
        1,
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init BarV3');
        },
        [],
        { 1: [0], 0: [] },
        undefined
      );
      expect(log).toEqual(['init BarV3', 'init FooV1']);
      log = [];

      // We edited Bar so that it accepts itself.
      // We still re-run Foo because the exports of Bar changed.
      moduleSystem.__accept(
        1,
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init BarV3');
          // Exporting a component marks it as auto-accepting.
          module.exports = function Bar() {};
        },
        [],
        { 1: [0], 0: [] },
        undefined
      );
      expect(log).toEqual(['init BarV3', 'init FooV1']);
      log = [];

      // Further edits to Bar don't re-run Foo.
      moduleSystem.__accept(
        1,
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init BarV4');
          module.exports = function Bar() {};
        },
        [],
        { 1: [0], 0: [] },
        undefined
      );
      expect(log).toEqual(['init BarV4']);
      log = [];
      jest.runAllTimers();
      expect(Refresh.performReactRefresh).toHaveBeenCalled();
      expect(Refresh.performFullRefresh).not.toHaveBeenCalled();
    });

    it('propagates hot update to all inverse dependencies', () => {
      let log: string[] = [];
      createModuleSystem(moduleSystem, true, '');
      const Refresh = createReactRefreshMock(moduleSystem);

      // This is the module graph:
      //        MiddleA*
      //     /            \
      // Root* - MiddleB*  - Leaf
      //     \
      //        MiddleC
      //
      // * - accepts update
      //
      // We expect that editing Leaf will propagate to
      // MiddleA and MiddleB both of which can handle updates.

      createModule(
        moduleSystem,
        0,
        'root.js',
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init RootV1');
          require(1);
          require(2);
          require(3);
          module.exports = function Root() {};
        }
      );
      createModule(
        moduleSystem,
        1,
        'middleA.js',
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init MiddleAV1');
          require(4); // Import leaf
          module.exports = function MiddleA() {};
        }
      );
      createModule(
        moduleSystem,
        2,
        'middleB.js',
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init MiddleBV1');
          require(4); // Import leaf
          module.exports = function MiddleB() {};
        }
      );
      createModule(
        moduleSystem,
        3,
        'middleC.js',
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init MiddleCV1');
          // This one doesn't import leaf and also
          // doesn't export a component (so it doesn't accept updates).
          module.exports = {};
        }
      );
      createModule(
        moduleSystem,
        4,
        'leaf.js',
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init LeafV1');
          // Doesn't accept its own updates; they will propagate.
          module.exports = {};
        }
      );
      moduleSystem.__r(0);
      expect(log).toEqual([
        'init RootV1',
        'init MiddleAV1',
        'init LeafV1',
        'init MiddleBV1',
        'init MiddleCV1',
      ]);
      log = [];

      // We edited Leaf, but it doesn't accept.
      // So we expect it to re-run together with MiddleA and MiddleB which do.
      moduleSystem.__accept(
        4,
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init LeafV2');
          module.exports = {};
        },
        [],
        // Inverse dependency map.
        {
          4: [2, 1],
          3: [0],
          2: [0],
          1: [0],
          0: [],
        },
        undefined
      );
      expect(log).toEqual(['init LeafV2', 'init MiddleAV1', 'init MiddleBV1']);
      log = [];

      // Let's try the same one more time.
      moduleSystem.__accept(
        4,
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init LeafV2');
          module.exports = {};
        },
        [],
        // Inverse dependency map.
        {
          4: [2, 1],
          3: [0],
          2: [0],
          1: [0],
          0: [],
        },
        undefined
      );
      expect(log).toEqual(['init LeafV2', 'init MiddleAV1', 'init MiddleBV1']);
      log = [];

      // Now edit MiddleB. It should accept and re-run alone.
      moduleSystem.__accept(
        2,
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init MiddleBV2');
          require(4);
          module.exports = function MiddleB() {};
        },
        [],
        // Inverse dependency map.
        {
          4: [2, 1],
          3: [0],
          2: [0],
          1: [0],
          0: [],
        },
        undefined
      );
      expect(log).toEqual(['init MiddleBV2']);
      log = [];

      // Finally, edit MiddleC. It didn't accept so it should bubble to Root.
      moduleSystem.__accept(
        3,
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init MiddleCV2');
          module.exports = {};
        },
        [],
        // Inverse dependency map.
        {
          4: [2, 1],
          3: [0],
          2: [0],
          1: [0],
          0: [],
        },
        undefined
      );
      expect(log).toEqual(['init MiddleCV2', 'init RootV1']);
      log = [];
      jest.runAllTimers();
      expect(Refresh.performReactRefresh).toHaveBeenCalled();
      expect(Refresh.performFullRefresh).not.toHaveBeenCalled();
    });

    it('runs dependencies before dependents', () => {
      let log: string[] = [];
      createModuleSystem(moduleSystem, true, '');
      const Refresh = createReactRefreshMock(moduleSystem);

      // This is the module graph:
      //        MiddleA* ----
      //     /      |         \
      // Root    MiddleB ----- Leaf
      //
      // * - refresh boundary (exports a component)
      //
      // We expect that editing Leaf will propagate to
      // MiddleA which is a Refresh Boundary.
      //
      // However, it's essential that code for MiddleB executes *before* MiddleA on updates.

      createModule(
        moduleSystem,
        0,
        'root.js',
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init RootV1');
          require(1);
          module.exports = function Root() {};
        }
      );
      createModule(
        moduleSystem,
        1,
        'middleA.js',
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init MiddleAV1');
          const L = require(3);
          const MB = require(2);
          module.exports = function MiddleA() {
            return L * MB;
          };
        }
      );
      createModule(
        moduleSystem,
        2,
        'middleB.js',
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init MiddleBV1');
          const L = require(3); // Import leaf
          module.exports = L;
        }
      );
      createModule(
        moduleSystem,
        3,
        'leaf.js',
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init LeafV1');
          // Doesn't accept its own updates; they will propagate.
          module.exports = 2;
        }
      );
      moduleSystem.__r(0);
      expect(log).toEqual(['init RootV1', 'init MiddleAV1', 'init LeafV1', 'init MiddleBV1']);
      log = [];

      // We edited Leaf, but it doesn't accept.
      // So we expect it to re-run together with MiddleA and MiddleB which do.
      moduleSystem.__accept(
        3,
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init LeafV2');
          module.exports = 3;
        },
        [],
        // Inverse dependency map.
        {
          3: [2, 1],
          2: [1],
          1: [0],
          0: [],
        },
        undefined
      );

      expect(log).toEqual(['init LeafV2', 'init MiddleBV1', 'init MiddleAV1']);
      log = [];

      // This is achieved by running dependencies in a topological sort order
      expect(moduleSystem.__r(1)()).toBe(9); // Ensure edit propagated consistently

      jest.runAllTimers();
      expect(Refresh.performReactRefresh).toHaveBeenCalled();
      expect(Refresh.performFullRefresh).not.toHaveBeenCalled();
    });

    it('provides fresh value for module.exports in parents', () => {
      let log: string[] = [];
      createModuleSystem(moduleSystem, true, '');
      const Refresh = createReactRefreshMock(moduleSystem);
      createModule(
        moduleSystem,
        0,
        'foo.js',
        (global, require, importDefault, importAll, module, exports) => {
          const BarValue = require(1);
          log.push('init FooV1 with BarValue = ' + BarValue);
          // This module accepts itself:
          module.exports = function Foo() {};
        }
      );
      createModule(
        moduleSystem,
        1,
        'bar.js',
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init BarV1');
          module.exports = 1;
          // This module will propagate to the parent.
        }
      );
      moduleSystem.__r(0);
      expect(log).toEqual(['init BarV1', 'init FooV1 with BarValue = 1']);
      log = [];

      // We edited Bar, but it doesn't accept.
      // So we expect it to re-run together with Foo which does.
      moduleSystem.__accept(
        1,
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init BarV2');
          module.exports = 2;
        },
        [],
        { 1: [0], 0: [] },
        undefined
      );
      expect(log).toEqual(['init BarV2', 'init FooV1 with BarValue = 2']);
      log = [];

      // Let's try this again.
      moduleSystem.__accept(
        1,
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init BarV3');
          module.exports = 3;
        },
        [],
        { 1: [0], 0: [] },
        undefined
      );
      expect(log).toEqual(['init BarV3', 'init FooV1 with BarValue = 3']);
      log = [];

      // Now let's edit the parent which accepts itself.
      moduleSystem.__accept(
        0,
        (global, require, importDefault, importAll, module, exports) => {
          const BarValue = require(1);
          log.push('init FooV2 with BarValue = ' + BarValue);
          module.exports = function Foo() {};
        },
        [],
        { 1: [0], 0: [] },
        undefined
      );
      // It should see a fresh version of the child.
      expect(log).toEqual(['init FooV2 with BarValue = 3']);
      log = [];

      // Verify editing the child didn't break after parent update.
      moduleSystem.__accept(
        1,
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init BarV4');
          module.exports = 4;
        },
        [],
        { 1: [0], 0: [] },
        undefined
      );
      expect(log).toEqual(['init BarV4', 'init FooV2 with BarValue = 4']);
      log = [];
      jest.runAllTimers();
      expect(Refresh.performReactRefresh).toHaveBeenCalled();
      expect(Refresh.performFullRefresh).not.toHaveBeenCalled();
    });

    it('provides fresh value for exports.* in parents', () => {
      let log: string[] = [];
      createModuleSystem(moduleSystem, true, '');
      const Refresh = createReactRefreshMock(moduleSystem);
      createModule(
        moduleSystem,
        0,
        'foo.js',
        (global, require, importDefault, importAll, module, exports) => {
          const BarValue = require(1).value;
          log.push('init FooV1 with BarValue = ' + BarValue);
          // This module accepts itself:
          exports.Bar = function Bar() {};
        }
      );
      createModule(
        moduleSystem,
        1,
        'bar.js',
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init BarV1');
          exports.value = 1;
          // This module will propagate to the parent.
        }
      );
      moduleSystem.__r(0);
      expect(log).toEqual(['init BarV1', 'init FooV1 with BarValue = 1']);
      log = [];

      // We edited Bar, but it doesn't accept.
      // So we expect it to re-run together with Foo which does.
      moduleSystem.__accept(
        1,
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init BarV2');
          exports.value = 2;
        },
        [],
        { 1: [0], 0: [] },
        undefined
      );
      expect(log).toEqual(['init BarV2', 'init FooV1 with BarValue = 2']);
      log = [];

      // Let's try this again.
      moduleSystem.__accept(
        1,
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init BarV3');
          exports.value = 3;
        },
        [],
        { 1: [0], 0: [] },
        undefined
      );
      expect(log).toEqual(['init BarV3', 'init FooV1 with BarValue = 3']);
      log = [];

      // Now let's edit the parent which accepts itself.
      moduleSystem.__accept(
        0,
        (global, require, importDefault, importAll, module, exports) => {
          const BarValue = require(1).value;
          log.push('init FooV2 with BarValue = ' + BarValue);
          exports.Bar = function Bar() {};
        },
        [],
        { 1: [0], 0: [] },
        undefined
      );
      // It should see a fresh version of the child.
      expect(log).toEqual(['init FooV2 with BarValue = 3']);
      log = [];

      // Verify editing the child didn't break after parent update.
      moduleSystem.__accept(
        1,
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init BarV4');
          exports.value = 4;
        },
        [],
        { 1: [0], 0: [] },
        undefined
      );
      expect(log).toEqual(['init BarV4', 'init FooV2 with BarValue = 4']);
      log = [];
      jest.runAllTimers();
      expect(Refresh.performReactRefresh).toHaveBeenCalled();
      expect(Refresh.performFullRefresh).not.toHaveBeenCalled();
    });

    it('provides fresh value for ES6 named import in parents', () => {
      let log: string[] = [];
      createModuleSystem(moduleSystem, true, '');
      const Refresh = createReactRefreshMock(moduleSystem);
      createModule(
        moduleSystem,
        0,
        'foo.js',
        (global, require, importDefault, importAll, module, exports) => {
          const BarValue = importAll(1).value;
          log.push('init FooV1 with BarValue = ' + BarValue);
          // This module accepts itself:
          exports.__esModule = true;
          exports.Foo = function Foo() {};
        }
      );
      createModule(
        moduleSystem,
        1,
        'bar.js',
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init BarV1');
          exports.__esModule = true;
          exports.value = 1;
          // This module will propagate to the parent.
        }
      );
      moduleSystem.__r(0);
      expect(log).toEqual(['init BarV1', 'init FooV1 with BarValue = 1']);
      log = [];

      // We edited Bar, but it doesn't accept.
      // So we expect it to re-run together with Foo which does.
      moduleSystem.__accept(
        1,
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init BarV2');
          exports.__esModule = true;
          exports.value = 2;
        },
        [],
        { 1: [0], 0: [] },
        undefined
      );
      expect(log).toEqual(['init BarV2', 'init FooV1 with BarValue = 2']);
      log = [];

      // Let's try this again.
      moduleSystem.__accept(
        1,
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init BarV3');
          exports.__esModule = true;
          exports.value = 3;
        },
        [],
        { 1: [0], 0: [] },
        undefined
      );
      expect(log).toEqual(['init BarV3', 'init FooV1 with BarValue = 3']);
      log = [];

      // Now let's edit the parent which accepts itself.
      moduleSystem.__accept(
        0,
        (global, require, importDefault, importAll, module, exports) => {
          const BarValue = importAll(1).value;
          log.push('init FooV2 with BarValue = ' + BarValue);
          exports.__esModule = true;
          exports.Foo = function Foo() {};
        },
        [],
        { 1: [0], 0: [] },
        undefined
      );
      // It should see a fresh version of the child.
      expect(log).toEqual(['init FooV2 with BarValue = 3']);
      log = [];

      // Verify editing the child didn't break after parent update.
      moduleSystem.__accept(
        1,
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init BarV4');
          exports.__esModule = true;
          exports.value = 4;
        },
        [],
        { 1: [0], 0: [] },
        undefined
      );
      expect(log).toEqual(['init BarV4', 'init FooV2 with BarValue = 4']);
      log = [];
      jest.runAllTimers();
      expect(Refresh.performReactRefresh).toHaveBeenCalled();
      expect(Refresh.performFullRefresh).not.toHaveBeenCalled();
    });

    it('provides fresh value for ES6 default import in parents', () => {
      let log: string[] = [];
      createModuleSystem(moduleSystem, true, '');
      const Refresh = createReactRefreshMock(moduleSystem);
      createModule(
        moduleSystem,
        0,
        'foo.js',
        (global, require, importDefault, importAll, module, exports) => {
          const BarValue = importDefault(1);
          log.push('init FooV1 with BarValue = ' + BarValue);
          // This module accepts itself:
          exports.__esModule = true;
          exports.default = function Foo() {};
        }
      );
      createModule(
        moduleSystem,
        1,
        'bar.js',
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init BarV1');
          exports.__esModule = true;
          exports.default = 1;
          // This module will propagate to the parent.
        }
      );
      moduleSystem.__r(0);
      expect(log).toEqual(['init BarV1', 'init FooV1 with BarValue = 1']);
      log = [];

      // We edited Bar, but it doesn't accept.
      // So we expect it to re-run together with Foo which does.
      moduleSystem.__accept(
        1,
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init BarV2');
          exports.__esModule = true;
          exports.default = 2;
        },
        [],
        { 1: [0], 0: [] },
        undefined
      );
      expect(log).toEqual(['init BarV2', 'init FooV1 with BarValue = 2']);
      log = [];

      // Let's try this again.
      moduleSystem.__accept(
        1,
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init BarV3');
          exports.__esModule = true;
          exports.default = 3;
        },
        [],
        { 1: [0], 0: [] },
        undefined
      );
      expect(log).toEqual(['init BarV3', 'init FooV1 with BarValue = 3']);
      log = [];

      // Now let's edit the parent which accepts itself.
      moduleSystem.__accept(
        0,
        (global, require, importDefault, importAll, module, exports) => {
          const BarValue = importDefault(1);
          log.push('init FooV2 with BarValue = ' + BarValue);
          exports.__esModule = true;
          exports.default = function Foo() {};
        },
        [],
        { 1: [0], 0: [] },
        undefined
      );
      // It should see a fresh version of the child.
      expect(log).toEqual(['init FooV2 with BarValue = 3']);
      log = [];

      // Verify editing the child didn't break after parent update.
      moduleSystem.__accept(
        1,
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init BarV4');
          exports.__esModule = true;
          exports.default = 4;
        },
        [],
        { 1: [0], 0: [] },
        undefined
      );
      expect(log).toEqual(['init BarV4', 'init FooV2 with BarValue = 4']);
      log = [];
      jest.runAllTimers();
      expect(Refresh.performReactRefresh).toHaveBeenCalled();
      expect(Refresh.performFullRefresh).not.toHaveBeenCalled();
    });

    it('stops update propagation after module-level errors', () => {
      let redboxErrors: any[] = [];
      moduleSystem.ErrorUtils = {
        reportFatalError(e) {
          redboxErrors.push(e);
        },
      };

      let log: string[] = [];
      createModuleSystem(moduleSystem, true, '');
      const Refresh = createReactRefreshMock(moduleSystem);
      createModule(
        moduleSystem,
        0,
        'foo.js',
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init FooV1');
          require(1);
          module.exports = function Foo() {};
        }
      );
      createModule(
        moduleSystem,
        1,
        'bar.js',
        (global, require, importDefault, importAll, module, exports) => {
          module.exports = 'V1';
          log.push('init BarV1');
          // This module normally propagates to the parent.
        }
      );
      moduleSystem.__r(0);
      expect(log).toEqual(['init FooV1', 'init BarV1']);
      expect(redboxErrors).toHaveLength(0);
      log = [];
      redboxErrors = [];

      // We only edited Bar.
      // Normally it would propagate to the parent.
      // But the error should stop the propagation early.
      moduleSystem.__accept(
        1,
        (global, require, importDefault, importAll, module, exports) => {
          module.exports = 'V2';
          log.push('init BarV2');
          throw new Error('init error during BarV2');
        },
        [],
        { 1: [0], 0: [] },
        undefined
      );

      expect(log).toEqual(['init BarV2']); // No 'init FooV1'
      expect(redboxErrors).toHaveLength(1);
      expect(redboxErrors[0].message).toBe('init error during BarV2');
      log = [];
      redboxErrors = [];

      // Because of the failure, we keep seeing the previous export.
      expect(moduleSystem.__r(1)).toBe('V1');
      expect(log).toHaveLength(0);
      expect(redboxErrors).toHaveLength(0);

      // Let's make another error.
      moduleSystem.__accept(
        1,
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init BarV3');
          throw new Error('init error during BarV3');
        },
        [],
        { 1: [0], 0: [] },
        undefined
      );

      expect(log).toEqual(['init BarV3']);
      expect(redboxErrors).toHaveLength(1);
      expect(redboxErrors[0].message).toBe('init error during BarV3');
      log = [];
      redboxErrors = [];

      // Because of the failure, we keep seeing the last successful export.
      expect(moduleSystem.__r(1)).toBe('V1');
      expect(log).toHaveLength(0);
      expect(redboxErrors).toHaveLength(0);

      // Finally, let's fix the code.
      moduleSystem.__accept(
        1,
        (global, require, importDefault, importAll, module, exports) => {
          module.exports = 'V3';
          log.push('init BarV3');
          // This module propagates to the parent.
        },
        [],
        { 1: [0], 0: [] },
        undefined
      );
      expect(log).toEqual(['init BarV3', 'init FooV1']); // Includes the parent.
      expect(redboxErrors).toHaveLength(0);
      log = [];
      redboxErrors = [];

      // We should now see the "new" exports.
      expect(moduleSystem.__r(1)).toBe('V3');
      expect(log).toHaveLength(0);
      expect(redboxErrors).toHaveLength(0);

      jest.runAllTimers();
      expect(Refresh.performReactRefresh).toHaveBeenCalled();
      expect(Refresh.performFullRefresh).not.toHaveBeenCalled();
    });

    it('can continue hot updates after module-level errors with module.exports', () => {
      let redboxErrors: any[] = [];
      moduleSystem.ErrorUtils = {
        reportFatalError(e) {
          redboxErrors.push(e);
        },
      };

      let log: string[] = [];
      createModuleSystem(moduleSystem, true, '');
      const Refresh = createReactRefreshMock(moduleSystem);
      createModule(
        moduleSystem,
        0,
        'foo.js',
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init FooV1');
          require(1);
        }
      );
      createModule(
        moduleSystem,
        1,
        'bar.js',
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init BarV1');
          // This module accepts itself:
          module.exports = function BarV1() {};
        }
      );
      moduleSystem.__r(0);
      expect(log).toEqual(['init FooV1', 'init BarV1']);
      expect(redboxErrors).toHaveLength(0);
      log = [];
      redboxErrors = [];

      // We only edited Bar, and it accepted.
      // So we expect it to re-run alone.
      moduleSystem.__accept(
        1,
        (global, require, importDefault, importAll, module, exports) => {
          module.exports = function BarV2() {};
          log.push('init BarV2');
          throw new Error('init error during BarV2');
        },
        [],
        { 1: [0], 0: [] },
        undefined
      );

      expect(log).toEqual(['init BarV2']);
      expect(redboxErrors).toHaveLength(1);
      expect(redboxErrors[0].message).toBe('init error during BarV2');
      log = [];
      redboxErrors = [];

      // Because of the failure, we keep seeing the previous export.
      expect(moduleSystem.__r(1).name).toBe('BarV1');
      expect(log).toHaveLength(0);
      expect(redboxErrors).toHaveLength(0);

      // Let's make another error.
      moduleSystem.__accept(
        1,
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init BarV3');
          throw new Error('init error during BarV3');
        },
        [],
        { 1: [0], 0: [] },
        undefined
      );

      expect(log).toEqual(['init BarV3']);
      expect(redboxErrors).toHaveLength(1);
      expect(redboxErrors[0].message).toBe('init error during BarV3');
      log = [];
      redboxErrors = [];

      // Because of the failure, we keep seeing the last successful export.
      expect(moduleSystem.__r(1).name).toBe('BarV1');
      expect(log).toHaveLength(0);
      expect(redboxErrors).toHaveLength(0);

      // Finally, let's fix the code.
      moduleSystem.__accept(
        1,
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init BarV3');
          // This module accepts itself:
          module.exports = function BarV3() {};
        },
        [],
        { 1: [0], 0: [] },
        undefined
      );
      expect(log).toEqual(['init BarV3']);
      expect(redboxErrors).toHaveLength(0);
      log = [];
      redboxErrors = [];

      // We should now see the "new" exports.
      expect(moduleSystem.__r(1).name).toBe('BarV3');
      expect(log).toHaveLength(0);
      expect(redboxErrors).toHaveLength(0);

      jest.runAllTimers();
      expect(Refresh.performReactRefresh).toHaveBeenCalled();
      expect(Refresh.performFullRefresh).not.toHaveBeenCalled();
    });

    it('can continue hot updates after module-level errors with ES6 exports', () => {
      let redboxErrors: any[] = [];
      moduleSystem.ErrorUtils = {
        reportFatalError(e) {
          redboxErrors.push(e);
        },
      };

      let log: string[] = [];
      createModuleSystem(moduleSystem, true, '');
      const Refresh = createReactRefreshMock(moduleSystem);
      createModule(
        moduleSystem,
        0,
        'foo.js',
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init FooV1');
          importDefault(1);
        }
      );
      createModule(
        moduleSystem,
        1,
        'bar.js',
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init BarV1');
          // This module accepts itself:
          exports.__esModule = true;
          exports.default = function BarV1() {};
        }
      );
      moduleSystem.__r(0);
      expect(log).toEqual(['init FooV1', 'init BarV1']);
      expect(redboxErrors).toHaveLength(0);
      log = [];
      redboxErrors = [];

      // We only edited Bar, and it accepted.
      // So we expect it to re-run alone.
      moduleSystem.__accept(
        1,
        (global, require, importDefault, importAll, module, exports) => {
          exports.default = function BarV2() {};
          log.push('init BarV2');
          throw new Error('init error during BarV2');
        },
        [],
        { 1: [0], 0: [] },
        undefined
      );

      expect(log).toEqual(['init BarV2']);
      expect(redboxErrors).toHaveLength(1);
      expect(redboxErrors[0].message).toBe('init error during BarV2');
      log = [];
      redboxErrors = [];

      // Because of the failure, we keep seeing the previous export.
      expect(moduleSystem.__r.importDefault(1).name).toBe('BarV1');
      expect(log).toHaveLength(0);
      expect(redboxErrors).toHaveLength(0);

      // Let's make another error.
      moduleSystem.__accept(
        1,
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init BarV3');
          throw new Error('init error during BarV3');
        },
        [],
        { 1: [0], 0: [] },
        undefined
      );

      expect(log).toEqual(['init BarV3']);
      expect(redboxErrors).toHaveLength(1);
      expect(redboxErrors[0].message).toBe('init error during BarV3');
      log = [];
      redboxErrors = [];

      // Because of the failure, we keep seeing the last successful export.
      expect(moduleSystem.__r.importDefault(1).name).toBe('BarV1');
      expect(log).toHaveLength(0);
      expect(redboxErrors).toHaveLength(0);

      // Finally, let's fix the code.
      moduleSystem.__accept(
        1,
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init BarV3');
          // This module accepts itself:
          exports.__esModule = true;
          exports.default = function BarV3() {};
        },
        [],
        { 1: [0], 0: [] },
        undefined
      );
      expect(log).toEqual(['init BarV3']);
      expect(redboxErrors).toHaveLength(0);
      log = [];
      redboxErrors = [];

      // We should now see the "new" exports.
      expect(moduleSystem.__r.importDefault(1).name).toBe('BarV3');
      expect(log).toHaveLength(0);
      expect(redboxErrors).toHaveLength(0);

      jest.runAllTimers();
      expect(Refresh.performReactRefresh).toHaveBeenCalled();
      expect(Refresh.performFullRefresh).not.toHaveBeenCalled();
    });

    it('does not accumulate stale exports over time', () => {
      let log: string[] = [];
      createModuleSystem(moduleSystem, true, '');
      const Refresh = createReactRefreshMock(moduleSystem);
      createModule(
        moduleSystem,
        0,
        'foo.js',
        (global, require, importDefault, importAll, module, exports) => {
          const BarExports = require(1);
          log.push('init FooV1 with BarExports = ' + JSON.stringify(BarExports));
          // This module accepts itself:
          module.exports = function Foo() {};
        }
      );
      createModule(
        moduleSystem,
        1,
        'bar.js',
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init BarV1');
          exports.a = 1;
          exports.b = 2;
          // This module will propagate to the parent.
        }
      );
      moduleSystem.__r(0);
      expect(log).toEqual(['init BarV1', 'init FooV1 with BarExports = {"a":1,"b":2}']);
      log = [];

      moduleSystem.__accept(
        1,
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init BarV2');
          // These are completely different exports:
          exports.c = 3;
          exports.d = 4;
        },
        [],
        { 1: [0], 0: [] },
        undefined
      );
      // Make sure we don't see {a, b} anymore.
      expect(log).toEqual(['init BarV2', 'init FooV1 with BarExports = {"c":3,"d":4}']);
      log = [];

      // Also edit the parent and verify the same again.
      moduleSystem.__accept(
        0,
        (global, require, importDefault, importAll, module, exports) => {
          const BarExports = require(1);
          log.push('init FooV2 with BarExports = ' + JSON.stringify(BarExports));
          // This module accepts itself:
          module.exports = function Foo() {};
        },
        [],
        { 1: [0], 0: [] },
        undefined
      );
      expect(log).toEqual(['init FooV2 with BarExports = {"c":3,"d":4}']);
      log = [];

      // Temporarily crash the child.
      expect(() => {
        moduleSystem.__accept(
          1,
          (global, require, importDefault, importAll, module, exports) => {
            throw new Error('oh no');
          },
          [],
          { 1: [0], 0: [] },
          undefined
        );
      }).toThrow('oh no');
      expect(log).toEqual([]);
      log = [];

      // Try one last time to edit the child.
      moduleSystem.__accept(
        1,
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init BarV3');
          // These are completely different exports:
          exports.e = 5;
          exports.f = 6;
        },
        [],
        { 1: [0], 0: [] },
        undefined
      );
      expect(log).toEqual(['init BarV3', 'init FooV2 with BarExports = {"e":5,"f":6}']);
      log = [];
      jest.runAllTimers();
      expect(Refresh.performReactRefresh).toHaveBeenCalled();
      expect(Refresh.performFullRefresh).not.toHaveBeenCalled();
    });

    it('bails out if update bubbles to the root via the only path', () => {
      let log: string[] = [];

      createModuleSystem(moduleSystem, true, '');
      const Refresh = createReactRefreshMock(moduleSystem);
      createModule(
        moduleSystem,
        0,
        'foo.js',
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init FooV1');
          require(1);
        }
      );
      createModule(
        moduleSystem,
        1,
        'bar.js',
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init BarV1');
        }
      );
      moduleSystem.__r(0);
      expect(log).toEqual(['init FooV1', 'init BarV1']);
      log = [];

      // Neither Bar nor Foo accepted, so update reached the root.
      moduleSystem.__accept(
        1,
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init BarV2');
        },
        [],
        { 1: [0], 0: [] },
        undefined
      );
      // We know that neither of them accepted, so we don't re-run them.
      expect(log).toEqual([]);
      log = [];
      jest.runAllTimers();

      // Expect full refresh.
      expect(Refresh.performReactRefresh).not.toHaveBeenCalled();
      expect(Refresh.performFullRefresh).toHaveBeenCalled();
    });

    it('bails out if the update bubbles to the root via one of the paths', () => {
      let log: string[] = [];

      createModuleSystem(moduleSystem, true, '');
      const Refresh = createReactRefreshMock(moduleSystem);
      createModule(
        moduleSystem,
        0,
        'foo.js',
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init FooV1');
          require(1);
          require(2);
        }
      );
      createModule(
        moduleSystem,
        1,
        'bar.js',
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init BarV1');
          require(3);
          module.exports = function Bar() {}; // Accepts itself
        }
      );
      createModule(
        moduleSystem,
        2,
        'baz.js',
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init BazV1');
          require(3);
          // This one doesn't accept itself, causing updates to Qux
          // to bubble through the root.
        }
      );
      createModule(
        moduleSystem,
        3,
        'qux.js',
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init QuxV1');
          // Doesn't accept itself, and only one its parent path accepts.
        }
      );

      moduleSystem.__r(0);
      expect(log).toEqual(['init FooV1', 'init BarV1', 'init QuxV1', 'init BazV1']);
      log = [];

      // Edit Bar. It should self-accept.
      moduleSystem.__accept(
        1,
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init BarV2');
          require(3);
          module.exports = function Bar() {}; // Accepts itself
        },
        [],
        { 3: [1, 2], 2: [0], 1: [0], 0: [] },
        undefined
      );
      expect(log).toEqual(['init BarV2']);
      expect(Refresh.performFullRefresh).not.toHaveBeenCalled();
      log = [];

      // Edit Qux. It should bubble. Baz accepts the update, Bar won't.
      // So this update should not even attempt to run those factories
      // because we know we'd bubble through the root if we tried.
      moduleSystem.__accept(
        3,
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init QuxV2');
          // Doesn't accept itself, and only one its parent path accepts.
        },
        [],
        { 3: [1, 2], 2: [0], 1: [0], 0: [] },
        undefined
      );
      expect(log).toEqual([]);
      log = [];

      // Expect full refresh.
      expect(Refresh.performReactRefresh).not.toHaveBeenCalled();
      expect(Refresh.performFullRefresh).toHaveBeenCalled();
    });

    it('propagates a module that stops accepting in next version', () => {
      let log: string[] = [];
      createModuleSystem(moduleSystem, true, '');
      const Refresh = createReactRefreshMock(moduleSystem);
      createModule(
        moduleSystem,
        0,
        'foo.js',
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init FooV1');
          require(1);
          module.exports = function Foo() {}; // Accept in parent
        }
      );
      createModule(
        moduleSystem,
        1,
        'bar.js',
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init BarV1');
          module.exports = function Bar() {}; // Accept in child
        }
      );
      moduleSystem.__r(0);
      expect(log).toEqual(['init FooV1', 'init BarV1']);
      log = [];

      // Now let's change the child to *not* accept itself.
      // We'll expect that now the parent will handle the evaluation.
      moduleSystem.__accept(
        1,
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init BarV2');
        },
        [],
        { 1: [0], 0: [] },
        undefined
      );
      // We re-run Bar and expect to stop there. However,
      // it didn't export a component, so we go higher.
      // We stop at Foo which currently _does_ export a component.
      expect(log).toEqual(['init BarV2', 'init FooV1']);
      log = [];

      // Change it back so that the child accepts itself.
      moduleSystem.__accept(
        1,
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init BarV2');
          module.exports = function Bar() {};
        },
        [],
        { 1: [0], 0: [] },
        undefined
      );
      // Since the export list changed, we have to re-run both the parent
      // and the child.
      expect(log).toEqual(['init BarV2', 'init FooV1']);
      log = [];
      jest.runAllTimers();
      expect(Refresh.performReactRefresh).toHaveBeenCalled();
      expect(Refresh.performFullRefresh).not.toHaveBeenCalled();

      // Bit editing the child alone now doesn't reevaluate the parent.
      moduleSystem.__accept(
        1,
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init BarV3');
          module.exports = function Bar() {};
        },
        [],
        { 1: [0], 0: [] },
        undefined
      );
      expect(log).toEqual(['init BarV3']);
      log = [];
      jest.runAllTimers();

      // Finally, edit the parent in a way that changes the export.
      // It would still be accepted on its own -- but it's incompatible
      // with the past version which didn't have two exports.
      moduleSystem.__accept(
        0,
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init FooV2');
          exports.Foo = function Foo() {};
          exports.FooFoo = function FooFoo() {};
        },
        [],
        { 1: [0], 0: [] },
        undefined
      );
      // We thought it would get accepted, but a change in exports means
      // we would have to evaluate the parents too. However, it's a root.
      expect(log).toEqual(['init FooV2']);
      log = [];
      jest.runAllTimers();
      // Therefore, we do a full reload.
      expect(Refresh.performFullRefresh).toHaveBeenCalled();
    });

    it('can replace a module before it is loaded', () => {
      let log: string[] = [];
      createModuleSystem(moduleSystem, true, '');
      const Refresh = createReactRefreshMock(moduleSystem);
      createModule(
        moduleSystem,
        0,
        'foo.js',
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init FooV1');
          exports.loadBar = function () {
            require(1);
          };
        }
      );
      createModule(
        moduleSystem,
        1,
        'bar.js',
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init BarV1');
        }
      );
      moduleSystem.__r(0);
      expect(log).toEqual(['init FooV1']);
      log = [];

      // Replace Bar before it's loaded.
      moduleSystem.__accept(
        1,
        (global, require, importDefault, importAll, module, exports) => {
          log.push('init BarV2');
        },
        [],
        { 1: [], 0: [] },
        undefined
      );
      expect(log).toEqual([]);
      log = [];

      // Now force Bar to load. It should use the latest version.
      moduleSystem.__r(0).loadBar();
      expect(log).toEqual(['init BarV2']);
      log = [];
      jest.runAllTimers();
      expect(Refresh.performReactRefresh).not.toHaveBeenCalled();
      expect(Refresh.performFullRefresh).not.toHaveBeenCalled();
    });

    it('bails out if the update involves a cycle', () => {
      // NOTE: A sufficiently clever algorithm may be able to avoid bailing out
      // in some cases, but right now this is how we handle cycles; it beats
      // leaving stale versions of updated modules in the graph.

      createModuleSystem(moduleSystem, true, '');
      const Refresh = createReactRefreshMock(moduleSystem);

      // This is the module graph:
      // ┌─────────┐      ┌─────────┐ ────▶ ┌─────────┐
      // |  Root*  | ───▶ │ MiddleA │ ◀──── | MiddleC |
      // └─────────┘      └─────────┘       └─────────┘
      //                     │ ▲              |
      //                     │ │              |
      //                     ▼ │              ▼
      //                  ┌─────────┐       ┌────────┐
      //                  | MiddleB | ────▶ |  Leaf  |
      //                  └─────────┘       └────────┘
      //
      // * - refresh boundary (exports a component)

      const ids = Object.fromEntries([
        ['root.js', 0],
        ['middleA.js', 1],
        ['middleB.js', 2],
        ['middleC.js', 3],
        ['leaf.js', 4],
      ]);

      createModule(
        moduleSystem,
        ids['root.js'],
        'root.js',
        (global, require, importDefault, importAll, module, exports) => {
          require(ids['middleA.js']);
          module.exports = function Root() {};
        }
      );
      createModule(
        moduleSystem,
        ids['middleA.js'],
        'middleA.js',
        (global, require, importDefault, importAll, module, exports) => {
          const MB = require(ids['middleB.js']);
          require(ids['middleC.js']);
          module.exports = MB;
        }
      );
      createModule(
        moduleSystem,
        ids['middleB.js'],
        'middleB.js',
        (global, require, importDefault, importAll, module, exports) => {
          require(ids['middleA.js']);
          const L = require(ids['leaf.js']); // Import leaf
          module.exports = L;
        }
      );
      createModule(
        moduleSystem,
        ids['middleC.js'],
        'middleC.js',
        (global, require, importDefault, importAll, module, exports) => {
          require(ids['middleA.js']);
          require(ids['leaf.js']);
          module.exports = 0;
        }
      );
      createModule(
        moduleSystem,
        ids['leaf.js'],
        'leaf.js',
        (global, require, importDefault, importAll, module, exports) => {
          module.exports = 'version 1';
        }
      );
      moduleSystem.__r(ids['root.js']);

      expect(moduleSystem.__r(ids['middleA.js'])).toBe('version 1');

      moduleSystem.__accept(
        ids['leaf.js'],
        (global, require, importDefault, importAll, module, exports) => {
          module.exports = 'version 2';
        },
        [],
        // Inverse dependency map.
        {
          [ids['leaf.js']]: [ids['middleC.js'], ids['middleB.js']],
          [ids['middleC.js']]: [ids['middleA.js']],
          [ids['middleB.js']]: [ids['middleA.js']],
          [ids['middleA.js']]: [ids['middleC.js'], ids['middleB.js'], ids['root.js']],
          [ids['root.js']]: [],
        },
        undefined
      );

      jest.runAllTimers();

      expect(Refresh.performReactRefresh).not.toHaveBeenCalled();
      expect(Refresh.performFullRefresh).toHaveBeenCalled();
    });

    it('performs an update when there is an unaffected cycle', () => {
      createModuleSystem(moduleSystem, true, '');
      const Refresh = createReactRefreshMock(moduleSystem);

      // This is the module graph:
      //                 ┌───────────────────┐
      //                 │                   ▼
      // ┌───────┐     ┌───┐     ┌───┐     ┌───┐
      // │ Root* │ ──▶ │ A │ ──▶ │ B │ ──▶ │ C │
      // └───────┘     └───┘     └───┘     └───┘
      //                           ▲         │
      //                           └─────────┘
      // * - refresh boundary (exports a component)

      const ids = Object.fromEntries([
        ['root.js', 0],
        ['A.js', 1],
        ['B.js', 2],
        ['C.js', 3],
      ]);

      createModule(
        moduleSystem,
        ids['root.js'],
        'root.js',
        (global, require, importDefault, importAll, module, exports) => {
          require(ids['A.js']);
          module.exports = function Root() {};
        }
      );
      createModule(
        moduleSystem,
        ids['A.js'],
        'A.js',
        (global, require, importDefault, importAll, module, exports) => {
          const B = require(ids['B.js']);
          const C = require(ids['C.js']);
          module.exports = 'A = ' + B + C + ' version 1';
        }
      );
      createModule(
        moduleSystem,
        ids['B.js'],
        'B.js',
        (global, require, importDefault, importAll, module, exports) => {
          require(ids['C.js']);
          module.exports = 'B';
        }
      );
      createModule(
        moduleSystem,
        ids['C.js'],
        'C.js',
        (global, require, importDefault, importAll, module, exports) => {
          require(ids['B.js']);
          module.exports = 'C';
        }
      );
      moduleSystem.__r(ids['root.js']);

      expect(moduleSystem.__r(ids['A.js'])).toBe('A = BC version 1');

      moduleSystem.__accept(
        ids['A.js'],
        (global, require, importDefault, importAll, module, exports) => {
          const B = require(ids['B.js']);
          const C = require(ids['C.js']);
          module.exports = 'A = ' + B + C + ' version 2';
        },
        [],
        // Inverse dependency map.
        {
          [ids['root.js']]: [],
          [ids['A.js']]: [ids['root.js']],
          [ids['B.js']]: [ids['A.js'], ids['C.js']],
          [ids['C.js']]: [ids['A.js'], ids['B.js']],
        },
        undefined
      );

      expect(moduleSystem.__r(ids['A.js'])).toBe('A = BC version 2');

      jest.runAllTimers();

      expect(Refresh.performReactRefresh).toHaveBeenCalled();
      expect(Refresh.performFullRefresh).not.toHaveBeenCalled();
    });
  });
});

function toThrowStrictEquals(received, expected) {
  let thrown: null | { value: unknown } = null;
  try {
    received();
  } catch (e) {
    thrown = { value: e };
  }
  const pass = thrown && thrown.value === expected;
  if (pass) {
    return {
      message: () =>
        `expected function not to throw ${this.utils.printExpected(expected)} but it did`,
      pass: true,
    };
  } else {
    return {
      message: () => {
        if (thrown) {
          return `expected function to throw ${this.utils.printExpected(
            expected
          )} but received ${this.utils.printReceived(thrown.value)}`;
        } else {
          return `expected function to throw ${this.utils.printExpected(
            expected
          )} but it did not throw`;
        }
      },
      pass: false,
    };
  }
}

expect.extend({
  toThrowStrictEquals,
});
