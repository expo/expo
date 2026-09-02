import {
  formatStackFrames,
  isUnmappedFrame,
  parseStackFrames,
  relativizeFrame,
  splitMethodContext,
  splitTextStack,
  symbolicateFramesAsync,
  trimBundleUrl,
  type StackFrame,
} from '../symbolicate';

/**
 * A frame exactly as a live Expo app reported it [observed — SDK 57 in Expo Go on iOS, 2026-08-23].
 * Roughly 400 characters of transform options, repeated on every line of every stack.
 */
const BUNDLE_URL =
  'http://127.0.0.1:8150/node_modules/expo-router/entry.bundle//&platform=ios&dev=true&hot=false' +
  '&lazy=true&transform.engine=hermes&transform.bytecode=1&transform.routerRoot=src%2Fapp' +
  '&transform.reactCompiler=true&unstable_transformProfile=hermes-stable';

const FRAME: StackFrame = {
  methodName: 'overrideMethod',
  file: BUNDLE_URL,
  lineNumber: 49572,
  column: 39,
};

let originalFetch: typeof fetch | undefined;

beforeEach(() => {
  originalFetch = globalThis.fetch;
});

afterEach(() => {
  if (originalFetch) {
    globalThis.fetch = originalFetch;
  }
});

describe(trimBundleUrl, () => {
  // The JSC-safe form iOS produces: the query string arrives after `//&` rather than after `?`.
  it(`should drop the query of a JSC-safe bundle URL`, () => {
    expect(trimBundleUrl(BUNDLE_URL)).toBe(
      'http://127.0.0.1:8150/node_modules/expo-router/entry.bundle'
    );
  });

  it(`should drop an ordinary query string too`, () => {
    expect(trimBundleUrl('http://127.0.0.1:8150/index.bundle?platform=ios&dev=true')).toBe(
      'http://127.0.0.1:8150/index.bundle'
    );
  });

  it(`should leave a path on disk alone`, () => {
    expect(trimBundleUrl('/project/src/app/index.tsx')).toBe('/project/src/app/index.tsx');
    expect(trimBundleUrl('<native>')).toBe('<native>');
  });
});

describe(parseStackFrames, () => {
  // Some exceptions carry structured call frames and some only these lines; both need mapping.
  it(`should read frames out of a text stack, lowering the column to Metro's counting`, () => {
    expect(parseStackFrames('  at App (App.tsx:3:9)\n  at render (App.tsx:10:1)')).toEqual([
      { methodName: 'App', file: 'App.tsx', lineNumber: 3, column: 8 },
      { methodName: 'render', file: 'App.tsx', lineNumber: 10, column: 0 },
    ]);
  });

  it(`should keep a frame the runtime reported without a location`, () => {
    expect(parseStackFrames('  at global')).toEqual([
      { methodName: 'global', file: '', lineNumber: 0, column: 0 },
    ]);
  });

  it(`should skip a line that is not a frame`, () => {
    expect(parseStackFrames('Error: nope\n  at App (App.tsx:3:1)')).toHaveLength(1);
  });

  it(`should round-trip through the renderer`, () => {
    const line = '  at App (App.tsx:3:9)';

    expect(formatStackFrames(parseStackFrames(line))).toBe(line);
  });

  // The frame F30 was written for, byte for byte [observed — friction run 3, 2026-08-23: notesapp,
  // a ReferenceError thrown from a component the React Compiler had compiled].
  it(`should read the location out of the last parenthesised group of a compiled frame`, () => {
    const line =
      '  at HomeScreen (./index.tsx) ' +
      '(http://127.0.0.1:8163/node_modules/expo-router/entry.bundle:192491:38)';

    expect(parseStackFrames(line)).toEqual([
      {
        methodName: 'HomeScreen',
        sourceHint: './index.tsx',
        file: 'http://127.0.0.1:8163/node_modules/expo-router/entry.bundle',
        lineNumber: 192491,
        column: 37,
      },
    ]);
  });

  it(`should round-trip a compiled frame through the renderer`, () => {
    const line = '  at HomeScreen (./index.tsx) (http://127.0.0.1:8163/entry.bundle:192491:38)';

    expect(formatStackFrames(parseStackFrames(line))).toBe(line);
  });

  // A location whose own path holds parentheses is still the last group, so the greedy name group
  // has to give it back rather than claim it.
  it(`should keep a location whose path holds parentheses`, () => {
    expect(parseStackFrames('  at App (/project/src (copy)/App.tsx:3:9)')).toEqual([
      { methodName: 'App', file: '/project/src (copy)/App.tsx', lineNumber: 3, column: 8 },
    ]);
  });
});

