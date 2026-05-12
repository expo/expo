// `jest.spyOn` and direct property assignment on the `node:module` namespace import
// don't intercept the production module's call sites: with Babel's `__importStar` the
// two `import * as nodeModule` references are distinct wrapper objects. `jest.mock`
// replaces module resolution for all importers.
import * as nodeModule from 'node:module';

import { callSiteToString, installSourceMapStackTrace } from '../stacktrace';

jest.mock('node:module', () => ({
  ...jest.requireActual('node:module'),
  findSourceMap: jest.fn(),
}));

const findSourceMap = nodeModule.findSourceMap as unknown as jest.Mock;

installSourceMapStackTrace();
const prepareStackTrace = Error.prepareStackTrace as (
  error: unknown,
  callSites: NodeJS.CallSite[]
) => string;

// Real V8 CallSites have a native `toString`, plain objects don't, so coercion would
// otherwise produce `[object Object]`.
const callSiteProto: Record<string, unknown> = {
  isNative: () => false,
  isToplevel: () => false,
  isEval: () => false,
  isConstructor: () => false,
  isAsync: () => false,
  isPromiseAll: () => false,
  getFileName: () => null,
  getLineNumber: () => null,
  getColumnNumber: () => null,
  getFunctionName: () => null,
  getMethodName: () => null,
  getTypeName: () => null,
  getScriptNameOrSourceURL: () => null,
  getEvalOrigin: () => null,
  getThis: () => undefined,
  getFunction: () => undefined,
  toString: callSiteToString,
};

type CallSiteOverrides = {
  isNative?: boolean;
  isToplevel?: boolean;
  isEval?: boolean;
  isConstructor?: boolean;
  fileName?: string | null;
  lineNumber?: number | null;
  columnNumber?: number | null;
  functionName?: string | null;
  methodName?: string | null;
  typeName?: string | null;
  scriptNameOrSourceURL?: string | null;
  evalOrigin?: string | null;
};

function mockCallSite(overrides: CallSiteOverrides = {}): NodeJS.CallSite {
  const site = Object.create(callSiteProto) as Record<string, unknown>;
  if ('isNative' in overrides) site.isNative = () => overrides.isNative;
  if ('isToplevel' in overrides) site.isToplevel = () => overrides.isToplevel;
  if ('isEval' in overrides) site.isEval = () => overrides.isEval;
  if ('isConstructor' in overrides) site.isConstructor = () => overrides.isConstructor;
  if ('fileName' in overrides) site.getFileName = () => overrides.fileName;
  if ('lineNumber' in overrides) site.getLineNumber = () => overrides.lineNumber;
  if ('columnNumber' in overrides) site.getColumnNumber = () => overrides.columnNumber;
  if ('functionName' in overrides) site.getFunctionName = () => overrides.functionName;
  if ('methodName' in overrides) site.getMethodName = () => overrides.methodName;
  if ('typeName' in overrides) site.getTypeName = () => overrides.typeName;
  if ('scriptNameOrSourceURL' in overrides) {
    site.getScriptNameOrSourceURL = () => overrides.scriptNameOrSourceURL;
  }
  if ('evalOrigin' in overrides) site.getEvalOrigin = () => overrides.evalOrigin;
  return site as unknown as NodeJS.CallSite;
}

describe('error header', () => {
  it('formats Error with name and message', () => {
    expect(prepareStackTrace(new Error('boom'), [])).toMatchInlineSnapshot(`"Error: boom"`);
  });

  it('formats subclass Error with custom name', () => {
    class CustomError extends Error {
      override name = 'CustomError';
    }
    expect(prepareStackTrace(new CustomError('bad'), [])).toMatchInlineSnapshot(
      `"CustomError: bad"`
    );
  });

  it('omits separator when message is empty', () => {
    const err = new Error('');
    expect(prepareStackTrace(err, [])).toMatchInlineSnapshot(`"Error"`);
  });

  it('omits separator when name is empty', () => {
    const err = new Error('only-message');
    err.name = '';
    expect(prepareStackTrace(err, [])).toMatchInlineSnapshot(`"only-message"`);
  });

  it('handles plain object that is not an Error', () => {
    expect(prepareStackTrace({ message: 'plain' }, [])).toMatchInlineSnapshot(`"Error: plain"`);
  });

  it('handles a thrown primitive', () => {
    expect(prepareStackTrace('string error', [])).toMatchInlineSnapshot(`"Error"`);
  });

  it('handles null', () => {
    expect(prepareStackTrace(null, [])).toMatchInlineSnapshot(`"Error"`);
  });
});

