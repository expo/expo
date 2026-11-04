import type { Module } from '@expo/metro/metro/DeltaBundler';
import baseJSBundle from '@expo/metro/metro/DeltaBundler/Serializers/baseJSBundle';
import bundleToString from '@expo/metro/metro/lib/bundleToString';
import { TraceMap, originalPositionFor } from '@jridgewell/trace-mapping';
import { performance } from 'node:perf_hooks';
import vm from 'node:vm';

import * as graphAssets from '../../transform-worker/getAssets';
import { createGranularChunkingStrategy } from '../chunking/createGranularChunkingStrategy';
import * as workerScan from '../chunking/findUnsupportedWorkerAsyncDependency';
import { microBundle, projectRoot } from '../fork/__tests__/mini-metro';
import {
  createJSVirtualModule,
  serializeSplitAsync,
  serializeTo,
} from '../fork/__tests__/serializer-test-utils';
import type { ExpoSerializerOptions } from '../fork/baseJSBundle';
import * as chunkSerializer from '../serializeChunks';
import { serializeServerBundleAsync } from '../serializeServerBundle';
import { flattenSourceMap } from '../sourceMap';
import type { SerialAsset, Serializer } from '../withExpoSerializers';
import {
  createSerializerFromSerialProcessors,
  withSerializerPlugins,
} from '../withExpoSerializers';

it.each([
  '// Custom serializer footer\n//# sourceMappingURL=index.js.map',
  '/* Custom serializer\nfooter */\n//# sourceMappingURL=index.js.map',
  '// Custom serializer footer without a final newline',
  '// Custom serializer footer\r\n//# sourceMappingURL=index.js.map',
])('exports server entries through custom serializers with footer comments: %s', async (footer) => {
  const args = await microBundle({
    fs: { 'index.js': `import './setup'; export const value = 42;`, 'setup.js': '' },
    options: { isServer: true, dev: false },
  });
  args[3] = {
    ...args[3],
    getRunModuleStatement: (id) => `__r(${JSON.stringify(id)});`,
    runBeforeMainModule: [projectRoot + '/setup.js'],
  };
  const serializer = withSerializerPlugins(
    {
      projectRoot,
      serializer: {
        customSerializer: async (...props: Parameters<typeof baseJSBundle>) =>
          bundleToString(baseJSBundle(...props)).code + '\n' + footer,
      },
    },
    []
  ).serializer.customSerializer;
  const source = (await serializer(...args)) as string;
  const entry = { GET: () => 'hello' };
  const module = { exports: {} };
  vm.runInNewContext(source, { module, __d() {}, __r: () => entry });
  expect(module.exports).toBe(entry);
  expect(source).toContain(`__r(${JSON.stringify(projectRoot + '/setup.js')});`);
  expect(source).toContain(`module.exports = __r(${JSON.stringify(args[0])});`);
  expect(source.endsWith(footer)).toBe(true);
});

it.each([
  [false, false],
  [true, false],
  [true, true],
])(
  'normalizes conventional custom server maps (exclude source: %s, inline: %s)',
  async (excludeSource, inlineSourceMap) => {
    const args = await microBundle({
      fs: { 'index.js': 'export const value = 42;' },
      options: { dev: true, isServer: true, sourceMaps: true },
    });
    const custom = {
      code: 'module.exports = 42;',
      map: JSON.stringify({
        version: 3,
        debugId: 'custom-id',
        sections: [
          {
            offset: { line: 0, column: 0 },
            map: {
              version: 3,
              sources: ['custom://project/entry.ts'],
              sourcesContent: ['source text'],
              names: [],
              mappings: 'AAAA',
              x_google_ignoreList: [0],
            },
          },
        ],
      }),
    };
    if (inlineSourceMap)
      custom.code +=
        '\n//# sourceMappingURL=data:application/json;base64,' +
        Buffer.from(custom.map).toString('base64');
    const serializer = withSerializerPlugins(
      { projectRoot, serializer: { customSerializer: (async () => custom) as Serializer } },
      []
    ).serializer.customSerializer;
    const result = (await serializer(args[0], args[1], args[2], {
      ...args[3],
      inlineSourceMap,
      serializerOptions: { excludeSource },
    } as ExpoSerializerOptions)) as { code: string; map: string };
    const map = JSON.parse(result.map);
    if (inlineSourceMap) {
      const embedded = Buffer.from(result.code.match(/base64,([^\n]+)/)![1]!, 'base64').toString();
      expect(JSON.parse(embedded)).toEqual(map);
    } else expect(result.code).toBe(custom.code);
    expect(map.sections).toBeUndefined();
    expect(map).toMatchObject({
      debugId: 'custom-id',
      sources: ['custom://project/entry.ts'],
      mappings: 'AAAA',
      ignoreList: [0],
      x_google_ignoreList: [0],
    });
    expect(map.sourcesContent).toEqual(excludeSource ? undefined : ['source text']);
  }
);

it('retains graph CSS and Metro assets when adapting custom server output', async () => {
  const [entry, premodules, graph, options] = await microBundle({
    fs: { 'index.js': 'export const value = 42;' },
    options: { isServer: true, dev: false, output: 'static' },
  });
  const module = graph.dependencies.get(entry)!;
  (module.output[0]!.data as any).css = { code: 'body { color: red; }' };
  const assets = [{ name: 'icon', type: 'png' }] as Awaited<ReturnType<typeof graphAssets.default>>;
  const getAssets = jest.spyOn(graphAssets, 'default').mockResolvedValueOnce(assets);
  let result;
  try {
    result = await serializeServerBundleAsync(
      { code: 'module.exports = { custom: true };', map: '' },
      entry,
      premodules,
      graph,
      options
    );
  } finally {
    getAssets.mockRestore();
  }
  expect(result.artifacts).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ type: 'css', source: 'body { color: red; }' }),
      expect.objectContaining({ type: 'js', source: 'module.exports = { custom: true };' }),
    ])
  );
  expect(result.assets).toBe(assets);
});

it.each([false, true])(
  'adapts a custom server bundle without replacing its map (inline: %s)',
  async (inlineSourceMap) => {
    const [entry, premodules, graph, options] = await microBundle({
      fs: { 'index.js': `export const value = 42;` },
      options: { isServer: true, dev: false, output: 'static', sourceMaps: true },
    });
    const code =
      'module.exports = { custom: true };\n//# sourceMappingURL=old.js.map\n//# debugId=01234567-89ab-4cde-8fab-0123456789ab';
    const { artifacts } = await serializeServerBundleAsync(
      {
        code,
        map: JSON.stringify({
          version: 3,
          sections: [
            {
              offset: { line: 0, column: 0 },
              map: {
                version: 3,
                sources: ['custom://project/original.ts'],
                sourcesContent: ['original source'],
                names: ['custom'],
                mappings: 'AAAAA',
              },
            },
          ],
          debugId: '01234567-89ab-4cde-8fab-0123456789ab',
        }),
      },
      entry,
      premodules,
      graph,
      {
        ...options,
        inlineSourceMap,
        serializerOptions: {
          ...(options as ExpoSerializerOptions).serializerOptions,
          entryFilename: '_expo/server/hello world.cjs',
          excludeSource: true,
        },
      }
    );
    const js = artifacts.find((asset) => asset.type === 'js')!;
    expect(js.filename).toBe('_expo/server/hello world.cjs');
    expect(js.source.startsWith('module.exports = { custom: true };')).toBe(true);
    expect(js.source).not.toContain('old.js.map');
    const map = inlineSourceMap
      ? JSON.parse(Buffer.from(js.source.split('base64,')[1]!, 'base64').toString())
      : JSON.parse(artifacts.find((asset) => asset.type === 'map')!.source);
    expect(map).toMatchObject({
      sources: ['custom://project/original.ts'],
      names: ['custom'],
      mappings: 'AAAAA',
      debugId: '01234567-89ab-4cde-8fab-0123456789ab',
    });
    expect(map.sections).toBeUndefined();
    expect(map.sourcesContent).toBeUndefined();
    if (!inlineSourceMap)
      expect(js.source).toContain(
        '//# sourceMappingURL=hello%20world.cjs.map\n//# debugId=01234567-89ab-4cde-8fab-0123456789ab'
      );
  }
);

it.each([false, true])(
  'normalizes supplied server map paths (inline: %s)',
  async (inlineSourceMap) => {
    const args = await microBundle({
      fs: { 'index.js': 'export const value = 42;' },
      options: { isServer: true, dev: false, output: 'static', sourceMaps: true },
    });
    const sourceMap = {
      version: 3,
      sources: [
        '/app/index.js',
        '/app/shared.ts',
        '/app-other/outside.ts',
        'custom://project/original.ts',
      ],
      sourcesContent: ['entry', 'shared', 'outside', 'custom'],
      names: [],
      mappings: 'AAAA,CCAA,CCAA,CCAA',
    };
    for (const indexed of [false, true]) {
      const result = await serializeServerBundleAsync(
        {
          code: 'module.exports = 42;',
          map: JSON.stringify(
            indexed
              ? { version: 3, sections: [{ offset: { line: 0, column: 0 }, map: sourceMap }] }
              : sourceMap
          ),
        },
        args[0],
        args[1],
        args[2],
        {
          ...args[3],
          inlineSourceMap,
          serializerOptions: {
            ...(args[3] as ExpoSerializerOptions).serializerOptions,
            excludeSource: true,
          },
        }
      );
      const map = JSON.parse(
        inlineSourceMap
          ? Buffer.from(result.artifacts[0]!.source.split('base64,')[1]!, 'base64').toString()
          : result.artifacts.find((asset) => asset.type === 'map')!.source
      );
      expect(map.sources).toEqual([
        '/index.js',
        '/shared.ts',
        '/app-other/outside.ts',
        'custom://project/original.ts',
      ]);
      expect(map.sourcesContent).toBeUndefined();
    }
  }
);

it('adapts a string server bundle without changing embedded directives or entry exports', async () => {
  const [entry, premodules, graph, options] = await microBundle({
    fs: { 'index.js': `export const value = 42;` },
    options: { isServer: true, dev: false, output: 'static', sourceMaps: true },
  });
  const embedded =
    'const text = `\n//# sourceMappingURL=embedded.map\n`;\nmodule.exports = __r(1);\n// Custom serializer footer';
  const { artifacts } = await serializeServerBundleAsync(
    embedded +
      '\n//# sourceMappingURL=old.js.map\n//# sourceURL=http://localhost/index.bundle\n//# debugId=old-id',
    entry,
    premodules,
    graph,
    {
      ...options,
      serializerOptions: {
        ...(options as ExpoSerializerOptions).serializerOptions,
        outputDirectory: '_expo/server',
        outputExtension: '.cjs',
        excludeSource: true,
      },
    }
  );
  const js = artifacts.find((asset) => asset.type === 'js')!;
  const map = JSON.parse(artifacts.find((asset) => asset.type === 'map')!.source);
  expect(js.filename).toMatch(/^_expo\/server\/index-.*\.cjs$/);
  expect(js.source).toContain(
    '//# sourceMappingURL=embedded.map\n`;\nmodule.exports = __r(1);\n// Custom serializer footer'
  );
  expect(js.source).not.toContain('old.js.map');
  expect(js.source).not.toContain('//# sourceURL=');
  expect(map.sources).toContain('/index.js');
  expect(map.sourcesContent).toBeUndefined();
  expect(js.source).toContain('//# debugId=' + map.debugId);
});

it.each(['client', 'node', 'react-server'])(
  'keeps %s map paths private without corrupting external paths',
  async (environment) => {
    const [entry, premodules, graph, options] = await microBundle({
      fs: { 'index.js': `import '../shared';`, '../shared.js': `export const value = 42;` },
      options: {
        isServer: environment === 'node',
        isReactServer: environment === 'react-server',
        dev: false,
        output: 'static',
        splitChunks: false,
        sourceMaps: true,
      },
    });
    const modulePaths: string[] = [];
    const serializerOptions: ExpoSerializerOptions = {
      ...options,
      shouldAddToIgnoreList(module) {
        modulePaths.push(module.path);
        return false;
      },
    };
    const serializer = createSerializerFromSerialProcessors({ projectRoot } as any, [], null);
    const { artifacts } = (await serializer(entry, premodules, graph, serializerOptions)) as any;
    const map = JSON.parse(artifacts.find((asset: SerialAsset) => asset.type === 'map')!.source);
    expect(flattenSourceMap(map).sources).toEqual(
      expect.arrayContaining(['/index.js', '../shared.js'])
    );
    expect(JSON.stringify(map)).not.toContain('/app/');
    expect(modulePaths).toEqual(expect.arrayContaining(['/app/index.js', '/shared.js']));
  }
);

it.each(['node', 'react-server'])(
  'links development %s exports to their sibling maps',
  async (environment) => {
    const [entry, premodules, graph, options] = await microBundle({
      fs: { 'index.js': 'export const value = 42;' },
      options: {
        isServer: environment === 'node',
        isReactServer: environment === 'react-server',
        dev: true,
        output: 'static',
        sourceMaps: true,
      },
    });
    const serializer = createSerializerFromSerialProcessors({ projectRoot } as any, [], null);
    const serializerOptions: ExpoSerializerOptions = {
      ...options,
      serializerOptions: {
        ...(options as ExpoSerializerOptions).serializerOptions,
        exporting: true,
        entryFilename: '_expo/server/render.js',
      },
    };
    const { artifacts } = (await serializer(
      entry,
      premodules,
      graph,
      serializerOptions
    )) as unknown as { artifacts: SerialAsset[] };
    expect(artifacts.find((asset) => asset.type === 'js')!.source).toContain(
      '//# sourceMappingURL=render.js.map'
    );
    expect(artifacts.find((asset) => asset.type === 'map')!.filename).toBe(
      '_expo/server/render.js.map'
    );
  }
);

