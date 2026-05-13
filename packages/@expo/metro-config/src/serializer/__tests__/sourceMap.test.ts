import { GenMapping, addMapping, toEncodedMap } from '@jridgewell/gen-mapping';
import { TraceMap, originalPositionFor } from '@jridgewell/trace-mapping';

import { installPackedMap } from '../packedMap';
import {
  appendDebugIdToSourceMap,
  composeSourceMaps,
  patchMetroSourceMapStringForPackedMaps,
  rawMappingsToEncodedMap,
  sourceMapString,
  sourceMapStringNonBlocking,
  type BabelSourceMapSegment,
  type ComposableSourceMap,
  type MetroSourceMapSegmentTuple,
} from '../sourceMap';

function buildMap(opts: {
  file?: string;
  segments: {
    generated: { line: number; column: number };
    original?: { line: number; column: number };
    source?: string;
    name?: string;
  }[];
}): ComposableSourceMap {
  const gen = new GenMapping({ file: opts.file });
  for (const s of opts.segments) {
    addMapping(gen, {
      generated: s.generated,
      ...(s.source && s.original ? { source: s.source, original: s.original, name: s.name } : {}),
    });
  }
  const encoded = toEncodedMap(gen);
  return {
    version: encoded.version,
    file: encoded.file ?? undefined,
    mappings: encoded.mappings,
    names: encoded.names as string[],
    sources: encoded.sources as (string | null)[],
    sourcesContent: encoded.sourcesContent as (string | null)[] | undefined,
  };
}