describe('non-source-mapped frames (V8 default formatting)', () => {
  it('top-level frame with function name and location', () => {
    const site = mockCallSite({
      isToplevel: true,
      fileName: '/proj/index.js',
      scriptNameOrSourceURL: '/proj/index.js',
      lineNumber: 5,
      columnNumber: 10,
      functionName: 'main',
    });
    expect(prepareStackTrace(new Error('e'), [site])).toMatchInlineSnapshot(`
"Error: e
    at main (/proj/index.js:5:10)"
`);
  });

  it('top-level frame without function name (no parens)', () => {
    const site = mockCallSite({
      isToplevel: true,
      fileName: '/proj/index.js',
      scriptNameOrSourceURL: '/proj/index.js',
      lineNumber: 5,
      columnNumber: 10,
      functionName: null,
    });
    expect(prepareStackTrace(new Error('e'), [site])).toMatchInlineSnapshot(`
"Error: e
    at /proj/index.js:5:10"
`);
  });

  it('constructor frame with class name', () => {
    const site = mockCallSite({
      isConstructor: true,
      fileName: '/proj/widget.js',
      scriptNameOrSourceURL: '/proj/widget.js',
      lineNumber: 12,
      columnNumber: 7,
      functionName: 'Widget',
    });
    expect(prepareStackTrace(new Error('e'), [site])).toMatchInlineSnapshot(`
"Error: e
    at new Widget (/proj/widget.js:12:7)"
`);
  });

  it('constructor frame without class name', () => {
    const site = mockCallSite({
      isConstructor: true,
      fileName: '/proj/anon.js',
      scriptNameOrSourceURL: '/proj/anon.js',
      lineNumber: 1,
      columnNumber: 1,
      functionName: null,
    });
    expect(prepareStackTrace(new Error('e'), [site])).toMatchInlineSnapshot(`
"Error: e
    at new <anonymous> (/proj/anon.js:1:1)"
`);
  });

  it('method call: typeName + functionName (matching prefix)', () => {
    const site = mockCallSite({
      fileName: '/proj/cls.js',
      scriptNameOrSourceURL: '/proj/cls.js',
      lineNumber: 3,
      columnNumber: 4,
      functionName: 'Foo.bar',
      methodName: 'bar',
      typeName: 'Foo',
    });
    expect(prepareStackTrace(new Error('e'), [site])).toMatchInlineSnapshot(`
"Error: e
    at Foo.bar (/proj/cls.js:3:4)"
`);
  });

  it('method call: typeName + functionName (no matching prefix)', () => {
    const site = mockCallSite({
      fileName: '/proj/cls.js',
      scriptNameOrSourceURL: '/proj/cls.js',
      lineNumber: 3,
      columnNumber: 4,
      functionName: 'helper',
      methodName: 'bar',
      typeName: 'Foo',
    });
    expect(prepareStackTrace(new Error('e'), [site])).toMatchInlineSnapshot(`
"Error: e
    at Foo.helper [as bar] (/proj/cls.js:3:4)"
`);
  });

  it('method call: functionName matches methodName, no [as ...] suffix', () => {
    const site = mockCallSite({
      fileName: '/proj/cls.js',
      scriptNameOrSourceURL: '/proj/cls.js',
      lineNumber: 3,
      columnNumber: 4,
      functionName: 'Foo.bar',
      methodName: 'bar',
      typeName: 'Foo',
    });
    expect(prepareStackTrace(new Error('e'), [site])).toMatchInlineSnapshot(`
"Error: e
    at Foo.bar (/proj/cls.js:3:4)"
`);
  });

  it('method call: no functionName, falls back to typeName.methodName', () => {
    const site = mockCallSite({
      fileName: '/proj/cls.js',
      scriptNameOrSourceURL: '/proj/cls.js',
      lineNumber: 3,
      columnNumber: 4,
      functionName: null,
      methodName: 'bar',
      typeName: 'Foo',
    });
    expect(prepareStackTrace(new Error('e'), [site])).toMatchInlineSnapshot(`
"Error: e
    at Foo.bar (/proj/cls.js:3:4)"
`);
  });

  it('method call: no functionName and no methodName', () => {
    const site = mockCallSite({
      fileName: '/proj/cls.js',
      scriptNameOrSourceURL: '/proj/cls.js',
      lineNumber: 3,
      columnNumber: 4,
      functionName: null,
      methodName: null,
      typeName: 'Foo',
    });
    expect(prepareStackTrace(new Error('e'), [site])).toMatchInlineSnapshot(`
"Error: e
    at Foo.<anonymous> (/proj/cls.js:3:4)"
`);
  });

  it('method call: typeName "[object Object]" normalized', () => {
    const site = mockCallSite({
      fileName: '/proj/cls.js',
      scriptNameOrSourceURL: '/proj/cls.js',
      lineNumber: 3,
      columnNumber: 4,
      functionName: 'fn',
      typeName: '[object Object]',
    });
    expect(prepareStackTrace(new Error('e'), [site])).toMatchInlineSnapshot(`
"Error: e
    at null.fn (/proj/cls.js:3:4)"
`);
  });

  it('native frame', () => {
    const site = mockCallSite({
      isNative: true,
      isToplevel: true,
      functionName: 'apply',
    });
    expect(prepareStackTrace(new Error('e'), [site])).toMatchInlineSnapshot(`
"Error: e
    at apply (native)"
`);
  });

  it('native frame without function name', () => {
    const site = mockCallSite({
      isNative: true,
      isToplevel: true,
      functionName: null,
    });
    expect(prepareStackTrace(new Error('e'), [site])).toMatchInlineSnapshot(`
"Error: e
    at native"
`);
  });

  it('eval frame with origin', () => {
    const site = mockCallSite({
      isEval: true,
      isToplevel: true,
      fileName: null,
      scriptNameOrSourceURL: null,
      evalOrigin: 'eval at <anonymous> (/proj/host.js:1:1)',
      lineNumber: 1,
      columnNumber: 1,
      functionName: 'evaledFn',
    });
    expect(prepareStackTrace(new Error('e'), [site])).toMatchInlineSnapshot(`
"Error: e
    at evaledFn (eval at <anonymous> (/proj/host.js:1:1), <anonymous>:1:1)"
`);
  });

  it('frame with line but no column emits "file:line"', () => {
    const site = mockCallSite({
      isToplevel: true,
      fileName: '/proj/x.js',
      scriptNameOrSourceURL: '/proj/x.js',
      lineNumber: 42,
      columnNumber: null,
      functionName: 'fn',
    });
    expect(prepareStackTrace(new Error('e'), [site])).toMatchInlineSnapshot(`
"Error: e
    at fn (/proj/x.js:42)"
`);
  });

  it('multiple frames format together', () => {
    const sites = [
      mockCallSite({
        fileName: '/proj/a.js',
        scriptNameOrSourceURL: '/proj/a.js',
        lineNumber: 1,
        columnNumber: 1,
        functionName: 'inner',
        methodName: 'inner',
        typeName: 'Foo',
      }),
      mockCallSite({
        isToplevel: true,
        fileName: '/proj/b.js',
        scriptNameOrSourceURL: '/proj/b.js',
        lineNumber: 2,
        columnNumber: 2,
        functionName: null,
      }),
    ];
    expect(prepareStackTrace(new Error('e'), sites)).toMatchInlineSnapshot(`
"Error: e
    at Foo.inner (/proj/a.js:1:1)
    at /proj/b.js:2:2"
`);
  });
});

