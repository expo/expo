import path from 'node:path';
import vm from 'node:vm';

import { toCommonJS } from '../transform';

const filename = path.join(__dirname, 'fixtures', 'transform.js');

function evaluate(
  code: string,
  dependencies: Record<string, unknown> = {},
  importInterop?: 'node' | 'babel'
) {
  const mod = { exports: {} as any };
  const requireDependency = (id: string) => {
    if (!Object.hasOwn(dependencies, id)) {
      throw new Error(`Unexpected require: ${id}`);
    }
    return dependencies[id];
  };
  const compiled = vm.compileFunction(toCommonJS(filename, code, importInterop), [
    'module',
    'exports',
    'require',
  ]);
  compiled(mod, mod.exports, requireDependency);
  return mod.exports;
}

describe('toCommonJS', () => {
  it('defaults to importing the whole marked CommonJS exports object', () => {
    const dependency = { __esModule: true, default: () => 'default', named: 'named' };
    const result = evaluate('import value from "dep"; module.exports = value;', {
      dep: dependency,
    });

    expect(result).toBe(dependency);
  });

  describe.each(['node', 'babel'] as const)('%s interop', (importInterop) => {
    it('imports a plain CommonJS function as the default', () => {
      const dependency = () => 'called';
      const result = evaluate(
        'import fn from "dep"; module.exports = fn();',
        { dep: dependency },
        importInterop
      );

      expect(result).toBe('called');
    });

    it('does not unwrap a default property without an __esModule marker', () => {
      const dependency = { default: () => 'default', named: 'named' };
      const result = evaluate(
        'import value from "dep"; module.exports = value;',
        { dep: dependency },
        importInterop
      );

      expect(result).toBe(dependency);
    });

    it('selects the default import of a marked CommonJS module', () => {
      const dependency = { __esModule: true, default: () => 'default', named: 'named' };
      const result = evaluate(
        'import value from "dep"; module.exports = value;',
        { dep: dependency },
        importInterop
      );

      expect(result).toBe(importInterop === 'node' ? dependency : dependency.default);
    });

    it('handles a marked CommonJS module with no default export', () => {
      const dependency = { __esModule: true, named: 'named' };
      const result = evaluate(
        'import value from "dep"; module.exports = value;',
        { dep: dependency },
        importInterop
      );

      expect(result).toBe(importInterop === 'node' ? dependency : undefined);
    });

    it('preserves named imports from marked CommonJS modules', () => {
      const result = evaluate(
        'import { named } from "dep"; module.exports = named;',
        { dep: { __esModule: true, named: 'named' } },
        importInterop
      );

      expect(result).toBe('named');
    });

    it('selects the default member of a namespace import', () => {
      const dependency = { __esModule: true, default: () => 'default', named: 'named' };
      const result = evaluate(
        'import * as ns from "dep"; module.exports = ns;',
        { dep: dependency },
        importInterop
      );

      expect(result.named).toBe('named');
      expect(result.default).toBe(importInterop === 'node' ? dependency : dependency.default);
    });

    it('selects default re-exports while preserving named re-exports', () => {
      const dependency = { __esModule: true, default: () => 'default', named: 'named' };
      const result = evaluate(
        'export { default, named } from "dep";',
        { dep: dependency },
        importInterop
      );

      expect(result.named).toBe('named');
      expect(result.default).toBe(importInterop === 'node' ? dependency : dependency.default);
    });

    it('supports imports and require of different dependencies with mixed exports', () => {
      const plugin = (config: object) => ({ ...config, pluginRan: true });
      const result = evaluate(
        `
        import imported from 'plugin';
        const helpers = require('helpers');
        export const name = helpers.name;
        exports.result = ${importInterop === 'node' ? 'imported.default' : 'imported'}(helpers);
        `,
        { plugin: { __esModule: true, default: plugin }, helpers: { name: 'test' } },
        importInterop
      );

      expect(result.name).toBe('test');
      expect(result.result).toEqual({ name: 'test', pluginRan: true });
    });

    it('handles a transformed dependency that mixes ESM and CommonJS exports', () => {
      const dependency = evaluate('export const esmValue = 1; exports.cjsValue = 2;');
      const result = evaluate(
        'import value from "dep"; module.exports = value;',
        { dep: dependency },
        importInterop
      );

      expect(dependency).toEqual({ __esModule: true, esmValue: 1, cjsValue: 2 });
      expect(result).toBe(importInterop === 'node' ? dependency : undefined);
    });
  });
});