describe(splitMethodContext, () => {
  it(`should split the compiled source hint off the function name`, () => {
    expect(splitMethodContext('HomeScreen (./index.tsx)')).toEqual({
      methodName: 'HomeScreen',
      sourceHint: './index.tsx',
    });
  });

  it(`should leave a plain function name alone`, () => {
    expect(splitMethodContext('overrideMethod')).toEqual({ methodName: 'overrideMethod' });
  });

  it(`should name an empty context anonymous`, () => {
    expect(splitMethodContext('   ')).toEqual({ methodName: '<anonymous>' });
  });
});

// React Native reports a thrown error through the console path as one string: the message, then
// the error's own frames. Those name the project function that threw; the `stackTrace` CDP sends
// alongside names the console machinery that reported it.
describe(splitTextStack, () => {
  it(`should lift the error's own frames out of the message`, () => {
    expect(
      splitTextStack(`Error: BOOM_PROJECT_FRAME\n    at wave3bBoom (${BUNDLE_URL}:193817:24)`)
    ).toEqual({
      message: 'Error: BOOM_PROJECT_FRAME',
      frames: [{ methodName: 'wave3bBoom', file: BUNDLE_URL, lineNumber: 193817, column: 23 }],
    });
  });

  it(`should leave a message that carries no stack alone`, () => {
    expect(splitTextStack('Request failed')).toEqual({ message: 'Request failed', frames: [] });
  });

  // Nothing is split off until a *located* frame appears, so ordinary prose survives intact.
  it(`should not mistake prose for a stack`, () => {
    const prose = 'Expected at least 3 items\nat most 5';

    expect(splitTextStack(prose)).toEqual({ message: prose, frames: [] });
  });
});

describe(relativizeFrame, () => {
  it(`should show a project file relative to the project`, () => {
    const mapped: StackFrame = {
      methodName: 'Index',
      file: '/project/src/app/index.tsx',
      lineNumber: 42,
      column: 12,
    };

    expect(relativizeFrame(mapped, '/project').file).toBe('src/app/index.tsx');
  });

  it(`should leave a file outside the project absolute`, () => {
    const mapped: StackFrame = {
      methodName: 'x',
      file: '/elsewhere/node_modules/react/index.js',
      lineNumber: 1,
      column: 0,
    };

    expect(relativizeFrame(mapped, '/project').file).toBe('/elsewhere/node_modules/react/index.js');
  });

  // Trimmed either way: the query string is what makes an unmapped stack unreadable.
  it(`should trim a frame that was never mapped`, () => {
    expect(relativizeFrame(FRAME, '/project').file).toBe(
      'http://127.0.0.1:8150/node_modules/expo-router/entry.bundle'
    );
  });

  it(`should work without a project to be relative to`, () => {
    expect(relativizeFrame({ ...FRAME, file: '/a/b.tsx' }, null).file).toBe('/a/b.tsx');
  });
});