it.each(['node', 'react-server'])(
  'normalizes exported %s artifacts before persistence',
  async (environment) => {
    const [entry, premodules, graph, options] = await microBundle({
      fs: { 'index.js': `export const value = 42;` },
      options: {
        isServer: environment === 'node',
        isReactServer: environment === 'react-server',
        dev: false,
        output: 'static',
        splitChunks: false,
        sourceMaps: true,
      },
    });
    const serializerOptions: ExpoSerializerOptions = {
      ...options,
      shouldAddToIgnoreList: (module) => module.path === entry,
    };
    serializerOptions.excludeSource = false;
    serializerOptions.serializerOptions = {
      ...serializerOptions.serializerOptions,
      entryFilename: '_expo/server/hello world.js',
      excludeSource: true,
    };
    const serializer = createSerializerFromSerialProcessors({ projectRoot } as any, [], null);
    const { artifacts } = (await serializer(entry, premodules, graph, serializerOptions)) as any;
    const js = artifacts.find((a: SerialAsset) => a.type === 'js');
    const map = JSON.parse(artifacts.find((a: SerialAsset) => a.type === 'map').source);
    expect(js.source).toContain('//# sourceMappingURL=hello%20world.js.map');
    expect(js.source).toContain('module.exports = ');
    expect(map.sections).toBeUndefined();
    expect(map.sources).toContain('/index.js');
    expect(map.sourcesContent).toBeUndefined();
    expect(map.ignoreList).toEqual([map.sources.indexOf('/index.js')]);
    expect(map.x_google_ignoreList).toEqual(map.ignoreList);
    expect(js.source).toContain('//# debugId=' + map.debugId);
    serializerOptions.excludeSource = true;
    serializerOptions.serializerOptions.excludeSource = false;
    const included = (await serializer(entry, premodules, graph, serializerOptions)) as any;
    expect(included.artifacts.find((a: SerialAsset) => a.type === 'map').source).toContain(
      'export const value = 42;'
    );
  }
);

it.each(['node', 'react-server'])(
  'keeps %s development maps aligned with plugin-injected premodules',
  async (environment) => {
    for (const inlineSourceMap of [false, true]) {
      const args = await microBundle({
        fs: { 'index.js': 'export const value = 42;' },
        options: {
          dev: true,
          sourceMaps: true,
          isServer: environment === 'node',
          isReactServer: environment === 'react-server',
        },
      });
      const serializer = createSerializerFromSerialProcessors({ projectRoot } as any, [], null, {
        unstable_beforeAssetSerializationPlugins: [
          ({ premodules }) => [
            createJSVirtualModule('injected', 'globalThis.injected = true;\n\n'),
            ...premodules,
          ],
        ],
      });
      const result = (await serializer(args[0], args[1], args[2], {
        ...args[3],
        inlineSourceMap,
      })) as { code: string; map: string };
      expect(typeof result).toBe('object');
      const lines = result.code.split('\n');
      const line = lines.findIndex((line) => line.includes('const value = 42'));
      const map = new TraceMap(JSON.parse(result.map));
      expect(
        originalPositionFor(map, { line: line + 1, column: lines[line]!.indexOf('const') })
      ).toMatchObject({ source: '/app/index.js', line: 1 });
      if (inlineSourceMap) {
        const inline = Buffer.from(result.code.match(/base64,([^\n]+)/)![1]!, 'base64').toString();
        expect(JSON.parse(inline)).toEqual(JSON.parse(result.map));
      }
    }
  }
);

it.each([
  [undefined, false],
  ['static', false],
  [undefined, true],
  ['static', true],
] as const)(
  'yields during slow source collection for %s server output (inline: %s)',
  async (output, inlineSourceMaps) => {
    const args = await microBundle({
      fs: {
        'index.js': "import './a'; import './b'; import './c'; export const value = 42;",
        'a.js': 'console.log(1);',
        'b.js': 'console.log(2);',
        'c.js': 'console.log(3);',
      },
      options: { dev: true, isServer: true, sourceMaps: true, output, inlineSourceMaps },
    });
    for (const module of args[2].dependencies.values()) {
      const getSource = module.getSource.bind(module);
      Object.defineProperty(module, 'getSource', {
        value: () => {
          const start = performance.now();
          while (performance.now() - start < 20) {}
          return getSource();
        },
      });
    }
    const serializer = createSerializerFromSerialProcessors({ projectRoot } as any, [], null);
    let yielded = false;
    const tick = setImmediate(() => {
      yielded = true;
    });
    try {
      await serializer(...args);
      expect(yielded).toBe(true);
    } finally {
      clearImmediate(tick);
    }
  }
);

it.each(['node', 'react-server'])(
  'exports conventional %s entries through the run-module callback',
  async (environment) => {
    const [entry, premodules, graph, options] = await microBundle({
      fs: {
        'index.js': `import './bootstrap'; export const value = 42;`,
        'bootstrap.js': `globalThis.boot = true;`,
      },
      options: {
        dev: true,
        sourceMaps: true,
        isServer: environment === 'node',
        isReactServer: environment === 'react-server',
      },
    });
    const serializer = createSerializerFromSerialProcessors(
      {
        projectRoot,
        serializer: {
          getModulesRunBeforeMainModule: () => {
            throw new Error('Pre-main modules were already supplied');
          },
        },
      } as any,
      [],
      null
    );
    const result = (await serializer(entry, premodules, graph, {
      ...options,
      sourceUrl: 'http://localhost/index.map',
      runBeforeMainModule: ['/app/bootstrap.js'],
      getRunModuleStatement: (moduleId) => `__r(${JSON.stringify(moduleId)});`,
    })) as { code: string; map: string };
    expect(result.code).toContain(
      '__r("/app/bootstrap.js");\nmodule.exports = __r("/app/index.js");'
    );
    expect(result.code).not.toContain('module.exports = __r("/app/bootstrap.js");');
    expect(JSON.parse(result.map).sources).toContain('/app/index.js');
  }
);

it.each(['true', '1'])(
  'honors excludeSource=%s in Metro inline-map requests',
  async (excludeSource) => {
    const [entry, premodules, graph, options] = await microBundle({
      fs: { 'index.js': `export const value = 42;` },
      options: { dev: true, sourceMaps: true },
    });
    const serializer = createSerializerFromSerialProcessors({ projectRoot } as any, [], null);
    const requestOptions: ExpoSerializerOptions = {
      ...options,
      inlineSourceMap: true,
      sourceUrl: 'http://localhost/index.bundle?excludeSource=' + excludeSource,
      serializerOptions: undefined,
    };
    const code = await serializer(entry, premodules, graph, requestOptions);
    expect(typeof code).toBe('string');
    const encoded = (code as string).match(
      /sourceMappingURL=data:application\/json[^,]*,([^\n]+)/
    )![1]!;
    const map = JSON.parse(Buffer.from(encoded, 'base64').toString());
    expect(JSON.stringify(map)).not.toContain('export const value = 42;');
  }
);

it.each([false, true])(
  'respects custom source URLs and source exclusion in single-bundle client maps (inline: %s)',
  async (inlineSourceMap) => {
    const [entry, premodules, graph, options] = await microBundle({
      fs: { 'index.js': `export const value = 42;` },
      options: { dev: true, sourceMaps: true },
    });
    const serializer = createSerializerFromSerialProcessors({ projectRoot } as any, [], null);
    const serializerOptions: ExpoSerializerOptions = {
      ...options,
      inlineSourceMap,
      sourceUrl: 'http://localhost/index.map',
      getSourceUrl: (module) => 'custom:///workspace/' + module.path.split('/').pop(),
      serializerOptions: { excludeSource: true },
    };
    const result = (await serializer(entry, premodules, graph, serializerOptions)) as {
      code: string;
      map: string;
    };
    const map = inlineSourceMap
      ? JSON.parse(
          Buffer.from(
            result.code.match(/sourceMappingURL=data:application\/json[^,]*,([^\n]+)/)![1]!,
            'base64'
          ).toString()
        )
      : JSON.parse(result.map);
    expect(flattenSourceMap(map).sources).toContain('custom:///workspace/index.js');
    expect(JSON.stringify(map)).not.toContain('export const value = 42;');
  }
);

it.each([false, true])('normalizes legacy server maps (inline: %s)', async (inlineSourceMap) => {
  const [entry, premodules, graph, options] = await microBundle({
    fs: { 'index.js': `export const value = 42;` },
    options: { isServer: true, dev: true, sourceMaps: true },
  });
  const serializer = createSerializerFromSerialProcessors({ projectRoot } as any, [], null);
  const serializerOptions: ExpoSerializerOptions = {
    ...options,
    inlineSourceMap,
    sourceUrl: 'http://localhost/index.map',
    serializerOptions: { excludeSource: true },
  };
  const result = (await serializer(entry, premodules, graph, serializerOptions)) as {
    code: string;
    map: string;
  };
  const map = inlineSourceMap
    ? JSON.parse(
        Buffer.from(
          result.code.match(/sourceMappingURL=data:application\/json[^,]*,([^\n]+)/)![1]!,
          'base64'
        ).toString()
      )
    : JSON.parse(result.map);
  expect(map.sections).toBeUndefined();
  expect(map.sourcesContent).toBeUndefined();
  expect(map.sources).toContain('/app/index.js');
});

it('excludes the omitted runtime from modules-only server maps', async () => {
  const [entry, premodules, graph, options] = await microBundle({
    fs: { 'index.js': `export const value = 42;` },
    preModulesFs: { 'runtime.js': 'var runtime = true;' },
    options: { isServer: true, dev: false, output: 'static', splitChunks: false, sourceMaps: true },
  });
  const serializer = createSerializerFromSerialProcessors({ projectRoot } as any, [], null);
  const { artifacts } = (await serializer(entry, premodules, graph, {
    ...options,
    modulesOnly: true,
  })) as any;
  const map = JSON.parse(artifacts.find((a: SerialAsset) => a.type === 'map').source);
  expect(map.sources).not.toContain('/runtime.js');
});

it('normalizes inline server maps and excludes requested source content', async () => {
  const [entry, premodules, graph, options] = await microBundle({
    fs: { 'index.js': `export const value = 42;` },
    options: { isServer: true, dev: false, output: 'static', splitChunks: false, sourceMaps: true },
  });
  const opts: ExpoSerializerOptions = { ...options, inlineSourceMap: true };
  opts.serializerOptions!.excludeSource = true;
  const serializer = createSerializerFromSerialProcessors({ projectRoot } as any, [], null);
  const { artifacts } = (await serializer(entry, premodules, graph, opts)) as any;
  const js = artifacts.find((a: SerialAsset) => a.type === 'js');
  const encoded = js.source.match(/sourceMappingURL=data:application\/json[^,]*,([^\n]+)/)[1];
  const map = JSON.parse(Buffer.from(encoded, 'base64').toString());
  expect(map.sections).toBeUndefined();
  expect(map.sources).toContain('/index.js');
  expect(map.sourcesContent).toBeUndefined();
  expect(artifacts.some((a: SerialAsset) => a.type === 'map')).toBe(false);
});

it('names generated server artifacts in their final directory with an explicit extension', async () => {
  const [entry, premodules, graph, options] = await microBundle({
    fs: { 'index.js': `export const value = 42;` },
    options: { isServer: true, dev: false, output: 'static', splitChunks: false, sourceMaps: true },
  });
  const opts = options as ExpoSerializerOptions;
  opts.serializerOptions!.outputDirectory = '_expo/rsc/web';
  opts.serializerOptions!.outputExtension = '.cjs';
  const serializer = createSerializerFromSerialProcessors({ projectRoot } as any, [], null);
  const { artifacts } = (await serializer(entry, premodules, graph, opts)) as any;
  const js = artifacts.find((a: SerialAsset) => a.type === 'js');
  expect(js.filename).toMatch(/^_expo\/rsc\/web\/index-[a-f0-9]+\.cjs$/);
  expect(js.source).toContain('//# sourceMappingURL=' + js.filename.split('/').pop() + '.map');
  expect(artifacts.find((a: SerialAsset) => a.type === 'map').filename).toBe(js.filename + '.map');
});

it('uses an explicit entry filename without renaming async dependencies', async () => {
  const [entry, premodules, graph, options] = await microBundle({
    fs: { 'index.js': `import('./async');`, 'async.js': `export const value = 42;` },
    options: { dev: false, output: 'static', splitChunks: true, sourceMaps: true },
  });
  const serializerOptions = options as ExpoSerializerOptions;
  serializerOptions.serializerOptions = {
    ...serializerOptions.serializerOptions,
    entryFilename: '_expo/functions/hello+api.bundle',
  };
  const serializer = createSerializerFromSerialProcessors({ projectRoot } as any, [], null);
  const { artifacts } = (await serializer(entry, premodules, graph, serializerOptions)) as any;
  const entryAsset = artifacts.find(
    (asset: SerialAsset) => !asset.metadata.isAsync && asset.type === 'js'
  );
  const asyncAsset = artifacts.find(
    (asset: SerialAsset) => asset.metadata.isAsync && asset.type === 'js'
  );
  expect(entryAsset.filename).toBe('_expo/functions/hello+api.bundle');
  expect(asyncAsset.filename).toMatch(/^_expo\/static\/js\/web\/async-.*\.js$/);
  expect(JSON.stringify(entryAsset.metadata.paths)).toContain(asyncAsset.filename);
  expect(
    artifacts.some((asset: SerialAsset) => asset.filename === entryAsset.filename + '.map')
  ).toBe(true);
  serializerOptions.serializerOptions.entryFilename = '_expo/functions/renamed.bundle';
  const next = (await serializer(entry, premodules, graph, serializerOptions)) as any;
  expect(
    next.artifacts.find((asset: SerialAsset) => !asset.metadata.isAsync && asset.type === 'js')
      .filename
  ).toBe('_expo/functions/renamed.bundle');
  expect(
    next.artifacts.find((asset: SerialAsset) => asset.metadata.isAsync && asset.type === 'js')
      .filename
  ).toBe(asyncAsset.filename);
});

it.each(['legacy', 'granular'] as const)(
  'keeps worker filenames distinct from a named %s entry',
  async (chunkingStrategy) => {
    const [entry, premodules, graph, options] = await microBundle({
      fs: {
        'index.js': `const worker = require.unstable_resolveWorker('./worker');`,
        'worker.js': `console.log('worker');`,
      },
      options: {
        dev: false,
        output: 'static',
        splitChunks: true,
        sourceMaps: true,
        chunkingStrategy,
      },
    });
    const serializerOptions = options as ExpoSerializerOptions;
    serializerOptions.serializerOptions!.entryFilename = 'main.js';
    const serializer = createSerializerFromSerialProcessors({ projectRoot } as any, [], null);
    const { artifacts } = (await serializer(entry, premodules, graph, options)) as unknown as {
      artifacts: SerialAsset[];
    };
    const filenames = artifacts.map((artifact) => artifact.filename);
    expect(new Set(filenames).size).toBe(filenames.length);
    const main = artifacts.find(
      (asset) => asset.type === 'js' && asset.originFilename === 'index.js'
    )!;
    const worker = artifacts.find(
      (asset) => asset.type === 'js' && asset.originFilename === 'worker.js'
    )!;
    expect(main.filename).toBe('main.js');
    expect(worker.filename).toMatch(/^_expo\/static\/js\/web\/worker-.*\.js$/);
    expect(JSON.stringify(main.metadata.paths)).toContain(worker.filename);
    expect(filenames).toContain(main.filename + '.map');
    expect(filenames).toContain(worker.filename + '.map');
  }
);