describe('source-mapped frames', () => {
  type MapEntry = Partial<{
    originalSource: string;
    originalLine: number;
    originalColumn: number;
    name: string | null;
  }>;

  beforeEach(() => {
    findSourceMap.mockReset();
  });

  function mockSourceMap(entries: Record<string, MapEntry>): void {
    findSourceMap.mockImplementation((file: string) => {
      const entry = entries[file];
      if (!entry) return undefined;
      return { findEntry: () => entry };
    });
  }

  it('rewrites a mapped frame to its original source position', () => {
    mockSourceMap({
      '/bundle.js': {
        originalSource: '/orig/Component.tsx',
        originalLine: 41,
        originalColumn: 9,
        name: null,
      },
    });
    const site = mockCallSite({
      isToplevel: true,
      fileName: '/bundle.js',
      scriptNameOrSourceURL: '/bundle.js',
      lineNumber: 1,
      columnNumber: 100,
      functionName: 'render',
    });
    expect(prepareStackTrace(new Error('e'), [site])).toMatchInlineSnapshot(`
"Error: e
    at render (/orig/Component.tsx:42:10)"
`);
  });

  it('converts file:// originalSource via fileURLToPath', () => {
    mockSourceMap({
      '/bundle.js': {
        originalSource: 'file:///orig/Component.tsx',
        originalLine: 0,
        originalColumn: 0,
        name: null,
      },
    });
    const site = mockCallSite({
      isToplevel: true,
      fileName: '/bundle.js',
      scriptNameOrSourceURL: '/bundle.js',
      lineNumber: 1,
      columnNumber: 1,
      functionName: 'render',
    });
    expect(prepareStackTrace(new Error('e'), [site])).toMatchInlineSnapshot(`
"Error: e
    at render (/orig/Component.tsx:1:1)"
`);
  });

  it('falls back to V8 format when findSourceMap returns null', () => {
    mockSourceMap({});
    const site = mockCallSite({
      isToplevel: true,
      fileName: '/bundle.js',
      scriptNameOrSourceURL: '/bundle.js',
      lineNumber: 1,
      columnNumber: 1,
      functionName: 'render',
    });
    expect(prepareStackTrace(new Error('e'), [site])).toMatchInlineSnapshot(`
"Error: e
    at render (/bundle.js:1:1)"
`);
  });

  it('falls back to V8 format when findEntry returns no originalSource', () => {
    findSourceMap.mockReturnValue({ findEntry: () => ({}) } as ReturnType<
      typeof nodeModule.findSourceMap
    >);
    const site = mockCallSite({
      isToplevel: true,
      fileName: '/bundle.js',
      scriptNameOrSourceURL: '/bundle.js',
      lineNumber: 1,
      columnNumber: 1,
      functionName: 'render',
    });
    expect(prepareStackTrace(new Error('e'), [site])).toMatchInlineSnapshot(`
"Error: e
    at render (/bundle.js:1:1)"
`);
  });

  it('uses sourceURL when getFileName is null', () => {
    mockSourceMap({
      'http://localhost:8081/bundle.js': {
        originalSource: '/orig/x.tsx',
        originalLine: 0,
        originalColumn: 0,
        name: null,
      },
    });
    const site = mockCallSite({
      isToplevel: true,
      fileName: null,
      scriptNameOrSourceURL: 'http://localhost:8081/bundle.js',
      lineNumber: 1,
      columnNumber: 1,
      functionName: 'render',
    });
    expect(prepareStackTrace(new Error('e'), [site])).toMatchInlineSnapshot(`
"Error: e
    at render (/orig/x.tsx:1:1)"
`);
  });

  it('falls back to V8 format when scriptName is missing entirely', () => {
    findSourceMap.mockReturnValue(undefined);
    const site = mockCallSite({
      isToplevel: true,
      fileName: null,
      scriptNameOrSourceURL: null,
      lineNumber: 1,
      columnNumber: 1,
      functionName: 'render',
    });
    expect(prepareStackTrace(new Error('e'), [site])).toMatchInlineSnapshot(`
"Error: e
    at render (<anonymous>:1:1)"
`);
    expect(findSourceMap).not.toHaveBeenCalled();
  });

  it('falls back to V8 format when line or column is null', () => {
    findSourceMap.mockReturnValue(undefined);
    const site = mockCallSite({
      isToplevel: true,
      fileName: '/bundle.js',
      scriptNameOrSourceURL: '/bundle.js',
      lineNumber: null,
      columnNumber: 1,
      functionName: 'render',
    });
    expect(prepareStackTrace(new Error('e'), [site])).toMatchInlineSnapshot(`
"Error: e
    at render (/bundle.js)"
`);
    expect(findSourceMap).not.toHaveBeenCalled();
  });

  it('skips mapping for native frames without consulting findSourceMap', () => {
    findSourceMap.mockReturnValue(undefined);
    const site = mockCallSite({
      isNative: true,
      isToplevel: true,
      fileName: '/bundle.js',
      scriptNameOrSourceURL: '/bundle.js',
      lineNumber: 1,
      columnNumber: 1,
      functionName: 'apply',
    });
    expect(prepareStackTrace(new Error('e'), [site])).toMatchInlineSnapshot(`
"Error: e
    at apply (native)"
`);
    expect(findSourceMap).not.toHaveBeenCalled();
  });

  it("carries source-map name forward as the previous frame's function name", () => {
    mockSourceMap({
      '/bundle.js': {
        originalSource: '/orig/App.tsx',
        originalLine: 9,
        originalColumn: 4,
        name: 'render',
      },
    });
    const innerSite = mockCallSite({
      isToplevel: true,
      fileName: '/bundle.js',
      scriptNameOrSourceURL: '/bundle.js',
      lineNumber: 1,
      columnNumber: 1,
      functionName: 'minified_a',
    });
    const outerSite = mockCallSite({
      isToplevel: true,
      fileName: '/bundle.js',
      scriptNameOrSourceURL: '/bundle.js',
      lineNumber: 2,
      columnNumber: 2,
      functionName: 'minified_b',
    });
    expect(prepareStackTrace(new Error('e'), [innerSite, outerSite])).toMatchInlineSnapshot(`
"Error: e
    at render (/orig/App.tsx:10:5)
    at minified_b (/orig/App.tsx:10:5)"
`);
  });

  it('mixes mapped and unmapped frames in a single stack', () => {
    mockSourceMap({
      '/bundle.js': {
        originalSource: '/orig/App.tsx',
        originalLine: 41,
        originalColumn: 9,
        name: null,
      },
    });
    const sites = [
      mockCallSite({
        isToplevel: true,
        fileName: '/bundle.js',
        scriptNameOrSourceURL: '/bundle.js',
        lineNumber: 100,
        columnNumber: 50,
        functionName: 'render',
      }),
      mockCallSite({
        isToplevel: false,
        fileName: 'node:internal/modules/cjs/loader',
        scriptNameOrSourceURL: 'node:internal/modules/cjs/loader',
        lineNumber: 1234,
        columnNumber: 14,
        functionName: '_compile',
        methodName: '_compile',
        typeName: 'Module',
      }),
    ];
    expect(prepareStackTrace(new Error('e'), sites)).toMatchInlineSnapshot(`
"Error: e
    at render (/orig/App.tsx:42:10)
    at Module._compile (node:internal/modules/cjs/loader:1234:14)"
`);
  });
});

describe('empty stack', () => {
  it('returns just the error header', () => {
    expect(prepareStackTrace(new Error('boom'), [])).toMatchInlineSnapshot(`"Error: boom"`);
  });
});
