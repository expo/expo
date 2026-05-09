import { GenMapping, addMapping, toEncodedMap } from '@jridgewell/gen-mapping';
import { TraceMap, originalPositionFor } from '@jridgewell/trace-mapping';

import { composeSourceMaps, type ComposableSourceMap } from '../sourceMap';

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