it.each([false, true])(
  'uses the normal content-derived debug ID for named entries (Hermes: %s)',
  async (hermes) => {
    const serialize = async (source: string, filename?: string) => {
      const [entry, premodules, graph, options] = await microBundle({
        fs: { 'index.js': source },
        options: {
          dev: false,
          output: 'static',
          splitChunks: false,
          sourceMaps: true,
          hermes,
          platform: hermes ? 'ios' : 'web',
        },
      });
      (options as ExpoSerializerOptions).serializerOptions!.entryFilename = filename;
      const serializer = createSerializerFromSerialProcessors({ projectRoot } as any, [], null);
      const { artifacts } = (await serializer(entry, premodules, graph, options)) as any;
      return JSON.parse(artifacts.find((asset: SerialAsset) => asset.type === 'map').source)
        .debugId;
    };
    const first = await serialize('export const value = 1;');
    expect(await serialize('export const value = 1;', 'one/index.js')).toBe(first);
    expect(await serialize('export const value = 2;', 'one/index.js')).not.toBe(first);
    expect(await serialize('export const value = 1;', 'two/index.js')).toBe(first);
  }
);

describe('Granular chunk emission', () => {
  const publicGraph = {
    'index.js': `import('./a'); import('./b');`,
    'a.js': `import './shared';`,
    'b.js': `import './shared';`,
    'shared.js': `console.log('shared');`,
  };

  it('activates the complete opt-in path through the public serializer', async () => {
    const artifacts: SerialAsset[] = await serializeSplitAsync(publicGraph, {
      chunkingStrategy: 'granular',
    });
    expect(artifacts[0]!.metadata.chunkingStrategy).toBe('granular');
    expect(artifacts.some((asset) => asset.filename.includes('__shared-'))).toBe(true);
    expect(artifacts.some((asset) => asset.filename.includes('__common'))).toBe(false);
    const paths = Object.values(artifacts[0]!.metadata.paths!).flatMap(Object.values);
    expect(paths.every(Array.isArray)).toBe(true);
    for (const asset of artifacts.filter((asset) => asset.metadata.isAsync)) {
      expect(asset.source).toContain('__expo_chunk_completion__');
    }
  });

  it.each([
    { chunkingStrategy: 'legacy' as const },
    { platform: 'ios' },
    { dev: true },
    { lazy: true },
    { splitChunks: false },
    { isServer: true },
    { isReactServer: true },
  ])('retains legacy output for %j', async (options) => {
    const artifacts: SerialAsset[] = await serializeSplitAsync(publicGraph, {
      chunkingStrategy: 'granular',
      ...options,
    });
    expect(artifacts.every((asset) => asset.metadata.chunkingStrategy === undefined)).toBe(true);
    expect(artifacts.every((asset) => !asset.source.includes('__expo_chunk_completion__'))).toBe(
      true
    );
    expect(
      artifacts
        .flatMap((asset) => Object.values(asset.metadata.paths ?? {}).flatMap(Object.values))
        .every((value) => typeof value === 'string')
    ).toBe(true);
  });

  it('uses legacy page chunks when a worker dynamically imports a module', async () => {
    const artifacts: SerialAsset[] = await serializeSplitAsync(
      {
        ...publicGraph,
        'index.js': `import('./a'); import('./b'); require.unstable_resolveWorker('./worker');`,
        'worker.js': `import('./worker-target');`,
        'worker-target.js': `console.log('worker target');`,
      },
      { chunkingStrategy: 'granular' }
    );

    const commonChunk = artifacts.find((asset) => asset.filename.includes('__common'));
    expect(commonChunk?.metadata.modulePaths).toContain('/app/shared.js');
    expect(artifacts.some((asset) => asset.filename.includes('__shared-'))).toBe(false);
    expect(artifacts.every((asset) => asset.metadata.chunkingStrategy === undefined)).toBe(true);
    expect(
      artifacts
        .flatMap((asset) => Object.values(asset.metadata.paths ?? {}).flatMap(Object.values))
        .every((value) => typeof value === 'string')
    ).toBe(true);
  });

  it('keeps DOM exports on the legacy pipeline even when requested', async () => {
    const [entry, premodules, graph, options] = await microBundle({
      fs: publicGraph,
      options: {
        platform: 'web',
        dev: false,
        output: 'static',
        splitChunks: true,
        chunkingStrategy: 'granular',
      },
    });
    const domGraph = {
      ...graph,
      transformOptions: {
        ...graph.transformOptions,
        customTransformOptions: { ...graph.transformOptions.customTransformOptions, dom: 'true' },
      },
    };
    const serializer = createSerializerFromSerialProcessors({ projectRoot }, [], null);
    const { artifacts } = (await serializer(entry, premodules, domGraph, options)) as any;
    expect(artifacts.some((asset: SerialAsset) => asset.filename.includes('__common'))).toBe(true);
    expect(
      artifacts.every((asset: SerialAsset) => asset.metadata.chunkingStrategy === undefined)
    ).toBe(true);
  });

  async function serializeGranularAsync(fs: Record<string, string>, sourceMaps = false) {
    const [entry, premodules, graph, options] = await microBundle({
      fs,
      preModulesFs: { runtime: '/* runtime */' },
      options: { platform: 'web', dev: false, output: 'static', splitChunks: true, sourceMaps },
    });
    return createGranularChunkingStrategy({
      serializerConfig: {},
      serializeChunkOptions: {
        includeSourceMaps: sourceMaps,
        splitChunks: true,
        chunkingStrategy: 'granular',
      },
      entryFile: entry,
      preModules: premodules,
      graph,
      options,
    }).serializeAsync();
  }

  it('emits separate AB and BC shared owners and complete async arrays', async () => {
    const artifacts = await serializeGranularAsync({
      'index.js': `import('./a'); import('./b'); import('./c');`,
      'a.js': `import './d';`,
      'b.js': `import './d'; import './e';`,
      'c.js': `import './e';`,
      'd.js': `console.log('d');`,
      'e.js': `console.log('e');`,
    });
    const entry = artifacts[0]!;
    expect(entry.metadata.entryPaths).toEqual(['/app/index.js']);
    const d = artifacts.find((asset) => asset.metadata.modulePaths?.includes('/app/d.js'))!;
    const e = artifacts.find((asset) => asset.metadata.modulePaths?.includes('/app/e.js'))!;
    expect(d).not.toBe(e);
    expect(d.filename).toContain('__shared-');
    expect(e.filename).toContain('__shared-');
    expect(d.metadata.entryPaths).toEqual([]);
    const b = artifacts.find((asset) => asset.metadata.entryPaths?.includes('/app/b.js'))!;
    expect(b.metadata.requires).toEqual(expect.arrayContaining([d.filename, e.filename]));
    const paths = Object.values(entry.metadata.paths!).flatMap(Object.values);
    expect(paths).toContainEqual(
      expect.arrayContaining(['/' + b.filename, '/' + d.filename, '/' + e.filename])
    );
    expect(artifacts.every((asset) => asset.metadata.chunkingStrategy === 'granular')).toBe(true);
    const modulePaths = artifacts.flatMap((asset) => asset.metadata.modulePaths ?? []);
    expect(new Set(modulePaths).size).toBe(modulePaths.length);
  });

  it('covers canonical requirements from an importer shared by multiple entries', async () => {
    const artifacts = await serializeGranularAsync({
      'index.js': `import('./a'); import('./b');`,
      'a.js': `import './importer'; import './d';`,
      'b.js': `import './importer';`,
      'importer.js': `export const load = () => import('./c');`,
      'c.js': `import './d';`,
      'd.js': `console.log('d');`,
    });
    const importer = artifacts.find((asset) =>
      asset.metadata.modulePaths?.includes('/app/importer.js')
    )!;
    const c = artifacts.find((asset) => asset.metadata.entryPaths?.includes('/app/c.js'))!;
    const d = artifacts.find((asset) => asset.metadata.modulePaths?.includes('/app/d.js'))!;
    const paths = importer.metadata.paths!['/app/importer.js']!['/app/c.js']!;
    expect(paths).toEqual(expect.arrayContaining(['/' + c.filename, '/' + d.filename]));
    const availableFilenames = new Set([
      artifacts[0]!.filename,
      importer.filename,
      ...artifacts
        .filter((asset) => !asset.metadata.isAsync && !asset.metadata.entryPaths?.length)
        .map((asset) => asset.filename),
    ]);
    const coveredFilenames = new Set([
      ...availableFilenames,
      ...(paths as string[]).map((url) => url.slice(1)),
    ]);
    for (const required of [c.filename, ...c.metadata.requires!])
      expect(coveredFilenames.has(required)).toBe(true);
  });

  it('omits an empty facade while preserving its entry requirements', async () => {
    const artifacts = await serializeGranularAsync({
      'index.js': `import('./a');`,
      'a.js': `import './b'; export const load = () => import('./b');`,
      'b.js': `console.log('b');`,
    });
    const a = artifacts.find((asset) => asset.metadata.entryPaths?.includes('/app/a.js'))!;
    expect(artifacts).toHaveLength(3);
    expect(a.metadata.modulePaths).toContain('/app/b.js');
    expect(artifacts[0]!.metadata.entryChunks!['/app/b.js']).toEqual([a.filename]);
    expect(artifacts.some((asset) => asset.metadata.entryPaths?.includes('/app/b.js'))).toBe(false);
    expect(a.metadata.paths).toEqual({});
  });

  it.each([false, true])(
    'omits empty same-basename facades (source maps: %s)',
    async (sourceMaps) => {
      const artifacts = await serializeGranularAsync(
        {
          'index.js': `import('./a/index'); import('./b/index'); import('./x'); import('./y');`,
          'a/index.js': `console.log('a');`,
          'b/index.js': `console.log('b');`,
          'x.js': `import './a/index';`,
          'y.js': `import './b/index';`,
        },
        sourceMaps
      );
      const jsAssets = artifacts.filter((asset) => asset.type === 'js');
      const a = artifacts.find((asset) => asset.metadata.modulePaths?.includes('/app/a/index.js'))!;
      const b = artifacts.find((asset) => asset.metadata.modulePaths?.includes('/app/b/index.js'))!;
      const entry = artifacts[0]!;
      expect(jsAssets).toHaveLength(6);
      expect(
        artifacts.filter((asset) => asset.type === 'map').map((asset) => asset.filename)
      ).toEqual(sourceMaps ? jsAssets.map((asset) => asset.filename + '.map') : []);
      expect(new Set(artifacts.map((asset) => asset.filename)).size).toBe(artifacts.length);
      expect(a.filename).toContain('__shared-');
      expect(b.filename).toContain('__shared-');
      expect(a.filename).not.toBe(b.filename);
      expect(entry.metadata.entryChunks!['/app/a/index.js']).toEqual([a.filename]);
      expect(entry.metadata.entryChunks!['/app/b/index.js']).toEqual([b.filename]);
      expect(entry.metadata.paths!['/app/index.js']!['/app/a/index.js']).toEqual([
        '/' + a.filename,
      ]);
      expect(entry.metadata.paths!['/app/index.js']!['/app/b/index.js']).toEqual([
        '/' + b.filename,
      ]);
      expect(
        artifacts
          .filter((asset) => asset.metadata.isAsync)
          .every((asset) => asset.metadata.modulePaths!.length > 0)
      ).toBe(true);
    }
  );

  it('skips fully initial-owned facades and records their aliases', async () => {
    const artifacts = await serializeGranularAsync({
      'index.js': `import './a'; import('./a');`,
      'a.js': `console.log('a');`,
    });
    expect(artifacts).toHaveLength(1);
    expect(artifacts[0]!.metadata.entryPaths).toEqual(['/app/a.js', '/app/index.js']);
    expect(artifacts[0]!.metadata.entryChunks).toEqual({
      '/app/a.js': [],
      '/app/index.js': [],
    });
    expect(artifacts[0]!.metadata.paths).toEqual({});
  });

  it('keeps worker closures isolated and their URLs scalar', async () => {
    const artifacts = await serializeGranularAsync({
      'index.js': `import './shared'; import('./a'); require.unstable_resolveWorker('./worker');`,
      'a.js': `console.log('a');`,
      'worker.js': `import './shared'; require.unstable_resolveWorker('./nested');`,
      'nested.js': `import './shared';`,
      'shared.js': `console.log('shared');`,
    });
    const worker = artifacts.find((asset) => asset.originFilename === 'worker.js')!;
    const nested = artifacts.find((asset) => asset.originFilename === 'nested.js')!;
    expect(worker.metadata.modulePaths).toContain('/app/shared.js');
    expect(nested.metadata.modulePaths).toContain('/app/shared.js');
    expect(worker.metadata.entryPaths).toEqual([]);
    expect(worker.metadata.requires).toEqual([]);
    expect(worker.source).toContain('"/app/runtime"');
    expect(Object.values(artifacts[0]!.metadata.paths!).flatMap(Object.values)).toContain(
      '/' + worker.filename
    );
    expect(Object.values(worker.metadata.paths!).flatMap(Object.values)).toEqual([
      '/' + nested.filename,
    ]);
  });

  it.each([true, false])(
    'preserves weak worker IDs without collecting their targets (page imports target: %s)',
    async (pageImportsTarget) => {
      const artifacts = await serializeGranularAsync({
        'index.js': `${pageImportsTarget ? "import './target';" : ''} require.unstable_resolveWorker('./worker');`,
        'worker.js': `self.targetId = require.resolveWeak('./target');`,
        'target.js': `export const value = 42;`,
      });
      const worker = artifacts.find((asset) => asset.originFilename === 'worker.js')!;
      expect(artifacts).toHaveLength(2);
      expect(worker.metadata.modulePaths).toEqual(['/app/worker.js']);
      expect(worker.source).toContain('["/app/target.js"]');
      expect(worker.metadata.paths).toEqual({});
      expect(artifacts[0]!.metadata.paths!['/app/index.js']!['/app/worker.js']).toBe(
        '/' + worker.filename
      );
    }
  );

  it('emits acyclic requirements for circular dynamic imports', async () => {
    const artifacts = await serializeGranularAsync({
      'index.js': `import('./a');`,
      'a.js': `import './shared'; export const load = () => import('./b');`,
      'b.js': `import './shared'; export const load = () => import('./a');`,
      'shared.js': `console.log('shared');`,
    });
    function visit(filename: string, ancestors: string[] = []) {
      expect(ancestors).not.toContain(filename);
      const asset = artifacts.find((asset) => asset.filename === filename)!;
      expect(asset).toBeDefined();
      for (const required of asset.metadata.requires ?? [])
        visit(required, [...ancestors, filename]);
    }
    for (const asset of artifacts) visit(asset.filename);
    const a = artifacts.find((asset) => asset.metadata.entryPaths?.includes('/app/a.js'))!;
    const b = artifacts.find((asset) => asset.metadata.entryPaths?.includes('/app/b.js'))!;
    expect(b.metadata.requires).toContain(a.filename);
    expect(a.metadata.requires).not.toContain(b.filename);
  });

  it('changes embedded-path hashes when a shared prerequisite changes', async () => {
    const fs = {
      'index.js': `import('./a'); import('./b');`,
      'a.js': `import './shared';`,
      'b.js': `import './shared';`,
      'shared.js': `console.log('before');`,
    };
    const artifacts = await serializeGranularAsync(fs);
    const artifactsChanged = await serializeGranularAsync({
      ...fs,
      'shared.js': `console.log('after');`,
    });
    const originalSharedChunk = artifacts.find((asset) => asset.filename.includes('__shared-'))!;
    const updatedSharedChunk = artifactsChanged.find((asset) =>
      asset.filename.includes('__shared-')
    )!;
    expect(updatedSharedChunk.originFilename).toBe(originalSharedChunk.originFilename);
    expect(updatedSharedChunk.filename).not.toBe(originalSharedChunk.filename);
    expect(artifactsChanged[0]!.filename).not.toBe(artifacts[0]!.filename);
    expect(artifactsChanged[0]!.source).toContain(updatedSharedChunk.filename);
    expect(artifactsChanged[0]!.source).not.toContain(originalSharedChunk.filename);
    expect(await serializeGranularAsync(fs)).toEqual(artifacts);
  });

  it('retains per-chunk plugin preludes, maps and trailing annotations around completion', async () => {
    const [entry, premodules, graph, options] = await microBundle({
      fs: {
        'index.js': `import('./a'); import('./b');`,
        'a.js': `import './shared';`,
        'b.js': `import './shared';`,
        'shared.js': `console.log('shared');`,
      },
      options: {
        platform: 'web',
        dev: false,
        output: 'static',
        splitChunks: true,
        sourceMaps: true,
      },
    });
    const unstablePlugin = jest.fn(({ premodules }: { premodules: readonly Module[] }) => [
      ...premodules,
      createJSVirtualModule('plugin', 'globalThis.pluginRan = true;'),
    ]);
    const artifacts = await createGranularChunkingStrategy({
      serializerConfig: {},
      serializeChunkOptions: {
        includeSourceMaps: true,
        splitChunks: true,
        chunkingStrategy: 'granular',
        unstable_beforeAssetSerializationPlugins: [unstablePlugin],
      },
      entryFile: entry,
      preModules: premodules,
      graph,
      options,
    }).serializeAsync();
    const js = artifacts.filter((asset) => asset.type === 'js');
    expect(unstablePlugin).toHaveBeenCalledTimes(js.length);
    for (const asset of js) {
      expect(asset.source).toContain('globalThis.pluginRan = true;');
      const sourceMap = artifacts.find(
        (candidate) => candidate.filename === asset.filename + '.map'
      )!;
      expect(JSON.parse(sourceMap.source).version).toBe(3);
      expect(asset.source).toContain('//# debugId=');
      if (asset.metadata.isAsync) {
        const marker = asset.source.indexOf('__expo_chunk_completion__');
        expect(marker).toBeGreaterThan(asset.source.indexOf('globalThis.pluginRan'));
        expect(marker).toBeLessThan(asset.source.indexOf('//# sourceMappingURL='));
        const footer = asset.source.slice(asset.source.lastIndexOf('(function(){'));
        expect(footer.split('\n')[0]).not.toContain(asset.filename);
      } else {
        expect(asset.source).not.toContain('__expo_chunk_completion__');
      }
    }
  });
});