describe(symbolicateFramesAsync, () => {
  /** Record the request, and answer with `stack`. */
  function mockSymbolicator(answer: unknown, { ok = true, status = 200 } = {}) {
    const calls: any[] = [];
    globalThis.fetch = (async (url: string, init: any) => {
      calls.push({ url, body: JSON.parse(init.body) });
      return { ok, status, json: async () => answer };
    }) as unknown as typeof fetch;
    return calls;
  }

  it(`should post the frames as Metro expects them and read the mapping back`, async () => {
    const calls = mockSymbolicator({
      codeFrame: null,
      stack: [
        {
          file: '/project/src/app/index.tsx',
          lineNumber: 42,
          column: 12,
          methodName: 'Index',
          collapse: false,
        },
      ],
    });

    const frames = await symbolicateFramesAsync('http://127.0.0.1:8150', [FRAME]);

    expect(calls[0].url).toBe('http://127.0.0.1:8150/symbolicate');
    // The whole URL, query string included: Metro's lookup is exact string equality, and the query
    // is what selects the bundle whose source map answers.
    expect(calls[0].body).toEqual({ stack: [FRAME] });
    expect(frames).toEqual([
      {
        methodName: 'Index',
        file: '/project/src/app/index.tsx',
        lineNumber: 42,
        column: 12,
        collapse: false,
      },
    ]);
  });

  // The whole F30 path: the compiled frame is parsed, the corrected location is what Metro is
  // asked about, and the answer is a `src/`-relative file with `collapse: false` — the two
  // properties an agent filters its own code by, and the two the mangled `file` destroyed.
  it(`should symbolicate the corrected location of a compiled frame`, async () => {
    const calls = mockSymbolicator({
      stack: [
        {
          file: '/project/src/app/index.tsx',
          lineNumber: 32,
          column: 17,
          methodName: 'HomeScreen',
          collapse: false,
        },
      ],
    });
    const [parsed] = parseStackFrames(
      '  at HomeScreen (./index.tsx) ' +
        '(http://127.0.0.1:8163/node_modules/expo-router/entry.bundle:192491:38)'
    );

    const frames = await symbolicateFramesAsync('http://127.0.0.1:8163', [parsed!]);

    // `sourceHint` is this CLI's field, so the symbolicator is never sent it.
    expect(calls[0].body).toEqual({
      stack: [
        {
          methodName: 'HomeScreen',
          file: 'http://127.0.0.1:8163/node_modules/expo-router/entry.bundle',
          lineNumber: 192491,
          column: 37,
        },
      ],
    });
    expect(relativizeFrame(frames[0]!, '/project')).toEqual({
      methodName: 'HomeScreen',
      sourceHint: './index.tsx',
      file: 'src/app/index.tsx',
      lineNumber: 32,
      column: 17,
      collapse: false,
    });
  });

  // Metro hands an unmappable frame back unchanged, and Expo's hook nulls its line and column.
  it(`should keep the frame it sent when the dev server could not map it`, async () => {
    mockSymbolicator({
      stack: [{ file: BUNDLE_URL, lineNumber: null, column: null, collapse: true }],
    });

    const frames = await symbolicateFramesAsync('http://127.0.0.1:8150', [FRAME]);

    expect(frames).toEqual([{ ...FRAME, collapse: true }]);
  });

  it(`should map the frames it can and leave the rest`, async () => {
    mockSymbolicator({
      stack: [
        { file: '/project/src/app/index.tsx', lineNumber: 42, column: 12, methodName: 'Index' },
        { file: BUNDLE_URL, lineNumber: null, column: null, collapse: true },
      ],
    });

    const frames = await symbolicateFramesAsync('http://127.0.0.1:8150', [
      FRAME,
      { ...FRAME, methodName: 'other' },
    ]);

    expect(frames[0]!.file).toBe('/project/src/app/index.tsx');
    expect(frames[1]!.file).toBe(BUNDLE_URL);
  });

  // Symbolication improves a report; it is not a precondition for one.
  it(`should fall back to the raw frames when the dev server answers an error`, async () => {
    mockSymbolicator({ error: 'nope' }, { ok: false, status: 500 });

    await expect(symbolicateFramesAsync('http://127.0.0.1:8150', [FRAME])).resolves.toEqual([
      FRAME,
    ]);
  });

  it(`should fall back to the raw frames when the request fails outright`, async () => {
    globalThis.fetch = (async () => {
      throw new Error('connect ECONNREFUSED');
    }) as unknown as typeof fetch;

    await expect(symbolicateFramesAsync('http://127.0.0.1:8150', [FRAME])).resolves.toEqual([
      FRAME,
    ]);
  });

  it(`should fall back when the answer is not one frame per frame`, async () => {
    mockSymbolicator({ stack: [] });

    await expect(symbolicateFramesAsync('http://127.0.0.1:8150', [FRAME])).resolves.toEqual([
      FRAME,
    ]);
  });

  it(`should not ask at all when nothing needs mapping`, async () => {
    const calls = mockSymbolicator({ stack: [] });
    const mapped: StackFrame = {
      methodName: 'Index',
      file: '/project/src/app/index.tsx',
      lineNumber: 1,
      column: 0,
    };

    await expect(symbolicateFramesAsync('http://127.0.0.1:8150', [mapped])).resolves.toEqual([
      mapped,
    ]);
    await expect(symbolicateFramesAsync('http://127.0.0.1:8150', [])).resolves.toEqual([]);
    expect(calls).toHaveLength(0);
  });
});

describe(isUnmappedFrame, () => {
  it(`should call a frame that still points at a bundle unmapped`, () => {
    expect(isUnmappedFrame(FRAME)).toBe(true);
    expect(isUnmappedFrame({ ...FRAME, file: 'src/app/index.tsx' })).toBe(false);
  });
});