describe('composeSourceMaps', () => {
  it('throws on empty input', () => {
    expect(() => composeSourceMaps([])).toThrow(/at least one map/);
  });

  it('composes a basic two-map chain so positions trace through', () => {
    const bundler = buildMap({
      file: 'bundle.js',
      segments: [
        {
          generated: { line: 1, column: 0 },
          source: 'helloworld.js',
          original: { line: 3, column: 0 },
        },
        {
          generated: { line: 2, column: 0 },
          source: 'helloworld.js',
          original: { line: 5, column: 0 },
          name: 'greet',
        },
      ],
    });

    const hermes = buildMap({
      file: 'bundle.hbc',
      segments: [
        {
          generated: { line: 1, column: 0 },
          source: 'bundle.js',
          original: { line: 1, column: 0 },
        },
        {
          generated: { line: 2, column: 0 },
          source: 'bundle.js',
          original: { line: 2, column: 0 },
        },
      ],
    });

    const composed = composeSourceMaps([bundler, hermes]);
    const tracer = new TraceMap(composed as any);

    expect(originalPositionFor(tracer, { line: 1, column: 0 })).toMatchObject({
      source: 'helloworld.js',
      line: 3,
      column: 0,
    });
    expect(originalPositionFor(tracer, { line: 2, column: 0 })).toMatchObject({
      source: 'helloworld.js',
      line: 5,
      column: 0,
      name: 'greet',
    });
  });

  it('returns a single map unchanged in the trivial chain', () => {
    const single = buildMap({
      file: 'a.js',
      segments: [
        { generated: { line: 1, column: 0 }, source: 'src.js', original: { line: 1, column: 0 } },
      ],
    });

    const composed = composeSourceMaps([single]);
    const tracer = new TraceMap(composed as any);
    expect(originalPositionFor(tracer, { line: 1, column: 0 })).toMatchObject({
      source: 'src.js',
      line: 1,
      column: 0,
    });
  });

  describe('ignore list', () => {
    it('translates x_google_ignoreList input-side and emits both keys on output', () => {
      // The legacy alias is what Metro's Generator emits today.
      const bundler: ComposableSourceMap = {
        ...buildMap({
          file: 'bundle.js',
          segments: [
            {
              generated: { line: 1, column: 0 },
              source: 'user.js',
              original: { line: 1, column: 0 },
            },
            {
              generated: { line: 1, column: 5 },
              source: 'node_modules/lib.js',
              original: { line: 2, column: 0 },
            },
          ],
        }),
        x_google_ignoreList: [1], // index of node_modules/lib.js in sources
      };
      const hermes = buildMap({
        file: 'bundle.hbc',
        segments: [
          {
            generated: { line: 1, column: 0 },
            source: 'bundle.js',
            original: { line: 1, column: 0 },
          },
          {
            generated: { line: 1, column: 3 },
            source: 'bundle.js',
            original: { line: 1, column: 5 },
          },
        ],
      });

      const composed = composeSourceMaps([bundler, hermes]);

      expect(composed.ignoreList).toBeDefined();
      expect(composed.x_google_ignoreList).toBeDefined();
      expect(composed.ignoreList).toEqual(composed.x_google_ignoreList);

      const ignoredSources = composed.ignoreList!.map((i) => composed.sources[i]);
      expect(ignoredSources).toEqual(['node_modules/lib.js']);
    });

    it('does not emit ignoreList when input has no ignored sources', () => {
      const bundler = buildMap({
        file: 'bundle.js',
        segments: [
          { generated: { line: 1, column: 0 }, source: 'a.js', original: { line: 1, column: 0 } },
        ],
      });
      const hermes = buildMap({
        file: 'bundle.hbc',
        segments: [
          {
            generated: { line: 1, column: 0 },
            source: 'bundle.js',
            original: { line: 1, column: 0 },
          },
        ],
      });

      const composed = composeSourceMaps([bundler, hermes]);
      expect(composed.ignoreList).toBeUndefined();
      expect(composed.x_google_ignoreList).toBeUndefined();
    });

    it('honors a pre-translated ignoreList (no double-handling)', () => {
      const bundler: ComposableSourceMap = {
        ...buildMap({
          file: 'bundle.js',
          segments: [
            {
              generated: { line: 1, column: 0 },
              source: 'user.js',
              original: { line: 1, column: 0 },
            },
            {
              generated: { line: 1, column: 5 },
              source: 'lib.js',
              original: { line: 2, column: 0 },
            },
          ],
        }),
        ignoreList: [1],
      };
      const hermes = buildMap({
        file: 'bundle.hbc',
        segments: [
          {
            generated: { line: 1, column: 0 },
            source: 'bundle.js',
            original: { line: 1, column: 0 },
          },
          {
            generated: { line: 1, column: 3 },
            source: 'bundle.js',
            original: { line: 1, column: 5 },
          },
        ],
      });

      const composed = composeSourceMaps([bundler, hermes]);
      expect(composed.ignoreList).toEqual(composed.x_google_ignoreList);
      const ignoredSources = composed.ignoreList!.map((i) => composed.sources[i]);
      expect(ignoredSources).toEqual(['lib.js']);
    });
  });

  describe('Metro-specific extension fields', () => {
    it('carries x_hermes_function_offsets through from the latest map', () => {
      const bundler = buildMap({
        file: 'bundle.js',
        segments: [
          { generated: { line: 1, column: 0 }, source: 'a.js', original: { line: 1, column: 0 } },
          { generated: { line: 5, column: 0 }, source: 'a.js', original: { line: 10, column: 0 } },
        ],
      });
      // Fixture crosses a function boundary so dropping the field would
      // observably break Hermes bytecode-frame symbolication.
      const hermes: ComposableSourceMap = {
        ...buildMap({
          file: 'bundle.hbc',
          segments: [
            {
              generated: { line: 1, column: 0 },
              source: 'bundle.js',
              original: { line: 1, column: 0 },
            },
            {
              generated: { line: 1, column: 100 },
              source: 'bundle.js',
              original: { line: 5, column: 0 },
            },
          ],
        }),
        x_hermes_function_offsets: { 0: [0, 50], 1: [100, 200] },
      };

      const composed = composeSourceMaps([bundler, hermes]);
      expect(composed.x_hermes_function_offsets).toEqual({ 0: [0, 50], 1: [100, 200] });
      expect(composed.x_hermes_function_offsets).toBe(hermes.x_hermes_function_offsets);
    });

    it('drops x_facebook_sources deliberately (Expo does not ship to FB symbolicators)', () => {
      const bundler: ComposableSourceMap & { x_facebook_sources?: unknown } = {
        ...buildMap({
          file: 'bundle.js',
          segments: [
            { generated: { line: 1, column: 0 }, source: 'a.js', original: { line: 1, column: 0 } },
          ],
        }),
        x_facebook_sources: [[{ names: ['<anonymous>'], mappings: 'AAAA' }]],
      };
      const hermes = buildMap({
        file: 'bundle.hbc',
        segments: [
          {
            generated: { line: 1, column: 0 },
            source: 'bundle.js',
            original: { line: 1, column: 0 },
          },
        ],
      });

      const composed = composeSourceMaps([bundler, hermes]) as ComposableSourceMap & {
        x_facebook_sources?: unknown;
      };
      expect(composed.x_facebook_sources).toBeUndefined();
    });
  });

  describe('parity vs Metro composeSourceMaps', () => {
    function buildFixture() {
      const bundler = buildMap({
        file: 'bundle.js',
        segments: [
          { generated: { line: 1, column: 0 }, source: 'a.js', original: { line: 1, column: 0 } },
          {
            generated: { line: 1, column: 10 },
            source: 'a.js',
            original: { line: 1, column: 10 },
            name: 'foo',
          },
          { generated: { line: 1, column: 20 }, source: 'b.js', original: { line: 5, column: 4 } },
          { generated: { line: 2, column: 0 }, source: 'b.js', original: { line: 6, column: 0 } },
          {
            generated: { line: 2, column: 8 },
            source: 'c.js',
            original: { line: 12, column: 0 },
            name: 'bar',
          },
          { generated: { line: 3, column: 0 }, source: 'c.js', original: { line: 14, column: 0 } },
        ],
      });

      const hermes = buildMap({
        file: 'bundle.hbc',
        segments: [
          {
            generated: { line: 1, column: 0 },
            source: 'bundle.js',
            original: { line: 1, column: 0 },
          },
          {
            generated: { line: 1, column: 4 },
            source: 'bundle.js',
            original: { line: 1, column: 10 },
          },
          {
            generated: { line: 1, column: 9 },
            source: 'bundle.js',
            original: { line: 1, column: 20 },
          },
          {
            generated: { line: 1, column: 13 },
            source: 'bundle.js',
            original: { line: 2, column: 0 },
          },
          {
            generated: { line: 1, column: 18 },
            source: 'bundle.js',
            original: { line: 2, column: 8 },
          },
          {
            generated: { line: 1, column: 24 },
            source: 'bundle.js',
            original: { line: 3, column: 0 },
          },
        ],
      });

      return { bundler, hermes };
    }

    it('resolves the same source positions as Metro for a multi-source fixture', () => {
      const { bundler, hermes } = buildFixture();

      const metroCompose: typeof import('@expo/metro/metro-source-map').composeSourceMaps =
        require('@expo/metro/metro-source-map').composeSourceMaps;

      const ours = composeSourceMaps([bundler, hermes]);
      const metro = metroCompose([bundler, hermes] as any);

      const oursTracer = new TraceMap(ours as any);
      const metroTracer = new TraceMap(metro as any);

      const probes = [
        { line: 1, column: 0 },
        { line: 1, column: 4 },
        { line: 1, column: 7 },
        { line: 1, column: 9 },
        { line: 1, column: 13 },
        { line: 1, column: 18 },
        { line: 1, column: 24 },
        { line: 1, column: 30 },
      ];

      for (const probe of probes) {
        const oursPos = originalPositionFor(oursTracer, probe);
        const metroPos = originalPositionFor(metroTracer, probe);
        expect({ probe, ...oursPos }).toEqual({ probe, ...metroPos });
      }
    });
  });
});