describe('worker compatibility', () => {
  let bundle: Awaited<ReturnType<typeof microBundle>>;
  let chunkSerializerSpy: jest.SpyInstance;
  beforeAll(async () => {
    bundle = await microBundle({
      fs: { 'index.js': `import('./route');`, 'route.js': 'export const value = 1;' },
      options: {
        platform: 'web',
        dev: false,
        output: 'static',
        splitChunks: true,
        chunkingStrategy: 'granular',
      },
    });
  });
  beforeEach(() => {
    chunkSerializerSpy = jest.spyOn(chunkSerializer, 'graphToSerialAssetsAsync');
  });
  afterEach(() => {
    chunkSerializerSpy.mockRestore();
  });

  async function serialize(graph = bundle[2], options: ExpoSerializerOptions = bundle[3]) {
    const serializer = createSerializerFromSerialProcessors({ projectRoot }, [], null);
    await serializer(bundle[0], bundle[1], graph, options);
  }

  async function createWorkerBundle(workerSource: string) {
    return microBundle({
      fs: {
        'index.js': `import './shared'; require.unstable_resolveWorker('./worker');`,
        'worker.js': workerSource,
        'shared.js': `export const load = () => import('./target');`,
        'target.js': `export const value = 1;`,
        'nested.js': `import './shared';`,
      },
      options: {
        platform: 'web',
        dev: false,
        output: 'static',
        splitChunks: true,
        chunkingStrategy: 'granular',
      },
    });
  }

  it.each(['async', 'maybeSync', 'prefetch'] as const)(
    'falls back for a shared worker importer with a %s edge',
    async (asyncType) => {
      const [entry, , graph, options] = await createWorkerBundle(`import './shared';`);
      const shared = graph.dependencies.get('/app/shared.js')!;
      const [key, dependency] = [...shared.dependencies].find(
        ([, dep]) => dep.data.data.asyncType === 'async'
      )!;
      shared.dependencies.set(key, {
        ...dependency,
        data: { ...dependency.data, data: { ...dependency.data.data, asyncType } },
      });
      expect(workerScan.findUnsupportedWorkerAsyncDependency(entry, graph)).toEqual({
        workerEntry: '/app/worker.js',
        importer: '/app/shared.js',
        target: '/app/target.js',
        asyncType,
      });
      await serialize(graph, options);

      expect(chunkSerializerSpy).toHaveBeenCalledWith(
        { projectRoot },
        expect.objectContaining({ chunkingStrategy: 'legacy' }),
        bundle[0],
        bundle[1],
        graph,
        expect.anything()
      );
    }
  );

  it('finds async edges inside nested workers', async () => {
    const [entry, , graph] = await createWorkerBundle(
      `require.unstable_resolveWorker('./nested');`
    );
    expect(workerScan.findUnsupportedWorkerAsyncDependency(entry, graph)).toEqual({
      workerEntry: '/app/nested.js',
      importer: '/app/shared.js',
      target: '/app/target.js',
      asyncType: 'async',
    });
  });

  it('ignores weak worker edges even when the fixture manufactures their target', async () => {
    const [entry, , graph] = await createWorkerBundle(`require.resolveWeak('./shared');`);
    expect(workerScan.findUnsupportedWorkerAsyncDependency(entry, graph)).toBeUndefined();
  });

  it('does not treat page-only async edges as worker edges', async () => {
    const [, , graph, options] = await createWorkerBundle(`import './target';`);
    await serialize(graph, options);

    expect(chunkSerializerSpy).toHaveBeenCalledWith(
      { projectRoot },
      expect.objectContaining({ chunkingStrategy: 'granular' }),
      bundle[0],
      bundle[1],
      graph,
      expect.anything()
    );
  });

  it('ignores unresolved worker edges', async () => {
    const [entry, , graph] = await createWorkerBundle(`import('./target');`);
    const worker = graph.dependencies.get('/app/worker.js')!;
    for (const [key, dependency] of worker.dependencies) {
      if (dependency.data.data.asyncType === 'async') {
        worker.dependencies.set(key, { data: dependency.data });
      }
    }
    expect(workerScan.findUnsupportedWorkerAsyncDependency(entry, graph)).toBeUndefined();
  });

  it('does not scan workers when splitting is disabled', async () => {
    const [, , graph, original] = await createWorkerBundle(`import('./target');`);
    const options = original as ExpoSerializerOptions;
    const scan = jest.spyOn(workerScan, 'findUnsupportedWorkerAsyncDependency');
    try {
      await serialize(graph, {
        ...options,
        serializerOptions: { ...options.serializerOptions, splitChunks: false },
      });

      expect(chunkSerializerSpy).toHaveBeenCalledWith(
        { projectRoot },
        expect.objectContaining({ chunkingStrategy: 'legacy', splitChunks: false }),
        bundle[0],
        bundle[1],
        graph,
        expect.anything()
      );
      expect(scan).not.toHaveBeenCalled();
    } finally {
      scan.mockRestore();
    }
  });

  it('terminates on synchronous worker cycles', async () => {
    const [entry, , graph] = await microBundle({
      fs: {
        'index.js': `require.unstable_resolveWorker('./worker');`,
        'worker.js': `import './other';`,
        'other.js': `import './worker';`,
      },
      options: { platform: 'web', dev: false, splitChunks: true },
    });
    expect(workerScan.findUnsupportedWorkerAsyncDependency(entry, graph)).toBeUndefined();
  });
});

describe(withSerializerPlugins, () => {
  it.each(['node', 'react-server'])(
    'preserves captured custom serializers in static %s exports',
    async (environment) => {
      const args = await microBundle({
        fs: { 'index.js': 'export const value = 42;' },
        options: { isServer: true, dev: false, output: 'static' },
      });
      args[2].transformOptions.customTransformOptions!.environment = environment;
      const customSerializer = jest.fn(
        async (...props: Parameters<typeof baseJSBundle>) =>
          bundleToString(baseJSBundle(...props)).code + '\n// Custom instrumentation'
      );
      const config = withSerializerPlugins({ projectRoot, serializer: { customSerializer } }, []);
      const result = (await config.serializer.customSerializer(...args)) as any;
      expect(customSerializer).toHaveBeenCalledTimes(1);
      expect(result.artifacts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'js',
            source: expect.stringContaining('// Custom instrumentation'),
          }),
        ])
      );
      expect(result.artifacts[0].source).toContain(
        `module.exports = __r(${JSON.stringify(args[0])});`
      );
    }
  );

  it('composes a custom wrapper without recovering it recursively', async () => {
    const args = await microBundle({ fs: { 'index.js': 'export const value = 42;' } });
    const config = {
      projectRoot,
      serializer: { customSerializer: undefined as Serializer | undefined },
    };
    withSerializerPlugins(config, []);
    const original = config.serializer.customSerializer!;
    const expected = await original(...args);
    const customSerializer = jest.fn((...props: Parameters<typeof original>) => {
      if (customSerializer.mock.calls.length > 2) throw new Error('Recursive custom serializer');
      return original(...props);
    });
    config.serializer.customSerializer = customSerializer;
    const wrapped = withSerializerPlugins(config, []);
    expect(await wrapped.serializer.customSerializer!(...args)).toEqual(expected);
    expect(customSerializer).toHaveBeenCalledTimes(1);
  });

  it.each(['node', 'react-server'])(
    'exports the entry through custom %s serializers',
    async (environment) => {
      const args = await microBundle({
        fs: {
          'index.js': `import './setup'; export const value = 42;`,
          'setup.js': 'globalThis.setup = true;',
        },
        options: { isServer: true, dev: false },
      });
      args[2].transformOptions.customTransformOptions!.environment = environment;
      args[3] = { ...args[3], runBeforeMainModule: [projectRoot + '/setup.js'] };
      const config = withSerializerPlugins(
        {
          projectRoot,
          serializer: {
            customSerializer: async (...props: Parameters<typeof baseJSBundle>) =>
              bundleToString(baseJSBundle(...props)).code,
          },
        },
        []
      );
      const output = await config.serializer.customSerializer(...args);
      expect(output).toContain(`module.exports = __r(${JSON.stringify(args[0])});`);
      expect(output).not.toContain(
        `module.exports = __r(${JSON.stringify(projectRoot + '/setup.js')});`
      );
    }
  );

  it(`executes in the expected order`, async () => {
    const customSerializer = jest.fn();
    const customProcessor = jest.fn((...res) => res);
    const config = withSerializerPlugins(
      {
        serializer: {
          customSerializer,
        },
      },
      [customProcessor as any]
    );

    const options = {
      createModuleId: expect.any(Function),
      sourceUrl: 'https://localhost:8081/index.bundle?platform=ios&dev=true&minify=false',
    };
    await config.serializer.customSerializer('a', 'b', 'c', options);

    expect(customProcessor).toHaveBeenCalledWith('a', 'b', 'c', options);
    expect(customSerializer).toHaveBeenCalledWith('a', 'b', 'c', options);
  });

  it('does not lose the original config object reference', async () => {
    // Create the `getRunBeforeMainModules` default and (user) override function
    const defaultGetMainModules = jest.fn(() => ['default/module']);
    const overrideGetMainModules = jest.fn(() => ['override/module']);

    // Create a fake serializer, running `getRunBeforeMainModules` from the config
    const customProcessor = jest.fn((...res) => res);
    const customSerializer = jest.fn((_entryPoint, _preModules, _graph, options) => {
      // Mimic serializer behavior where we call getModulesRunBeforeMainModule
      options.getModulesRunBeforeMainModule('path/to/entry.js');
    });

    // Create the Metro config, already containing the serializer options (source URL)
    // This is added through a mutation later on in the process
    const config = {
      serializer: {
        getModulesRunBeforeMainModule: defaultGetMainModules,
        customSerializer,
        createModuleId: expect.any(Function),
        sourceUrl: 'https://localhost:8081/index.bundle?platform=ios&dev=true&minify=false',
      },
    };
    // @ts-expect-error
    const configWithSerializer = withSerializerPlugins(config, [customProcessor as any]);

    // Modify the original config, which should also modify the function in the serializer config
    config.serializer.getModulesRunBeforeMainModule = overrideGetMainModules;

    await configWithSerializer.serializer!.customSerializer!(
      'a',
      // @ts-expect-error
      'b',
      'c',
      configWithSerializer.serializer
    );

    // Ensure the serializer was invoked correctly
    expect(customProcessor).toHaveBeenCalledWith('a', 'b', 'c', configWithSerializer.serializer);
    expect(customSerializer).toHaveBeenCalledWith('a', 'b', 'c', configWithSerializer.serializer);
    // Ensure the serializer invoked the overridden config property
    expect(defaultGetMainModules).not.toHaveBeenCalled();
    expect(overrideGetMainModules).toHaveBeenCalled();
  });
});

