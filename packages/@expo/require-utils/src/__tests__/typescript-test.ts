import { stripVTControlCharacters } from 'node:util';
import * as ts from 'typescript';

import { formatDiagnostic } from '../codeframe';

describe('transpile', () => {
  beforeEach(() => {
    jest.doMock('typescript/unstable/sync', () => ({}), { virtual: true });
    jest.doMock('typescript/unstable/proto', () => ({}), { virtual: true });
  });

  afterEach(() => {
    jest.dontMock('typescript');
    jest.dontMock('typescript/unstable/sync');
    jest.dontMock('typescript/unstable/proto');
  });

  function withTranspiler(run: (transpile: typeof import('../typescript').transpile) => void) {
    jest.isolateModules(() => {
      run(require('../typescript').transpile);
    });
  }

  it('caches the fallback when TypeScript is missing', () => {
    const load = jest.fn(() => {
      throw Object.assign(new Error("Cannot find module 'typescript'"), {
        code: 'MODULE_NOT_FOUND',
      });
    });
    jest.doMock('typescript', load);
    withTranspiler((transpile) => {
      expect(transpile('', 'first.ts', 'typescript')).toBeUndefined();
      expect(transpile('', 'second.ts', 'typescript')).toBeUndefined();
      expect(load).toHaveBeenCalledTimes(1);
    });
  });

  it('bails out for TypeScript 7.0 without the synchronous API export', () => {
    jest.doMock('typescript', () => ({ version: '7.0.0' }));
    jest.doMock('typescript/unstable/sync', () => {
      throw Object.assign(new Error('Package subpath is not exported'), {
        code: 'ERR_PACKAGE_PATH_NOT_EXPORTED',
      });
    });
    withTranspiler((transpile) => {
      expect(transpile('const a: number = 1;', 'test.ts', 'typescript')).toBeUndefined();
    });
  });

  it.each(['commonjs-typescript', 'module-typescript', 'typescript'] as const)(
    'transpiles with the legacy API in %s mode',
    (format) => {
      withTranspiler((transpile) => {
        const output = transpile('export const a: number = 1;', 'test.ts', format);
        expect(output?.outputText).not.toContain(': number');
        expect(output?.outputText).toContain('sourceMappingURL=data:application/json');
        if (format === 'commonjs-typescript') {
          expect(output?.outputText).toContain('exports.a');
        } else {
          expect(output?.outputText).toContain('export const a');
        }
      });
    }
  );

  it('preserves scripts without introducing an export in preserve mode', () => {
    withTranspiler((transpile) => {
      const output = transpile('module.exports = 1 as number;', 'test.ts', 'typescript');
      expect(output?.outputText).toContain('module.exports = 1;');
      expect(output?.outputText).not.toContain('export {}');
    });
  });

  it('normalizes legacy diagnostics for code frames', () => {
    withTranspiler((transpile) => {
      const code = 'const value: = 1;';
      const output = transpile(code, 'test.ts', 'typescript');
      expect(output?.diagnostic).toEqual({
        message: 'Type expected.',
        loc: { line: 1, column: 14 },
      });
      const error = formatDiagnostic(code, output?.diagnostic);
      expect(error).toBeInstanceOf(SyntaxError);
      expect(stripVTControlCharacters(error?.codeFrame ?? '')).toContain(code);
    });
  });

  it('rethrows errors loading an installed compiler', () => {
    const error = new Error('Broken compiler');
    jest.doMock('typescript', () => {
      throw error;
    });
    withTranspiler((transpile) => {
      expect(() => transpile('', 'test.ts', 'typescript')).toThrow(error);
    });
  });

  it('bails out if the native export does not expose an API constructor', () => {
    jest.doMock('typescript', () => ({ version: '7.1.0' }));
    withTranspiler((transpile) => {
      expect(transpile('', 'test.ts', 'typescript')).toBeUndefined();
    });
  });

  it('bails out for a native API without transpilation before starting a compiler process', () => {
    const API = jest.fn();
    jest.doMock('typescript', () => ({ version: '7.0.2' }));
    jest.doMock('typescript/unstable/sync', () => ({ API }), { virtual: true });
    withTranspiler((transpile) => {
      expect(transpile('', 'test.ts', 'typescript')).toBeUndefined();
      expect(API).not.toHaveBeenCalled();
    });
  });

  it('uses the native export and its enums, and reuses the API instance', () => {
    const transpileModule = jest.fn(() => ({ outputText: 'module.exports = 1;' }));
    const API = jest.fn(() => ({ transpileModule }));
    Object.defineProperty(API.prototype, 'transpileModule', {
      get() {
        throw new Error('The transpileModule getter must not be invoked on the prototype');
      },
    });
    // Deliberately omit a version: capability detection must depend on exports.
    jest.doMock('typescript', () => ({}));
    jest.doMock('typescript/unstable/sync', () => ({ API }), { virtual: true });
    jest.doMock(
      'typescript/unstable/proto',
      () => ({
        ModuleKind: { CommonJS: 1, ESNext: 99, Preserve: 200 },
        ModuleResolutionKind: { Bundler: 100 },
        ScriptTarget: { ESNext: 99 },
        NewLineKind: { LF: 2 },
      }),
      { virtual: true }
    );
    withTranspiler((transpile) => {
      for (const [format, module] of [
        ['commonjs-typescript', 1],
        ['module-typescript', 99],
        ['typescript', 200],
      ] as const) {
        expect(transpile('module.exports = 1 as number;', 'test.ts', format)).toEqual({
          outputText: 'module.exports = 1;',
        });
        expect(transpileModule).toHaveBeenLastCalledWith('module.exports = 1 as number;', {
          fileName: 'test.ts',
          reportDiagnostics: true,
          compilerOptions: {
            module,
            moduleResolution: 100,
            target: 99,
            newLine: 2,
            verbatimModuleSyntax: false,
            inlineSourceMap: true,
            esModuleInterop: true,
          },
        });
      }
      expect(API).toHaveBeenCalledTimes(1);
    });
  });

  it('normalizes native diagnostics and message chains for code frames', () => {
    jest.doMock('typescript', () => ({ version: '7.1.0' }));
    jest.doMock(
      'typescript/unstable/sync',
      () => ({
        API: class {
          transpileModule() {
            return {
              outputText: 'invalid code',
              diagnostics: [
                {
                  text: 'Type expected.',
                  startPosition: { line: 0, character: 13 },
                  messageChain: [{ text: 'Additional detail.' }],
                },
              ],
            };
          }
        },
      }),
      { virtual: true }
    );
    jest.doMock('typescript/unstable/proto', () => ({ ...ts, NewLineKind: { LF: 2 } }), {
      virtual: true,
    });
    withTranspiler((transpile) => {
      const code = 'const value: = 1;';
      const output = transpile(code, 'test.ts', 'typescript');
      expect(output?.diagnostic).toEqual({
        message: 'Type expected.\nAdditional detail.',
        loc: { line: 1, column: 14 },
      });
      const error = formatDiagnostic(code, output?.diagnostic);
      expect(error).toBeInstanceOf(SyntaxError);
      expect(error?.message).toContain('Additional detail.');
      expect(stripVTControlCharacters(error?.codeFrame ?? '')).toContain(code);
    });
  });
});