describe('rawMappingsToEncodedMap', () => {
  it('encodes Babel rawMappings so positions trace back through the encoded map', () => {
    const rawMappings: BabelSourceMapSegment[] = [
      {
        generated: { line: 1, column: 0 },
        original: { line: 3, column: 0 },
        source: 'helloworld.js',
      },
      {
        generated: { line: 1, column: 5 },
        original: { line: 3, column: 8 },
        source: 'helloworld.js',
        name: 'greet',
      },
      {
        generated: { line: 2, column: 0 },
        original: { line: 5, column: 0 },
        source: 'helloworld.js',
      },
    ];

    const encoded = rawMappingsToEncodedMap({
      filename: 'helloworld.js',
      source: 'console.log(1)\nconsole.log(2)\nconsole.log(3)\n',
      rawMappings,
    });

    expect(encoded.version).toBe(3);
    expect(encoded.sources).toEqual(['helloworld.js']);
    expect(encoded.sourcesContent).toEqual(['console.log(1)\nconsole.log(2)\nconsole.log(3)\n']);

    const tracer = new TraceMap(encoded);
    expect(originalPositionFor(tracer, { line: 1, column: 0 })).toMatchObject({
      source: 'helloworld.js',
      line: 3,
      column: 0,
    });
    expect(originalPositionFor(tracer, { line: 1, column: 5 })).toMatchObject({
      source: 'helloworld.js',
      line: 3,
      column: 8,
      name: 'greet',
    });
    expect(originalPositionFor(tracer, { line: 2, column: 0 })).toMatchObject({
      source: 'helloworld.js',
      line: 5,
      column: 0,
    });
  });

  it('encodes sourceless rawMappings (no `original`) as sourceless mappings', () => {
    const rawMappings: BabelSourceMapSegment[] = [
      { generated: { line: 1, column: 0 } },
      { generated: { line: 1, column: 4 }, original: { line: 1, column: 0 }, source: 'a.js' },
    ];
    const encoded = rawMappingsToEncodedMap({
      filename: 'a.js',
      source: 'foo\n',
      rawMappings,
    });
    const tracer = new TraceMap(encoded);
    expect(originalPositionFor(tracer, { line: 1, column: 0 })).toMatchObject({
      source: null,
      line: null,
      column: null,
    });
    expect(originalPositionFor(tracer, { line: 1, column: 4 })).toMatchObject({
      source: 'a.js',
      line: 1,
      column: 0,
    });
  });

  it('returns a valid encoded map for empty input', () => {
    const encoded = rawMappingsToEncodedMap({
      filename: 'a.js',
      source: '',
      rawMappings: [],
    });
    expect(encoded.version).toBe(3);
    expect(encoded.sources).toEqual(['a.js']);
    expect(encoded.mappings).toBe('');
  });
});