jest.mock('../exportHermes', () => {
  return {
    buildHermesBundleAsync: jest.fn(({ code, map }) => ({
      hbc: code,
      sourcemap: map,
    })),
  };
});

describe('serializes', () => {
  it.each([null, 'index.js', 'worker.js'])(
    'defers only chunks with DOM references (DOM entry: %s)',
    async (domEntry) => {
      const [entry, premodules, graph, options] = await microBundle({
        fs: {
          'index.js': `console.log('main'); require.unstable_resolveWorker('./worker');`,
          'worker.js': `console.log('worker');`,
        },
        options: {
          platform: 'ios',
          dev: false,
          hermes: true,
          output: 'static',
          splitChunks: false,
        },
      });
      if (domEntry) {
        (
          graph.dependencies.get(`${projectRoot}/${domEntry}`)!.output[0]!.data as any
        ).expoDomComponentReference = 'file:///app/DomView.js';
      }
      const serializer = createSerializerFromSerialProcessors({ projectRoot }, [], null);
      const result = (await serializer(entry, premodules, graph, options)) as any;
      expect(result.artifacts).toHaveLength(2);
      for (const artifact of result.artifacts) {
        expect(artifact.filename).toMatch(
          artifact.originFilename === domEntry ? /\.js$/ : /\.hbc$/
        );
      }
    }
  );

  describe('plugin callbacks', () => {
    it(`runs plugin for each chunk`, async () => {
      const unstablePlugin = ({ premodules }: { premodules: Module[] }): Module[] => {
        return [createJSVirtualModule('__testPreModule', 'testPreModule;'), ...premodules];
      };

      const artifacts = await serializeSplitAsync(
        {
          'index.js': `
              import('./foo')
            `,
          'foo.js': `
              export const foo = 'foo';
            `,
        },
        {
          sourceMaps: true,
        },
        [], // processors
        { unstable_beforeAssetSerializationPlugins: [unstablePlugin] }
      );

      if (typeof artifacts === 'string') {
        throw new Error('wrong type');
      }

      const jsArtifacts = artifacts.filter((artifact: SerialAsset) => artifact.type === 'js');
      const mapArtifacts = artifacts.filter((artifact: SerialAsset) => artifact.type === 'map');

      jsArtifacts.forEach((artifact: SerialAsset) => {
        expect(artifact.source.startsWith('testPreModule;')).toBeTruthy();
      });
      mapArtifacts.forEach((artifact: SerialAsset) => {
        // Assert each map artifact has __testPreModule in the sources of its first (indexed) section
        const map = JSON.parse(artifact.source);
        expect(map.sections[0].map.sources[0]).toEqual('__testPreModule');
      });
    });
    it(`generated async import paths match generated artifacts`, async () => {
      const unstablePlugin = ({ premodules }: { premodules: Module[] }): Module[] => {
        return [createJSVirtualModule('__testPreModule', 'testPreModule;'), ...premodules];
      };

      const artifacts = await serializeSplitAsync(
        {
          'index.js': `
              import('./foo')
            `,
          'foo.js': `
              export const foo = 'foo';
            `,
        },
        {
          sourceMaps: true,
        },
        [], // processors
        { unstable_beforeAssetSerializationPlugins: [unstablePlugin] }
      );

      if (typeof artifacts === 'string') {
        throw new Error('wrong type');
      }

      const indexJs = artifacts.find(
        (artifact: SerialAsset) => artifact.originFilename === 'index.js'
      );
      const fooJs = artifacts.find((artifact: SerialAsset) => artifact.originFilename === 'foo.js');

      const fooJsFilenameImportedFromIndexJs =
        // substring(1) to remove the leading '/'
        indexJs?.metadata.paths['/app/index.js']['/app/foo.js']?.substring(1);

      expect(fooJsFilenameImportedFromIndexJs).toBeDefined();
      expect(fooJsFilenameImportedFromIndexJs).toEqual(fooJs?.filename);
    });
    it('plugin preModules changes are excluded from the file name hash', async () => {
      const unstablePlugin = ({ premodules }: { premodules: Module[] }): Module[] => {
        return [createJSVirtualModule('__testPreModule', 'testPreModule;'), ...premodules];
      };

      const options: Partial<Parameters<typeof microBundle>[0]> = {
        options: {
          dev: false,
          platform: 'ios',
          hermes: false,
          // Source maps must be enabled otherwise the feature is disabled.
          sourceMaps: true,
          output: 'static',
        },
      };

      const withoutPlugin = await serializeTo(
        options,
        [], // processors
        { unstable_beforeAssetSerializationPlugins: [] }
      );

      const withPlugin = await serializeTo(
        options,
        [], // processors
        { unstable_beforeAssetSerializationPlugins: [unstablePlugin] }
      );

      if (typeof withoutPlugin === 'string' || typeof withPlugin === 'string') {
        throw new Error('wrong type');
      }

      // Get the filenames from both artifacts
      const withoutFilename = (withoutPlugin as SerialAsset[]).map((asset) => asset.filename);
      const withFilename = (withPlugin as SerialAsset[]).map((asset) => asset.filename);

      // The filenames should be equal since premodules shouldn't affect the hash
      expect(withoutFilename).toEqual(withFilename);
    });
    it(`runs plugin with static output`, async () => {
      let didPluginRun = false;
      const unstablePlugin = ({ premodules }: { premodules: Module[] }): Module[] => {
        didPluginRun = true;
        return premodules;
      };

      await serializeTo(
        {
          options: {
            dev: false,
            platform: 'ios',
            hermes: false,
            // Source maps must be enabled otherwise the feature is disabled.
            sourceMaps: true,
            output: 'static',
          },
        },
        [], // processors
        { unstable_beforeAssetSerializationPlugins: [unstablePlugin] }
      );

      expect(didPluginRun).toBe(true);
    });
    it(`runs plugin with non-static output`, async () => {
      let didPluginRun = false;
      const unstablePlugin = ({ premodules }: { premodules: Module[] }): Module[] => {
        didPluginRun = true;
        return premodules;
      };

      await serializeTo(
        {
          options: {
            dev: false,
            platform: 'ios',
            hermes: false,
            // Source maps must be enabled otherwise the feature is disabled.
            sourceMaps: true,
            output: undefined, // non static output
          },
        },
        [], // processors
        { unstable_beforeAssetSerializationPlugins: [unstablePlugin] }
      );

      expect(didPluginRun).toBe(true);
    });
  });

  describe('metro-transform-worker', () => {
    it(`supports top-level variables that match iife names with experimentalImportSupport`, async () => {
      const serializer = createSerializerFromSerialProcessors(
        {
          projectRoot,
        },
        [],
        null // originalSerializer
      );

      const fs = {
        'index.js': `
        let module = {};
        let require = {};
        let global = {};
        let exports = {};
      `,
      };

      // This will fail if the `module` -> `_module` transform doesn't work.
      expect(await serializer(...(await microBundle({ fs })))).toMatchInlineSnapshot(`
        "__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
          let _module = {};
          let _require = {};
          let _global = {};
          let _exports = {};
        },"/app/index.js",[],"index.js");
        __r("/app/index.js");"
      `);
    });
  });

  describe('debugId', () => {
    describe('legacy serializer', () => {
      it(`serializes with debugId annotation`, async () => {
        const artifacts = await serializeTo({
          options: {
            dev: false,
            platform: 'ios',
            hermes: false,
            // Source maps must be enabled otherwise the feature is disabled.
            sourceMaps: true,
          },
        });

        if (typeof artifacts === 'string') {
          throw new Error('wrong type');
        }

        // Ensure no directive to include them is added.
        expect(artifacts.code).toMatch(
          /\/\/# sourceMappingURL=https:\/\/localhost:8081\/indedx\.bundle\?dev=false/
        );
        // Debug ID annotation is included at the end.
        expect(artifacts.code).toMatch(/\/\/# debugId=c88bc539-239f-4b18-9ffb-9eb094d815d9/);

        // Test that the debugId is added to the source map and matches the annotation.
        const debugId = 'c88bc539-239f-4b18-9ffb-9eb094d815d9';
        expect(artifacts.code).toContain(debugId);

        expect(JSON.parse(artifacts.map)).toEqual(
          expect.objectContaining({
            debugId,
          })
        );
      });

      it(`skips debugId annotation if inline source maps are enabled`, async () => {
        const artifacts = await serializeTo({
          options: {
            dev: false,
            platform: 'android',
            hermes: false,
            // Inline source maps will disable the feature.
            inlineSourceMaps: true,
          },
        });
        if (typeof artifacts === 'string') {
          throw new Error('wrong type');
        }

        // Ensure no directive to include them is added.
        expect(artifacts.code).toMatch(/\/\/# sourceMappingURL=data:application/);
        // Debug ID annotation is NOT included at the end.
        expect(artifacts.map).not.toMatch(/\/\/# debugId=/);
      });
    });

    it(`serializes with debugId annotation`, async () => {
      const artifacts = await serializeTo({
        options: {
          dev: false,
          platform: 'web',
          hermes: false,
          output: 'static',

          // Source maps must be enabled otherwise the feature is disabled.
          sourceMaps: true,
        },
      });

      const filenames = artifacts.map(({ filename }: SerialAsset) => filename);

      expect(filenames).toEqual([
        expect.stringMatching(/_expo\/static\/js\/web\/index-(?<md5>[0-9a-fA-F]{32})\.js/),
        expect.stringMatching(/_expo\/static\/js\/web\/index-(?<md5>[0-9a-fA-F]{32})\.js\.map/),
      ]);

      // Ensure no directive to include them is added.
      expect(artifacts[0].source).toMatch(
        /\/\/# sourceMappingURL=\/_expo\/static\/js\/web\/index-(?<md5>[0-9a-fA-F]{32})\.js\.map/
      );
      // Debug ID annotation is included at the end.
      expect(artifacts[0].source).toMatch(/\/\/# debugId=84ff5caf-ca7e-4193-898a-23554a6ea654/);

      // Test that the debugId is added to the source map and matches the annotation.
      const debugId = '84ff5caf-ca7e-4193-898a-23554a6ea654';
      expect(artifacts[0].source).toContain(debugId);

      const mapArtifact = artifacts.find(({ filename }: SerialAsset) =>
        filename.endsWith('.map')
      ) as SerialAsset;

      expect(JSON.parse(mapArtifact.source)).toEqual(
        expect.objectContaining({
          debugId,
        })
      );
    });

    it(`serializes with debugId annotation and (mock) hermes generation`, async () => {
      const artifacts = await serializeTo({
        options: {
          dev: false,
          platform: 'ios',
          hermes: true,
          output: 'static',
          // Source maps must be enabled otherwise the feature is disabled.
          sourceMaps: true,
        },
      });

      const filenames = artifacts.map(({ filename }: SerialAsset) => filename);

      expect(filenames).toEqual([
        expect.stringMatching(/_expo\/static\/js\/ios\/index-(?<md5>[0-9a-fA-F]{32})\.hbc/),
        expect.stringMatching(/_expo\/static\/js\/ios\/index-(?<md5>[0-9a-fA-F]{32})\.hbc\.map/),
      ]);

      // Ensure no directive to include them is added.
      expect(artifacts[0].source).toMatch(
        /\/\/# sourceMappingURL=https:\/\/localhost:8081\/_expo\/static\/js\/ios\/index-(?<md5>[0-9a-fA-F]{32})\.hbc\.map/
      );
      // Debug ID annotation is included at the end.
      expect(artifacts[0].source).toMatch(/\/\/# debugId=84ff5caf-ca7e-4193-898a-23554a6ea654/);

      // Test that the debugId is added to the source map and matches the annotation.
      const debugId = '84ff5caf-ca7e-4193-898a-23554a6ea654';
      expect(artifacts[0].source).toContain(debugId);

      const mapArtifact = artifacts.find(({ filename }: SerialAsset) =>
        filename.endsWith('.hbc.map')
      ) as SerialAsset;

      expect(JSON.parse(mapArtifact.source)).toEqual(
        expect.objectContaining({
          debugId,
        })
      );
    });

    it(`skips debugId annotation if inline source maps are enabled`, async () => {
      const artifacts = await serializeTo({
        options: {
          dev: false,
          platform: 'web',
          hermes: false,
          output: 'static',
          // Inline source maps will disable the feature.
          inlineSourceMaps: true,
        },
      });

      const filenames = artifacts.map(({ filename }: SerialAsset) => filename);

      expect(filenames).toEqual([
        expect.stringMatching(/_expo\/static\/js\/web\/index-(?<md5>[0-9a-fA-F]{32})\.js/),
      ]);

      // Ensure no directive to include them is added.
      expect(artifacts[0].source).toMatch(/\/\/# sourceMappingURL=data:application/);
      // Debug ID annotation is NOT included at the end.
      expect(artifacts[0].source).not.toMatch(/\/\/# debugId=/);
    });
  });

  describe('source maps', () => {
    it(`serializes with source maps disabled in production using classic serializer`, async () => {
      for (const platform of ['web', 'ios']) {
        const bundle = await serializeTo({
          options: {
            dev: false,
            platform,
            hermes: false,
            // output: 'static',
            sourceMaps: false,
          },
        });

        // Ensure no directive to include them is added.
        expect(bundle.code).not.toMatch(/\/\/# sourceMappingURL=/);
      }
    });
    it(`serializes with source maps disabled in production for web`, async () => {
      const artifacts = await serializeTo({
        options: {
          dev: false,
          platform: 'web',
          hermes: false,
          output: 'static',
          sourceMaps: false,
        },
      });

      // Ensure no source maps exist
      expect(artifacts.map(({ filename }: SerialAsset) => filename)).toEqual([
        expect.stringMatching(/_expo\/static\/js\/web\/index-(?<md5>[0-9a-fA-F]{32})\.js/),
      ]);

      // Ensure no directive to include them is added.
      expect(artifacts[0].source).not.toMatch(/\/\/# sourceMappingURL=/);
    });

    it(`serializes with adjusted hbc source maps in production`, async () => {
      const artifacts = await serializeTo({
        options: {
          dev: false,
          platform: 'ios',
          hermes: true,
          output: 'static',
          sourceMaps: true,
        },
      });

      // Ensure the assets both use the .hbc extension
      expect(artifacts.map(({ filename }: SerialAsset) => filename)).toEqual([
        expect.stringMatching(/_expo\/static\/js\/ios\/index-(?<md5>[0-9a-fA-F]{32})\.hbc/),
        expect.stringMatching(/_expo\/static\/js\/ios\/index-(?<md5>[0-9a-fA-F]{32})\.hbc\.map/),
      ]);

      // Ensure the annotation is included and uses the .hbc.map. We make this modification as
      // a string before passing to Hermes.
      expect(artifacts[0].source).toMatch(
        /\/\/# sourceMappingURL=https:\/\/localhost:8081\/_expo\/static\/js\/ios\/index-(?<md5>[0-9a-fA-F]{32})\.hbc\.map/
      );
    });
    it(`serializes with relative base url in production`, async () => {
      const artifacts = await serializeTo({
        options: {
          dev: false,
          platform: 'ios',
          hermes: false,
          output: 'static',
          sourceMaps: true,
          baseUrl: '/subdomain/',
        },
      });

      // Ensure the assets both use the .hbc extension
      expect(artifacts.map(({ filename }: SerialAsset) => filename)).toEqual([
        expect.stringMatching(/_expo\/static\/js\/ios\/index-(?<md5>[0-9a-fA-F]{32})\.js/),
        expect.stringMatching(/_expo\/static\/js\/ios\/index-(?<md5>[0-9a-fA-F]{32})\.js\.map/),
      ]);

      // Ensure the source uses the relative base URL in production to fetch maps from a non-standard hosting location.
      expect(artifacts[0].source).toMatch(
        /\/\/# sourceMappingURL=https:\/\/localhost:8081\/subdomain\/_expo\/static\/js\/ios\/index-(?<md5>[0-9a-fA-F]{32})\.js\.map/
      );
    });
    it(`serializes source maps in production for web`, async () => {
      const artifacts = await serializeTo({
        options: {
          dev: false,
          platform: 'web',
          hermes: false,
          output: 'static',
          sourceMaps: true,
        },
      });

      // Ensure the assets both use the .hbc extension
      expect(artifacts.map(({ filename }: SerialAsset) => filename)).toEqual([
        expect.stringMatching(/_expo\/static\/js\/web\/index-(?<md5>[0-9a-fA-F]{32})\.js/),
        expect.stringMatching(/_expo\/static\/js\/web\/index-(?<md5>[0-9a-fA-F]{32})\.js\.map/),
      ]);

      // Ensure the source uses the relative base URL in production to fetch maps from a non-standard hosting location.
      expect(artifacts[0].source).toMatch(
        /\/\/# sourceMappingURL=\/_expo\/static\/js\/web\/index-(?<md5>[0-9a-fA-F]{32})\.js\.map/
      );
    });

    it(`serializes with relative base url in production for web`, async () => {
      const artifacts = await serializeTo({
        options: {
          dev: false,
          platform: 'web',
          hermes: false,
          output: 'static',
          sourceMaps: true,
          baseUrl: '/subdomain/',
        },
      });

      // Ensure the assets both use the .hbc extension
      expect(artifacts.map(({ filename }: SerialAsset) => filename)).toEqual([
        expect.stringMatching(/_expo\/static\/js\/web\/index-(?<md5>[0-9a-fA-F]{32})\.js/),
        expect.stringMatching(/_expo\/static\/js\/web\/index-(?<md5>[0-9a-fA-F]{32})\.js\.map/),
      ]);

      // Ensure the source uses the relative base URL in production to fetch maps from a non-standard hosting location.
      expect(artifacts[0].source).toMatch(
        /\/\/# sourceMappingURL=\/subdomain\/_expo\/static\/js\/web\/index-(?<md5>[0-9a-fA-F]{32})\.js\.map/
      );
    });

    it(`serializes with absolute base url in production`, async () => {
      const artifacts = await serializeTo({
        options: {
          dev: false,
          platform: 'ios',
          hermes: false,
          output: 'static',
          sourceMaps: true,
          baseUrl: 'https://evanbacon.dev',
        },
      });

      // Ensure the assets both use the .hbc extension
      expect(artifacts.map(({ filename }: SerialAsset) => filename)).toEqual([
        expect.stringMatching(/_expo\/static\/js\/ios\/index-(?<md5>[0-9a-fA-F]{32})\.js/),
        expect.stringMatching(/_expo\/static\/js\/ios\/index-(?<md5>[0-9a-fA-F]{32})\.js\.map/),
      ]);

      // Ensure the source uses the absolute base URL in production to fetch maps from a non-standard hosting location.
      expect(artifacts[0].source).toMatch(
        /\/\/# sourceMappingURL=https:\/\/evanbacon\.dev\/_expo\/static\/js\/ios\/index-(?<md5>[0-9a-fA-F]{32})\.js\.map/
      );
    });

    it(`serializes with absolute base url in production for web`, async () => {
      const artifacts = await serializeTo({
        options: {
          dev: false,
          platform: 'web',
          hermes: false,
          output: 'static',
          sourceMaps: true,
          baseUrl: 'https://evanbacon.dev',
        },
      });

      // Ensure the assets both use the .hbc extension
      expect(artifacts.map(({ filename }: SerialAsset) => filename)).toEqual([
        expect.stringMatching(/_expo\/static\/js\/web\/index-(?<md5>[0-9a-fA-F]{32})\.js/),
        expect.stringMatching(/_expo\/static\/js\/web\/index-(?<md5>[0-9a-fA-F]{32})\.js\.map/),
      ]);

      // Ensure the source uses the absolute base URL in production to fetch maps from a non-standard hosting location.
      expect(artifacts[0].source).toMatch(
        /\/\/# sourceMappingURL=https:\/\/evanbacon\.dev\/_expo\/static\/js\/web\/index-(?<md5>[0-9a-fA-F]{32})\.js\.map/
      );
    });

    it(`does not use hbc or adjusted source map URL in development`, async () => {
      const artifacts = await serializeTo({
        options: {
          dev: true,
          platform: 'ios',
          hermes: true,
          output: 'static',
          sourceMaps: true,
        },
      });

      expect(artifacts.map(({ filename }: SerialAsset) => filename)).toEqual([
        expect.stringMatching(/\/app\/index\.js/),
        expect.stringMatching(/\/app\/index\.js\.map/),
      ]);

      // Ensure the absolute dev URL is being used.
      expect(artifacts[0].source).toMatch(
        `//# sourceMappingURL=https://localhost:8081/indedx.bundle?dev=false`
      );
    });
  });

  it(`passes sanity`, async () => {
    const serializer = createSerializerFromSerialProcessors(
      {
        projectRoot,
      },
      [],
      null // originalSerializer
    );

    const fs = {
      'index.js': `
        import { foo } from './foo';
        console.log(foo);
      `,
      'foo.js': `
        export const foo = 'foo';
      `,
    };

    expect(await serializer(...(await microBundle({ fs })))).toMatchInlineSnapshot(`
      "__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
        "use strict";

        var _foo = require(_dependencyMap[0], "./foo");
        console.log(_foo.foo);
      },"/app/index.js",["/app/foo.js"],"index.js");
      __d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
        "use strict";

        Object.defineProperty(exports, '__esModule', {
          value: true
        });
        Object.defineProperty(exports, "foo", {
          enumerable: true,
          get: function () {
            return foo;
          }
        });
        const foo = 'foo';
      },"/app/foo.js",[],"foo.js");
      __r("/app/index.js");"
    `);
  });

  it(`bundles basic development native using string output`, async () => {
    const str = await serializeTo({
      options: {
        dev: true,
        platform: 'ios',
        hermes: false,
        sourceMaps: false,
      },
    });
    expect(typeof str).toBe('string');
    // Ensure the module is run.
    expect(str).toMatch(/__r\("\/app\/index\.js"\);/);
  });
  it(`bundles basic production native using object output`, async () => {
    const bundle = await serializeTo({
      options: {
        dev: false,
        platform: 'ios',
        hermes: false,
        sourceMaps: false,
      },
    });
    expect(typeof bundle).toBe('object');
    // Ensure the module is run.
    expect(bundle.code).toMatch(/__r\("\/app\/index\.js"\);/);
  });

  // This is how most people will be bundling for production.
  it(`bundles basic production native with async imports`, async () => {
    const bundle = await serializeTo({
      fs: {
        'index.js': `
          import('./foo')
        `,
        'foo.js': `
          export const foo = 'foo';
        `,
      },
      options: {
        dev: false,
        platform: 'ios',
        hermes: false,
        sourceMaps: false,
      },
    });
    expect(typeof bundle).toBe('object');
    // Ensure the module is run.
    expect(bundle.code).toMatch(/__r\("\/app\/index\.js"\);/);
    expect(bundle.code).toMatch(/expo-mock\/async-require/);
    expect(bundle.map).toMatch(/debugId/);
  });

  it(`bundle splits a weak import`, async () => {
    // Real Metro omits weak-only targets; this fixture preserves legacy test behavior.
    const artifacts = await serializeSplitAsync(
      {
        'index.js': `
          require.resolveWeak('./foo')
        `,
        'foo.js': `
          export const foo = 'foo';
        `,
      },
      { legacyTraverseWeakDependencies: true }
    );

    expect(artifacts.map((art: SerialAsset) => art.filename)).toMatchInlineSnapshot(`
      [
        "_expo/static/js/web/index-f631db5a9fee66d5406872a2cc2e5558.js",
        "_expo/static/js/web/foo-309ed73104dd28f5ce09af0d7b6b1521.js",
      ]
    `);

    expect(artifacts).toMatchInlineSnapshot(`
      [
        {
          "filename": "_expo/static/js/web/index-f631db5a9fee66d5406872a2cc2e5558.js",
          "metadata": {
            "expoDomComponentReferences": [],
            "isAsync": false,
            "loaderReferences": [],
            "modulePaths": [
              "/app/index.js",
            ],
            "paths": {
              "/app/index.js": {
                "/app/foo.js": "/_expo/static/js/web/foo-309ed73104dd28f5ce09af0d7b6b1521.js",
              },
            },
            "reactClientReferences": [],
            "reactServerReferences": [],
            "requires": [],
          },
          "originFilename": "index.js",
          "source": "__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
        _dependencyMap[0];
      },"/app/index.js",{"0":"/app/foo.js","paths":{"/app/foo.js":"/_expo/static/js/web/foo-309ed73104dd28f5ce09af0d7b6b1521.js"}});
      __r("/app/index.js");",
          "type": "js",
        },
        {
          "filename": "_expo/static/js/web/foo-309ed73104dd28f5ce09af0d7b6b1521.js",
          "metadata": {
            "expoDomComponentReferences": [],
            "isAsync": true,
            "loaderReferences": [],
            "modulePaths": [
              "/app/foo.js",
            ],
            "paths": {},
            "reactClientReferences": [],
            "reactServerReferences": [],
            "requires": [],
          },
          "originFilename": "foo.js",
          "source": "__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
        "use strict";

        Object.defineProperty(exports, '__esModule', {
          value: true
        });
        Object.defineProperty(exports, "foo", {
          enumerable: true,
          get: function () {
            return foo;
          }
        });
        const foo = 'foo';
      },"/app/foo.js",[]);",
          "type": "js",
        },
      ]
    `);

    // Split bundle
    expect(artifacts.length).toBe(2);
    expect(artifacts[1].metadata).toEqual({
      isAsync: true,
      modulePaths: ['/app/foo.js'],
      requires: [],
      paths: {},
      expoDomComponentReferences: [],
      reactClientReferences: [],
      reactServerReferences: [],
      loaderReferences: [],
    });
  });

  it(`bundle splits an async import`, async () => {
    const artifacts = await serializeSplitAsync({
      'index.js': `
          import('./foo')
        `,
      'foo.js': `
          export const foo = 'foo';
        `,
    });

    expect(artifacts.map((art: SerialAsset) => art.filename)).toMatchInlineSnapshot(`
      [
        "_expo/static/js/web/index-a1e03706df6c963e230df48652b91bae.js",
        "_expo/static/js/web/foo-309ed73104dd28f5ce09af0d7b6b1521.js",
      ]
    `);

    expect(artifacts).toMatchInlineSnapshot(`
      [
        {
          "filename": "_expo/static/js/web/index-a1e03706df6c963e230df48652b91bae.js",
          "metadata": {
            "expoDomComponentReferences": [],
            "isAsync": false,
            "loaderReferences": [],
            "modulePaths": [
              "/app/index.js",
              "/app/expo-mock/async-require",
            ],
            "paths": {
              "/app/index.js": {
                "/app/foo.js": "/_expo/static/js/web/foo-309ed73104dd28f5ce09af0d7b6b1521.js",
              },
            },
            "reactClientReferences": [],
            "reactServerReferences": [],
            "requires": [],
          },
          "originFilename": "index.js",
          "source": "__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
        require(_dependencyMap[1])(_dependencyMap[0], _dependencyMap.paths);
      },"/app/index.js",{"0":"/app/foo.js","1":"/app/expo-mock/async-require","paths":{"/app/foo.js":"/_expo/static/js/web/foo-309ed73104dd28f5ce09af0d7b6b1521.js"}});
      __d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
        module.exports = () => 'MOCK';
      },"/app/expo-mock/async-require",[]);
      __r("/app/index.js");",
          "type": "js",
        },
        {
          "filename": "_expo/static/js/web/foo-309ed73104dd28f5ce09af0d7b6b1521.js",
          "metadata": {
            "expoDomComponentReferences": [],
            "isAsync": true,
            "loaderReferences": [],
            "modulePaths": [
              "/app/foo.js",
            ],
            "paths": {},
            "reactClientReferences": [],
            "reactServerReferences": [],
            "requires": [],
          },
          "originFilename": "foo.js",
          "source": "__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
        "use strict";

        Object.defineProperty(exports, '__esModule', {
          value: true
        });
        Object.defineProperty(exports, "foo", {
          enumerable: true,
          get: function () {
            return foo;
          }
        });
        const foo = 'foo';
      },"/app/foo.js",[]);",
          "type": "js",
        },
      ]
    `);

    // Split bundle
    expect(artifacts.length).toBe(2);
    expect(artifacts[1].metadata).toEqual({
      isAsync: true,
      modulePaths: ['/app/foo.js'],
      requires: [],
      paths: {},
      expoDomComponentReferences: [],
      reactClientReferences: [],
      reactServerReferences: [],
      loaderReferences: [],
    });
  });

  it(`bundle splits an async import with parentheses in the name`, async () => {
    const artifacts = await serializeSplitAsync({
      'index.js': `
          import('./(foo)/index.js')
          import('./[foo].js')
          import('./{foo}.js')
          import('./+foo.js')
        `,
      '[foo].js': '//',
      '{foo}.js': '//',
      '+foo.js': '//',
      '(foo)/index.js': `
          export const foo = 'foo';
        `,
    });

    expect(artifacts.map((art: SerialAsset) => art.filename)).toEqual([
      '_expo/static/js/web/index-bb55c8c42b9f1847a103b7a551da8c95.js',
      '_expo/static/js/web/index-1e9b37b7a0c3033d8b3385bd9a556dae.js',
      '_expo/static/js/web/[foo]-1a2cc21e93a511f706afa2c3afea0a7f.js',
      '_expo/static/js/web/{foo}-c42fc7ce5bc02ecac6a19badaeaf106d.js',
      '_expo/static/js/web/+foo-844771169e7b021c9c9b7fc0c1eda77d.js',
    ]);

    // Split bundle
    expect(artifacts.length).toBe(5);
    expect(artifacts[1].metadata).toEqual({
      isAsync: true,
      modulePaths: ['/app/(foo)/index.js'],
      requires: [],
      paths: {},
      expoDomComponentReferences: [],
      reactClientReferences: [],
      reactServerReferences: [],
      loaderReferences: [],
    });
  });

  it(`does not emit empty files when splitting`, async () => {
    const artifacts = await serializeSplitAsync({
      'index.js': `
          import('./one')
          import "./one";
        `,
      'one.js': `
          export const a = ""
        `,
      'two.js': `
          import('./foo')
        `,
      'foo.js': `
          export const foo = 'foo';
        `,
    });

    // Ensure no async paths are injected
    expect(artifacts[0].source).toMatch(/"paths":{}/);
    expect(artifacts[0].source).toMatch(/a = "";/);

    // Ensure no empty files are emitted
    for (const artifact of artifacts) {
      expect(artifact.source).not.toEqual('');
    }
  });

  it(`imports async bundles in second module`, async () => {
    const artifacts = await serializeSplitAsync({
      'index.js': `
          import "./two"
        `,
      'two.js': `
          import('./foo')
        `,
      'foo.js': `
          export const foo = 'foo';
        `,
    });

    expect(artifacts.map((art: SerialAsset) => art.filename)).toMatchInlineSnapshot(`
      [
        "_expo/static/js/web/index-8f46e7eee056ec5f7f583193e3459d80.js",
        "_expo/static/js/web/foo-309ed73104dd28f5ce09af0d7b6b1521.js",
      ]
    `);

    expect(artifacts).toMatchInlineSnapshot(`
      [
        {
          "filename": "_expo/static/js/web/index-8f46e7eee056ec5f7f583193e3459d80.js",
          "metadata": {
            "expoDomComponentReferences": [],
            "isAsync": false,
            "loaderReferences": [],
            "modulePaths": [
              "/app/index.js",
              "/app/two.js",
              "/app/expo-mock/async-require",
            ],
            "paths": {
              "/app/two.js": {
                "/app/foo.js": "/_expo/static/js/web/foo-309ed73104dd28f5ce09af0d7b6b1521.js",
              },
            },
            "reactClientReferences": [],
            "reactServerReferences": [],
            "requires": [],
          },
          "originFilename": "index.js",
          "source": "__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
        "use strict";

        require(_dependencyMap[0]);
      },"/app/index.js",["/app/two.js"]);
      __d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
        require(_dependencyMap[1])(_dependencyMap[0], _dependencyMap.paths);
      },"/app/two.js",{"0":"/app/foo.js","1":"/app/expo-mock/async-require","paths":{"/app/foo.js":"/_expo/static/js/web/foo-309ed73104dd28f5ce09af0d7b6b1521.js"}});
      __d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
        module.exports = () => 'MOCK';
      },"/app/expo-mock/async-require",[]);
      __r("/app/index.js");",
          "type": "js",
        },
        {
          "filename": "_expo/static/js/web/foo-309ed73104dd28f5ce09af0d7b6b1521.js",
          "metadata": {
            "expoDomComponentReferences": [],
            "isAsync": true,
            "loaderReferences": [],
            "modulePaths": [
              "/app/foo.js",
            ],
            "paths": {},
            "reactClientReferences": [],
            "reactServerReferences": [],
            "requires": [],
          },
          "originFilename": "foo.js",
          "source": "__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
        "use strict";

        Object.defineProperty(exports, '__esModule', {
          value: true
        });
        Object.defineProperty(exports, "foo", {
          enumerable: true,
          get: function () {
            return foo;
          }
        });
        const foo = 'foo';
      },"/app/foo.js",[]);",
          "type": "js",
        },
      ]
    `);

    // Split bundle
    expect(artifacts.length).toBe(2);
    expect(artifacts[1].metadata).toEqual({
      isAsync: true,
      modulePaths: ['/app/foo.js'],
      requires: [],
      paths: {},
      expoDomComponentReferences: [],
      reactClientReferences: [],
      reactServerReferences: [],
      loaderReferences: [],
    });
  });

  it(`dedupes deps into common and runtime modules in async imports`, async () => {
    const artifacts = await serializeSplitAsync(
      {
        'index.js': `
          import('./a');
          import('./b');
          import('./c');
        `,
        'a.js': `
          import './d';
          import './e';
          export const a = 'a';
        `,
        'b.js': `
          import './d';
          export const b = 'b';
        `,
        'c.js': `
        import './e';
        export const c = 'c';
      `,
        'd.js': `
          export const d = 'd';
        `,
        'e.js': `
        export const e = 'e';
      `,
      },
      undefined, // microBundleOptions
      undefined, // processors
      undefined, // serializerConfigOptions
      {
        __premodule__: `
          console.log('PRE_MODULE_TEST');
        `,
      }
    );

    expect(artifacts.map((art: SerialAsset) => art.filename)).toMatchInlineSnapshot(`
      [
        "_expo/static/js/web/index-733b8d63be178d35fb5ddeba258ccdf9.js",
        "_expo/static/js/web/a-12c7a49f9bd14cd5825ead8b8b20af16.js",
        "_expo/static/js/web/b-530ae3505b2e7d48992cf467aa3b51b5.js",
        "_expo/static/js/web/c-56e8e09d8263e0e34c2784569336ac37.js",
        "_expo/static/js/web/__common-39fcae1c62a6d2e698c18534fd82e6c6.js",
        "_expo/static/js/web/__expo-metro-runtime-49146aac8fa3540454ba583868edfc36.js",
      ]
    `);

    expect(artifacts).toMatchInlineSnapshot(`
      [
        {
          "filename": "_expo/static/js/web/index-733b8d63be178d35fb5ddeba258ccdf9.js",
          "metadata": {
            "expoDomComponentReferences": [],
            "isAsync": false,
            "loaderReferences": [],
            "modulePaths": [
              "/app/index.js",
              "/app/expo-mock/async-require",
            ],
            "paths": {
              "/app/index.js": {
                "/app/a.js": "/_expo/static/js/web/a-12c7a49f9bd14cd5825ead8b8b20af16.js",
                "/app/b.js": "/_expo/static/js/web/b-530ae3505b2e7d48992cf467aa3b51b5.js",
                "/app/c.js": "/_expo/static/js/web/c-56e8e09d8263e0e34c2784569336ac37.js",
              },
            },
            "reactClientReferences": [],
            "reactServerReferences": [],
            "requires": [
              "_expo/static/js/web/__common-39fcae1c62a6d2e698c18534fd82e6c6.js",
              "_expo/static/js/web/__expo-metro-runtime-49146aac8fa3540454ba583868edfc36.js",
            ],
          },
          "originFilename": "index.js",
          "source": "__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
        require(_dependencyMap[1])(_dependencyMap[0], _dependencyMap.paths);
        require(_dependencyMap[1])(_dependencyMap[2], _dependencyMap.paths);
        require(_dependencyMap[1])(_dependencyMap[3], _dependencyMap.paths);
      },"/app/index.js",{"0":"/app/a.js","1":"/app/expo-mock/async-require","2":"/app/b.js","3":"/app/c.js","paths":{"/app/a.js":"/_expo/static/js/web/a-12c7a49f9bd14cd5825ead8b8b20af16.js","/app/b.js":"/_expo/static/js/web/b-530ae3505b2e7d48992cf467aa3b51b5.js","/app/c.js":"/_expo/static/js/web/c-56e8e09d8263e0e34c2784569336ac37.js"}});
      __d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
        module.exports = () => 'MOCK';
      },"/app/expo-mock/async-require",[]);
      __r("/app/index.js");",
          "type": "js",
        },
        {
          "filename": "_expo/static/js/web/a-12c7a49f9bd14cd5825ead8b8b20af16.js",
          "metadata": {
            "expoDomComponentReferences": [],
            "isAsync": true,
            "loaderReferences": [],
            "modulePaths": [
              "/app/a.js",
            ],
            "paths": {},
            "reactClientReferences": [],
            "reactServerReferences": [],
            "requires": [
              "_expo/static/js/web/__expo-metro-runtime-49146aac8fa3540454ba583868edfc36.js",
            ],
          },
          "originFilename": "a.js",
          "source": "__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
        "use strict";

        Object.defineProperty(exports, '__esModule', {
          value: true
        });
        Object.defineProperty(exports, "a", {
          enumerable: true,
          get: function () {
            return a;
          }
        });
        require(_dependencyMap[0]);
        require(_dependencyMap[1]);
        const a = 'a';
      },"/app/a.js",["/app/d.js","/app/e.js"]);",
          "type": "js",
        },
        {
          "filename": "_expo/static/js/web/b-530ae3505b2e7d48992cf467aa3b51b5.js",
          "metadata": {
            "expoDomComponentReferences": [],
            "isAsync": true,
            "loaderReferences": [],
            "modulePaths": [
              "/app/b.js",
            ],
            "paths": {},
            "reactClientReferences": [],
            "reactServerReferences": [],
            "requires": [
              "_expo/static/js/web/__expo-metro-runtime-49146aac8fa3540454ba583868edfc36.js",
            ],
          },
          "originFilename": "b.js",
          "source": "__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
        "use strict";

        Object.defineProperty(exports, '__esModule', {
          value: true
        });
        Object.defineProperty(exports, "b", {
          enumerable: true,
          get: function () {
            return b;
          }
        });
        require(_dependencyMap[0]);
        const b = 'b';
      },"/app/b.js",["/app/d.js"]);",
          "type": "js",
        },
        {
          "filename": "_expo/static/js/web/c-56e8e09d8263e0e34c2784569336ac37.js",
          "metadata": {
            "expoDomComponentReferences": [],
            "isAsync": true,
            "loaderReferences": [],
            "modulePaths": [
              "/app/c.js",
            ],
            "paths": {},
            "reactClientReferences": [],
            "reactServerReferences": [],
            "requires": [
              "_expo/static/js/web/__expo-metro-runtime-49146aac8fa3540454ba583868edfc36.js",
            ],
          },
          "originFilename": "c.js",
          "source": "__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
        "use strict";

        Object.defineProperty(exports, '__esModule', {
          value: true
        });
        Object.defineProperty(exports, "c", {
          enumerable: true,
          get: function () {
            return c;
          }
        });
        require(_dependencyMap[0]);
        const c = 'c';
      },"/app/c.js",["/app/e.js"]);",
          "type": "js",
        },
        {
          "filename": "_expo/static/js/web/__common-39fcae1c62a6d2e698c18534fd82e6c6.js",
          "metadata": {
            "expoDomComponentReferences": [],
            "isAsync": false,
            "loaderReferences": [],
            "modulePaths": [
              "/app/d.js",
              "/app/e.js",
            ],
            "paths": {},
            "reactClientReferences": [],
            "reactServerReferences": [],
            "requires": [
              "_expo/static/js/web/__expo-metro-runtime-49146aac8fa3540454ba583868edfc36.js",
            ],
          },
          "originFilename": "../__common.js",
          "source": "__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
        "use strict";

        Object.defineProperty(exports, '__esModule', {
          value: true
        });
        Object.defineProperty(exports, "d", {
          enumerable: true,
          get: function () {
            return d;
          }
        });
        const d = 'd';
      },"/app/d.js",[]);
      __d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
        "use strict";

        Object.defineProperty(exports, '__esModule', {
          value: true
        });
        Object.defineProperty(exports, "e", {
          enumerable: true,
          get: function () {
            return e;
          }
        });
        const e = 'e';
      },"/app/e.js",[]);",
          "type": "js",
        },
        {
          "filename": "_expo/static/js/web/__expo-metro-runtime-49146aac8fa3540454ba583868edfc36.js",
          "metadata": {
            "expoDomComponentReferences": [],
            "isAsync": false,
            "loaderReferences": [],
            "modulePaths": [],
            "paths": {},
            "reactClientReferences": [],
            "reactServerReferences": [],
            "requires": [],
          },
          "originFilename": "../__expo-metro-runtime.js",
          "source": "__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
        console.log('PRE_MODULE_TEST');
      },"/app/__premodule__",[]);",
          "type": "js",
        },
      ]
    `);

    // Split bundle
    expect(artifacts.length).toBe(6);
    expect(artifacts[0].source).not.toMatch(/PRE_MODULE_TEST/);
    expect(artifacts[1].metadata).toEqual({
      isAsync: true,
      modulePaths: ['/app/a.js'],
      requires: [expect.stringMatching(/_expo\/static\/js\/web\/__expo-metro-runtime-.*\.js/)],
      paths: {},
      expoDomComponentReferences: [],
      reactClientReferences: [],
      reactServerReferences: [],
      loaderReferences: [],
    });
    expect(artifacts[2].metadata).toEqual({
      isAsync: true,
      modulePaths: ['/app/b.js'],
      requires: [expect.stringMatching(/_expo\/static\/js\/web\/__expo-metro-runtime-.*\.js/)],
      paths: {},
      expoDomComponentReferences: [],
      reactClientReferences: [],
      reactServerReferences: [],
      loaderReferences: [],
    });

    expect(artifacts[4].filename).toEqual(
      expect.stringMatching(/_expo\/static\/js\/web\/__common-.*\.js/)
    );
    expect(artifacts[4].metadata).toEqual({
      isAsync: false,
      modulePaths: ['/app/d.js', '/app/e.js'],
      requires: [expect.stringMatching(/_expo\/static\/js\/web\/__expo-metro-runtime-.*\.js/)],
      paths: {},
      expoDomComponentReferences: [],
      reactClientReferences: [],
      reactServerReferences: [],
      loaderReferences: [],
    });
    // Ensure the common chunk isn't run, just loaded.
    expect(artifacts[4].source).not.toMatch(/__r/);
    expect(artifacts[4].source).not.toMatch(/PRE_MODULE_TEST/);

    expect(artifacts[5].filename).toEqual(
      expect.stringMatching(/_expo\/static\/js\/web\/__expo-metro-runtime-.*\.js/)
    );
    expect(artifacts[5].metadata).toEqual({
      isAsync: false,
      requires: [], // No requires in the runtime chunk.
      modulePaths: [],
      paths: {},
      expoDomComponentReferences: [],
      reactClientReferences: [],
      reactServerReferences: [],
      loaderReferences: [],
    });
    expect(artifacts[5].source).toMatch(/PRE_MODULE_TEST/);
  });

  it(`supports caching a shared chunk that doesn't change between runs`, async () => {
    const artifacts = await serializeSplitAsync({
      'index.js': `
          import('./math');
          console.log('a');
        `,
      'math.js': `
          export const add = 'add';
        `,
    });

    const artifacts2 = await serializeSplitAsync({
      'index.js': `
          import('./math');
          console.log('b');
        `,
      'math.js': `
          export const add = 'add';
        `,
    });

    expect(artifacts[0].filename).not.toEqual(artifacts2[0].filename);
    expect(artifacts[1].filename).toEqual(artifacts2[1].filename);
  });

  it(`invalidates cache when shared chunk import name changes`, async () => {
    const artifacts = await serializeSplitAsync({
      'index.js': `import('./math');`,
      'math.js': `//`,
    });

    const artifacts2 = await serializeSplitAsync({
      'index.js': `import('./math');`,
      'math.ts': `//`,
    });

    // The entire chain should be invalidated.
    expect(artifacts[0].filename).not.toEqual(artifacts2[0].filename);
    expect(artifacts[1].filename).not.toEqual(artifacts2[1].filename);
  });

  it(`invalidates cache when shared chunk changes`, async () => {
    const artifacts = await serializeSplitAsync({
      'index.js': `
          import('./math');
          console.log('a');
        `,
      'math.js': `
          export const add = 'add';
        `,
    });

    const artifacts2 = await serializeSplitAsync({
      'index.js': `
          import('./math');
          console.log('b');
        `,
      'math.js': `
          export const add = 'sub';
        `,
    });

    // The entire chain should be invalidated.
    expect(artifacts[0].filename).not.toEqual(artifacts2[0].filename);
    expect(artifacts[1].filename).not.toEqual(artifacts2[1].filename);
  });

  describe.each(['legacy', 'granular'] as const)('%s chunk filenames', (chunkingStrategy) => {
    it('treats worker entry paths literally instead of matching other graph entries', async () => {
      const artifacts: SerialAsset[] = await serializeSplitAsync(
        {
          'index.js': `require.unstable_resolveWorker('./worker*'); import('./worker-other');`,
          'worker*.js': `console.log('worker');`,
          'worker-other.js': `console.log('page route');`,
        },
        { chunkingStrategy }
      );
      const worker = artifacts.find((asset) =>
        asset.metadata.modulePaths?.includes('/app/worker*.js')
      )!;
      expect(worker.metadata.modulePaths).toEqual(['/app/worker*.js']);
      expect(
        artifacts.some((asset) => asset.metadata.modulePaths?.includes('/app/worker-other.js'))
      ).toBe(true);
    });

    it(`invalidates parent chunk when a transitive async chunk changes`, async () => {
      const artifacts = await serializeSplitAsync(
        {
          'index.js': `import('./math');`,
          'math.js': `import('./util');`,
          'util.js': `export const u = 'before';`,
        },
        { chunkingStrategy }
      );

      const artifacts2 = await serializeSplitAsync(
        {
          'index.js': `import('./math');`,
          'math.js': `import('./util');`,
          'util.js': `export const u = 'after';`,
        },
        { chunkingStrategy }
      );

      const byOrigin = (a: SerialAsset[]) =>
        Object.fromEntries(a.map((art) => [art.originFilename, art]));
      const a = byOrigin(artifacts);
      const b = byOrigin(artifacts2);

      expect(a['util.js']!.filename).not.toEqual(b['util.js']!.filename);
      expect(a['math.js']!.filename).not.toEqual(b['math.js']!.filename);
      expect(a['index.js']!.filename).not.toEqual(b['index.js']!.filename);
    });

    it(`invalidates both branches of a diamond when the shared leaf changes`, async () => {
      const artifacts = await serializeSplitAsync(
        {
          'index.js': `import('./a'); import('./b');`,
          'a.js': `import('./leaf'); export const a = 'a';`,
          'b.js': `import('./leaf'); export const b = 'b';`,
          'leaf.js': `export const leaf = 'before';`,
        },
        { chunkingStrategy }
      );

      const artifacts2 = await serializeSplitAsync(
        {
          'index.js': `import('./a'); import('./b');`,
          'a.js': `import('./leaf'); export const a = 'a';`,
          'b.js': `import('./leaf'); export const b = 'b';`,
          'leaf.js': `export const leaf = 'after';`,
        },
        { chunkingStrategy }
      );

      const byOrigin = (a: SerialAsset[]) =>
        Object.fromEntries(a.map((art) => [art.originFilename, art]));
      const before = byOrigin(artifacts);
      const after = byOrigin(artifacts2);

      expect(before['leaf.js']!.filename).not.toEqual(after['leaf.js']!.filename);
      expect(before['a.js']!.filename).not.toEqual(after['a.js']!.filename);
      expect(before['b.js']!.filename).not.toEqual(after['b.js']!.filename);
      expect(before['index.js']!.filename).not.toEqual(after['index.js']!.filename);
    });

    it(`parent chunk source references the child chunk's actual filename`, async () => {
      const artifacts = await serializeSplitAsync(
        {
          'index.js': `import('./math');`,
          'math.js': `import('./util'); export const m = 1;`,
          'util.js': `export const u = 2;`,
        },
        { chunkingStrategy }
      );

      const byOrigin = Object.fromEntries(
        artifacts.map((art: SerialAsset) => [art.originFilename, art] as const)
      );
      expect(byOrigin['index.js']!.source).toContain(byOrigin['math.js']!.filename);
      expect(byOrigin['math.js']!.source).toContain(byOrigin['util.js']!.filename);
    });

    it(`mutually async-importing chunks invalidate each other and reference each other's actual filenames`, async () => {
      const sources = (aBody: string) => ({
        'index.js': `import('./a');`,
        'a.js': `import('./b'); export const a = ${JSON.stringify(aBody)};`,
        'b.js': `import('./a'); export const b = 'b';`,
      });

      const artifacts = await serializeSplitAsync(sources('before'), {
        chunkingStrategy,
      });
      const artifactsRepeat = await serializeSplitAsync(sources('before'), {
        chunkingStrategy,
      });
      const artifactsChanged = await serializeSplitAsync(sources('after'), {
        chunkingStrategy,
      });

      const byOrigin = (a: SerialAsset[]) =>
        Object.fromEntries(a.map((art) => [art.originFilename, art]));
      const first = byOrigin(artifacts);
      const repeat = byOrigin(artifactsRepeat);
      const changed = byOrigin(artifactsChanged);

      // Deterministic: identical sources produce identical filenames.
      expect(first['a.js']!.filename).toEqual(repeat['a.js']!.filename);
      expect(first['b.js']!.filename).toEqual(repeat['b.js']!.filename);

      // Cycle members cross-invalidate: changing only `a` shifts `b`'s filename too.
      expect(first['a.js']!.filename).not.toEqual(changed['a.js']!.filename);
      expect(first['b.js']!.filename).not.toEqual(changed['b.js']!.filename);

      // Each member's emitted bundle references the other's actual filename.
      expect(first['a.js']!.source).toContain(first['b.js']!.filename);
      expect(first['b.js']!.source).toContain(first['a.js']!.filename);
    });
  });

  describe('client references', () => {
    it(`bundles with client references`, async () => {
      const artifacts = await serializeSplitAsync(
        {
          'index.js': `
            import './other.js'
          `,
          'other.js': '"use client"; export const foo = true',
        },
        {
          isReactServer: true,
        }
      );

      expect(artifacts.map((art: SerialAsset) => art.filename)).toEqual([
        expect.stringMatching(/_expo\/static\/js\/web\/index-(?<md5>[0-9a-fA-F]{32})\.js/),
      ]);

      // Split bundle
      expect(artifacts.length).toBe(1);
      expect(artifacts[0].metadata).toEqual({
        isAsync: false,
        modulePaths: ['/app/index.js', '/app/other.js', '/app/react-server-dom-webpack/server'],
        paths: {},
        expoDomComponentReferences: [],
        reactClientReferences: ['file:///app/other.js'],
        reactServerReferences: [],
        loaderReferences: [],
        requires: [],
      });

      expect(artifacts[0].source).toMatchInlineSnapshot(`
        "__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
          "use strict";

          require(_dependencyMap[0]);
        },"/app/index.js",["/app/other.js"]);
        __d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
          "use strict";

          Object.defineProperty(exports, '__esModule', {
            value: true
          });
          Object.defineProperty(exports, "foo", {
            enumerable: true,
            get: function () {
              return foo;
            }
          });
          const proxy = require(_dependencyMap[0]).createClientModuleProxy("./other.js");
          module.exports = proxy;
          const foo = require(_dependencyMap[0]).registerClientReference(function () {
            throw new Error("Attempted to call foo() of /app/other.js from the server but foo is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
          }, "./other.js", "foo");
        },"/app/other.js",["/app/react-server-dom-webpack/server"]);
        __d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {},"/app/react-server-dom-webpack/server",[]);
        module.exports = __r("/app/index.js");"
      `);
    });
    it(`bundles with multiple client references`, async () => {
      const artifacts = await serializeSplitAsync(
        {
          'index.js': `
            import './other.js'
            import './second.js'
          `,
          'other.js': '"use client"; export const foo = true',
          'second.js': '"use client"; require("./third.js"); export const foo = true',
          // This won't be included since we're bundling in RS-mode.
          'third.js': 'export const foo = true',
        },
        {
          isReactServer: true,
        }
      );

      expect(artifacts.length).toBe(1);
      expect(artifacts[0].metadata).toEqual({
        isAsync: false,
        modulePaths: [
          '/app/index.js',
          '/app/other.js',
          '/app/react-server-dom-webpack/server',
          '/app/second.js',
        ],
        paths: {},
        expoDomComponentReferences: [],
        reactClientReferences: ['file:///app/other.js', 'file:///app/second.js'],
        reactServerReferences: [],
        loaderReferences: [],
        requires: [],
      });
    });
  });
  describe('server references', () => {
    it(`collects server references from client modules when bundling in client mode`, async () => {
      const artifacts = await serializeSplitAsync(
        {
          'index.js': `
            import './server-actions.js'
          `,
          'server-actions.js': '"use server"; export async function foo() {}',
        },
        {
          isReactServer: false,
        }
      );

      expect(artifacts.length).toBe(1);
      expect(artifacts[0].metadata).toEqual({
        isAsync: false,
        modulePaths: [
          '/app/index.js',
          '/app/server-actions.js',
          '/app/react-server-dom-webpack/client',
          '/app/expo-router/rsc/internal',
        ],
        paths: {},
        expoDomComponentReferences: [],
        reactClientReferences: [],
        reactServerReferences: ['file:///app/server-actions.js'],
        loaderReferences: [],
        requires: [],
      });
    });
    it(`collects server references from server action functions when bundling in react-server mode`, async () => {
      const artifacts = await serializeSplitAsync(
        {
          'index.js': `
            import './server-actions.js';

            async function funky() {
              "use server";

            }
          `,
          'server-actions.js': '"use server"; export async function foo() {}',
        },
        {
          isReactServer: true,
        }
      );

      expect(artifacts.length).toBe(1);
      expect(artifacts[0].metadata).toEqual({
        isAsync: false,
        modulePaths: [
          '/app/index.js',
          '/app/react-server-dom-webpack/server',
          '/app/server-actions.js',
        ],
        paths: {},
        expoDomComponentReferences: [],
        reactClientReferences: [],
        reactServerReferences: [
          // This appears because we include a server action in the file.
          'file:///app/index.js',
          // This is here because the module is marked with "use server".
          'file:///app/server-actions.js',
        ],
        loaderReferences: [],
        requires: [],
      });
    });
  });
  describe('loader references', () => {
    it(`collects loader reference from module with loader export`, async () => {
      const artifacts = await serializeSplitAsync(
        {
          'app/index.js': `
            export function loader() {
              return { data: 'test' };
            }
            export default function Index() {
              return null;
            }
          `,
        },
        {
          isReactServer: false,
        }
      );

      expect(artifacts.length).toBe(1);
      expect(artifacts[0].metadata).toEqual(
        expect.objectContaining({
          loaderReferences: ['/app/app/index.js'],
        })
      );
    });
    it(`collects loader references from multiple modules`, async () => {
      const artifacts = await serializeSplitAsync(
        {
          // This acts as `_layout` for the two routes below
          'index.js': `
            import './app/index.js';
            import './app/about.js';
          `,
          'app/index.js': `
            export function loader() {
              return { data: 'index' };
            }
            export default function Index() {
              return null;
            }
          `,
          'app/about.js': `
            export function loader() {
              return { data: 'about' };
            }
            export default function About() {
              return null;
            }
          `,
        },
        {
          isReactServer: false,
        }
      );

      expect(artifacts.length).toBe(1);
      expect(artifacts[0].metadata.loaderReferences).toEqual([
        '/app/app/index.js',
        '/app/app/about.js',
      ]);
      expect(artifacts[0].metadata.loaderReferences).toHaveLength(2);
    });
    it(`only collects loader references from modules that have loaders`, async () => {
      const artifacts = await serializeSplitAsync(
        {
          // This acts as `_layout` for the two routes below
          'index.js': `
            import './app/index.js';
            import './app/about.js';
          `,
          'app/index.js': `
            export function loader() {
              return { data: 'index' };
            }
            export default function Index() {
              return null;
            }
          `,
          'app/about.js': `
            export default function About() {
              return null;
            }
          `,
        },
        {
          isReactServer: false,
        }
      );

      expect(artifacts.length).toBe(1);
      expect(artifacts[0].metadata.loaderReferences).toEqual(['/app/app/index.js']);
    });
    it(`does not collect loader references from files outside app/ directory`, async () => {
      const artifacts = await serializeSplitAsync(
        {
          'app/index.js': `
            import '../utils.js';
            export default function Index() {
              return null;
            }
          `,
          'utils.js': `
            // This has a loader but is outside app directory
            export function loader() {
              return { data: 'test' };
            }
            export const helper = () => 'helper';
          `,
        },
        {
          isReactServer: false,
        }
      );

      expect(artifacts.length).toBe(1);
      expect(artifacts[0].metadata.loaderReferences).toEqual([]);
    });
  });
});
