import { vlqMapFromTuples } from '@expo/metro/metro-source-map';
import { GenMapping, addMapping, toEncodedMap } from '@jridgewell/gen-mapping';
import { encode } from '@jridgewell/sourcemap-codec';
import { TraceMap, originalPositionFor } from '@jridgewell/trace-mapping';

import {
  appendDebugIdToSourceMap,
  composeSourceMaps,
  flattenSourceMap,
  rawMappingsToEncodedMap,
  sourceMapString,
  sourceMapStringNonBlocking,
  vlqMapFromDecodedMap,
  vlqMapFromEncodedMap,
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
    if (s.source && s.original && s.name != null) {
      addMapping(gen, {
        generated: s.generated,
        source: s.source,
        original: s.original,
        name: s.name,
      });
    } else if (s.source && s.original) {
      addMapping(gen, { generated: s.generated, source: s.source, original: s.original });
    } else {
      addMapping(gen, { generated: s.generated });
    }
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

  it('tolerates a segment with a negative original position (Hermes no-location sentinel)', () => {
    const bundler = buildMap({
      file: 'bundle.js',
      segments: [
        { generated: { line: 1, column: 0 }, source: 'a.js', original: { line: 1, column: 0 } },
        { generated: { line: 1, column: 10 }, source: 'a.js', original: { line: 2, column: 0 } },
      ],
    });

    // Raw (0-based) segments for the single generated line:
    //   genCol 0 -> bundle.js 1:0
    //   genCol 3 -> no original location  (the sentinel that crashes)
    //   genCol 6 -> bundle.js 1:10
    const hermes: ComposableSourceMap = {
      version: 3,
      file: 'bundle.hbc',
      sources: ['bundle.js'],
      names: [],
      mappings: encode([
        [
          [0, 0, 0, 0],
          [3, 0, -1, -1],
          [6, 0, 0, 10],
        ],
      ]),
    };

    let composed!: ComposableSourceMap;
    expect(() => {
      composed = composeSourceMaps([bundler, hermes]);
    }).not.toThrow();

    const tracer = new TraceMap(composed as any);
    // Real-location segments still trace all the way back to the source.
    expect(originalPositionFor(tracer, { line: 1, column: 0 })).toMatchObject({
      source: 'a.js',
      line: 1,
      column: 0,
    });
    expect(originalPositionFor(tracer, { line: 1, column: 6 })).toMatchObject({
      source: 'a.js',
      line: 2,
      column: 0,
    });
    // The sentinel resolves to "no original location" rather than crashing.
    expect(originalPositionFor(tracer, { line: 1, column: 3 })).toMatchObject({
      source: null,
    });
  });

  it('tolerates a segment with a negative source index', () => {
    const bundler = buildMap({
      file: 'bundle.js',
      segments: [
        { generated: { line: 1, column: 0 }, source: 'a.js', original: { line: 1, column: 0 } },
        { generated: { line: 1, column: 10 }, source: 'a.js', original: { line: 2, column: 0 } },
      ],
    });

    // Raw (0-based) segments for the single generated line:
    //   genCol 0 -> bundle.js 1:0
    //   genCol 3 -> source index -1  (crashes trace-mapping via `sources[-1]`)
    //   genCol 6 -> bundle.js 1:10
    const hermes: ComposableSourceMap = {
      version: 3,
      file: 'bundle.hbc',
      sources: ['bundle.js'],
      names: [],
      mappings: encode([
        [
          [0, 0, 0, 0],
          [3, -1, 0, 0],
          [6, 0, 0, 10],
        ],
      ]),
    };

    let composed!: ComposableSourceMap;
    expect(() => {
      composed = composeSourceMaps([bundler, hermes]);
    }).not.toThrow();

    const tracer = new TraceMap(composed as any);
    expect(originalPositionFor(tracer, { line: 1, column: 0 })).toMatchObject({
      source: 'a.js',
      line: 1,
      column: 0,
    });
    // The negative source index resolves to "no original location".
    expect(originalPositionFor(tracer, { line: 1, column: 3 })).toMatchObject({
      source: null,
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

  it('flattens an indexed bundler map before composing', () => {
    // Metro emits bundle maps as indexed maps, one section per module
    const bundler = {
      version: 3,
      sections: [
        {
          offset: { line: 0, column: 0 },
          map: buildMap({
            segments: [
              {
                generated: { line: 1, column: 0 },
                source: 'a.js',
                original: { line: 3, column: 0 },
              },
            ],
          }),
        },
        {
          offset: { line: 1, column: 0 },
          map: buildMap({
            segments: [
              {
                generated: { line: 1, column: 0 },
                source: 'b.js',
                original: { line: 7, column: 2 },
              },
            ],
          }),
        },
      ],
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
          generated: { line: 1, column: 5 },
          source: 'bundle.js',
          original: { line: 2, column: 0 },
        },
      ],
    });

    const tracer = new TraceMap(composeSourceMaps([bundler, hermes]) as any);
    expect(originalPositionFor(tracer, { line: 1, column: 0 })).toMatchObject({
      source: 'a.js',
      line: 3,
      column: 0,
    });
    expect(originalPositionFor(tracer, { line: 1, column: 5 })).toMatchObject({
      source: 'b.js',
      line: 7,
      column: 2,
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

describe('flattenSourceMap', () => {
  it('returns a flat map unchanged', () => {
    const flat = buildMap({
      segments: [
        { generated: { line: 1, column: 0 }, source: 'a.js', original: { line: 1, column: 0 } },
      ],
    });
    expect(flattenSourceMap(flat)).toBe(flat);
  });

  it('flattens sections, carrying over ignore lists', () => {
    const flat = flattenSourceMap({
      version: 3,
      sections: [
        {
          offset: { line: 0, column: 0 },
          map: { version: 3, sources: ['user.js'], names: [], mappings: 'AAAA' },
        },
        {
          offset: { line: 1, column: 0 },
          map: {
            version: 3,
            sources: ['node_modules/lib.js'],
            names: ['x'],
            mappings: 'AAAAA',
            x_google_ignoreList: [0],
          },
        },
      ],
    });
    expect(flat).toMatchObject({
      sources: ['user.js', 'node_modules/lib.js'],
      names: ['x'],
      mappings: 'AAAA;ACAAA',
      ignoreList: [1],
    });
  });
});

describe('vlqMapFromDecodedMap', () => {
  it('terminates an empty map one past the last column of the code', () => {
    expect(vlqMapFromDecodedMap(null, 'a\nbc')).toEqual({
      lineCount: 2,
      map: vlqMapFromTuples([[2, 2]]),
    });
  });

  it('does not add a terminating mapping when the last mapping is already there', () => {
    const { map } = vlqMapFromDecodedMap({ mappings: [[[0, 0, 0, 0]], [[2]]], names: [] }, 'a\nbc');
    expect(map).toEqual(
      vlqMapFromTuples([
        [1, 0, 1, 0],
        [2, 2],
      ])
    );
  });
});

describe('vlqMapFromEncodedMap', () => {
  it('matches Metro encoding the same mappings as tuples', () => {
    const encoded = {
      mappings: encode([
        [
          [0, 0, 0, 0],
          [4, 0, 0, 4, 0],
        ],
        [[0, 0, 1, 0]],
      ]),
      names: ['foo'],
    };
    expect(vlqMapFromEncodedMap(encoded, 'abcdefgh\nij')).toEqual({
      lineCount: 2,
      map: vlqMapFromTuples([
        [1, 0, 1, 0],
        [1, 4, 1, 4, 'foo'],
        [2, 0, 2, 0],
        [2, 2],
      ]),
    });
  });
});

// Minimal `Module<JsOutput>`-shaped fake: only the fields the source map
// serializer reads (`output[].data.{code,map,functionMap,lineCount}`, `path`,
// `getSource()`) are populated.
function fakeJsModule(opts: {
  path: string;
  code: string;
  map: MetroSourceMapSegmentTuple[];
}): any {
  const { code } = opts;
  return {
    path: opts.path,
    output: [
      {
        type: 'js/module',
        data: {
          code,
          lineCount: code.split(/\r\n?|\n/).length,
          map: vlqMapFromTuples(opts.map),
          functionMap: null,
        },
      },
    ],
    dependencies: new Map(),
    inverseDependencies: new Set(),
    getSource: () => Buffer.from(code),
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

    it('emits debugId without a JSON.parse roundtrip', () => {
      const map = JSON.parse(
        sourceMapString([fixture()], { ...defaultOptions(), debugId: 'abc-123' })
      );
      expect(map.debugId).toBe('abc-123');
    });

    it('omits debugId when option is not provided', () => {
      const map = JSON.parse(sourceMapString([fixture()], defaultOptions()));
      expect('debugId' in map).toBe(false);
    });

    it('escapes special characters in debugId via JSON.stringify', () => {
      const id = 'has "quote" and \\ backslash';
      const json = sourceMapString([fixture()], { ...defaultOptions(), debugId: id });
      expect(JSON.parse(json).debugId).toBe(id);
    });

    it('emits debugId from sourceMapStringNonBlocking', async () => {
      const json = await sourceMapStringNonBlocking([fixture()], {
        ...defaultOptions(),
        debugId: 'async-id',
      });
      expect(JSON.parse(json).debugId).toBe('async-id');
    });

    it('appendDebugIdToSourceMap injects without parsing', () => {
      const baseline = sourceMapString([fixture()], defaultOptions());
      const injected = appendDebugIdToSourceMap(baseline, 'after-the-fact');
      expect(JSON.parse(injected).debugId).toBe('after-the-fact');
      expect(JSON.parse(baseline).debugId).toBeUndefined();
    });
  });
});