// Minimal `Module<JsOutput>`-shaped fake: only the fields the encoder
// reads (`output[].data.{code,map,functionMap,lineCount}`, `path`,
// `getSource()`) are populated.
function fakeJsModule(opts: {
  path: string;
  code?: string;
  source?: string;
  map: MetroSourceMapSegmentTuple[];
  lineCount?: number;
}): any {
  const code = opts.code ?? `// ${opts.path}\n`;
  const source = opts.source ?? code;
  return {
    path: opts.path,
    output: [
      {
        type: 'js/module',
        data: {
          code,
          lineCount: opts.lineCount ?? code.split(/\r\n?|\n/).length,
          map: opts.map,
          functionMap: null,
        },
      },
    ],
    dependencies: new Map(),
    inverseDependencies: new Set(),
    getSource: () => Buffer.from(source),
  };
}

function defaultOptions() {
  return {
    excludeSource: true,
    processModuleFilter: () => true,
    shouldAddToIgnoreList: () => false,
  };
}

describe('sourceMapString', () => {
  it('does not fire the lazy `data.map` getter when `__packedMap` is present', () => {
    // Reading `data.map` would allocate a Proxy per module per encode
    // pass for nothing — the fast path goes through `__packedMap`.
    const mod = fakeJsModule({
      path: '/foo.js',
      map: [
        [1, 0, 1, 0],
        [1, 5, 2, 0, 'foo'],
      ],
    });
    installPackedMap(mod.output[0].data, mod.output[0].data.map);

    let getCount = 0;
    const descriptor = Object.getOwnPropertyDescriptor(mod.output[0].data, 'map')!;
    Object.defineProperty(mod.output[0].data, 'map', {
      get() {
        getCount++;
        return descriptor.get!.call(mod.output[0].data);
      },
      enumerable: true,
      configurable: true,
    });

    sourceMapString([mod], defaultOptions());
    expect(getCount).toBe(0);
  });

  it('produces a sourcemap byte-equivalent to Metros for the same input', () => {
    // We feed Metro's `Generator` the same segments in the same order,
    // so the serialized output should match byte-for-byte. Tests cover
    // adjacents on the same line, sourceless mappings, named mappings,
    // and module-boundary transitions.
    const metroSourceMapString: typeof import('@expo/metro/metro/DeltaBundler/Serializers/sourceMapString.js').sourceMapString =
      require('@expo/metro/metro/DeltaBundler/Serializers/sourceMapString.js').sourceMapString;

    const modules = [
      fakeJsModule({
        path: '/a.js',
        code: 'A1\nA2\nA3\n',
        map: [
          [1, 0, 1, 0],
          [1, 4, 1, 0],
          [2, 0, 2, 0, 'foo'],
          [3, 0],
          [3, 4, 3, 4],
        ],
      }),
      fakeJsModule({
        path: '/b.js',
        code: 'B1\n',
        map: [[1, 0, 10, 0, 'bar']],
      }),
    ];

    const ours = JSON.parse(sourceMapString(modules, defaultOptions()));
    const theirs = JSON.parse(metroSourceMapString(modules, defaultOptions()));
    expect(ours).toEqual(theirs);
  });

  it('sourceMapStringNonBlocking returns the same output as sourceMapString', async () => {
    const modules = [
      fakeJsModule({
        path: '/a.js',
        code: 'a\nb\nc\n',
        map: [
          [1, 0, 1, 0],
          [2, 0, 2, 0],
        ],
      }),
      fakeJsModule({
        path: '/b.js',
        code: 'd\n',
        map: [[1, 0, 1, 0]],
      }),
    ];

    const sync = sourceMapString(modules, defaultOptions());
    const async = await sourceMapStringNonBlocking(modules, defaultOptions());
    expect(async).toEqual(sync);
  });

  describe('debugId emission', () => {
    const fixture = () =>
      fakeJsModule({
        path: '/foo.js',
        code: 'a\n',
        map: [[1, 0, 1, 0]],
      });

    it('emits debugId inline during build (no JSON.parse roundtrip needed)', () => {
      const json = sourceMapString([fixture()], { ...defaultOptions(), debugId: 'abc-123' });
      const map = JSON.parse(json);
      expect(map.debugId).toBe('abc-123');
      expect(typeof map.mappings).toBe('string');
      expect(Array.isArray(map.sources)).toBe(true);
    });

    it('omits debugId when option is not provided', () => {
      const json = sourceMapString([fixture()], defaultOptions());
      const map = JSON.parse(json);
      expect('debugId' in map).toBe(false);
    });

    it('escapes special characters in debugId via JSON.stringify', () => {
      const id = 'has "quote" and \\ backslash';
      const json = sourceMapString([fixture()], { ...defaultOptions(), debugId: id });
      expect(JSON.parse(json).debugId).toBe(id);
    });

    it('produces output identical to a manual JSON.parse + add + JSON.stringify roundtrip', () => {
      const baseline = sourceMapString([fixture()], defaultOptions());
      const baselineWithId = JSON.stringify({ ...JSON.parse(baseline), debugId: 'roundtrip' });
      const ours = sourceMapString([fixture()], { ...defaultOptions(), debugId: 'roundtrip' });
      expect(JSON.parse(ours)).toEqual(JSON.parse(baselineWithId));
    });

    it('appendDebugIdToSourceMap injects without parsing', () => {
      const baseline = sourceMapString([fixture()], defaultOptions());
      const injected = appendDebugIdToSourceMap(baseline, 'after-the-fact');
      const map = JSON.parse(injected);
      expect(map.debugId).toBe('after-the-fact');
      expect(JSON.parse(baseline).debugId).toBeUndefined();
    });
  });

  describe('CI guard: @expo/metro/metro-source-map/Generator import shape', () => {
    it('exposes Generator via .default and the prototype methods we use', () => {
      const Generator: any = require('@expo/metro/metro-source-map/Generator').default;
      expect(typeof Generator).toBe('function');
      const proto = Generator.prototype;
      for (const m of [
        'addSimpleMapping',
        'addSourceMapping',
        'addNamedSourceMapping',
        'startFile',
        'endFile',
        'toString',
        'toMap',
      ]) {
        expect(typeof proto[m]).toBe('function');
      }
    });
  });

  describe('patchMetroSourceMapStringForPackedMaps', () => {
    const STOCK_PATH = '@expo/metro/metro/DeltaBundler/Serializers/sourceMapString';

    afterEach(() => {
      // Repair the live module so other tests asserting against Metro's
      // stock implementation don't see the patched references.
      jest.resetModules();
    });

    it('replaces both stock exports with Expo`s encoder', () => {
      const stock = require(STOCK_PATH);
      const originalSync = stock.sourceMapString;
      const originalAsync = stock.sourceMapStringNonBlocking;
      expect(originalSync).not.toBe(sourceMapString);
      expect(originalAsync).not.toBe(sourceMapStringNonBlocking);

      patchMetroSourceMapStringForPackedMaps();

      expect(stock.sourceMapString).toBe(sourceMapString);
      expect(stock.sourceMapStringNonBlocking).toBe(sourceMapStringNonBlocking);
    });

    it('is idempotent — repeat calls leave the references unchanged', () => {
      patchMetroSourceMapStringForPackedMaps();
      const after1 = require(STOCK_PATH);
      const sync1 = after1.sourceMapString;
      const async1 = after1.sourceMapStringNonBlocking;

      patchMetroSourceMapStringForPackedMaps();

      expect(after1.sourceMapString).toBe(sync1);
      expect(after1.sourceMapStringNonBlocking).toBe(async1);
    });
  });
});
