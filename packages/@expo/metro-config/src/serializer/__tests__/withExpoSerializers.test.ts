import assert from 'assert';

import { microBundle, projectRoot } from '../fork/__tests__/mini-metro';
import {
  SerialAsset,
  SerializerConfigOptions,
  SerializerPlugin,
  createSerializerFromSerialProcessors,
  withSerializerPlugins,
} from '../withExpoSerializers';
import { sideEffectsSerializerPlugin } from '../sideEffectsSerializerPlugin';
import {
  createPostTreeShakeTransformSerializerPlugin,
  treeShakeSerializerPlugin,
} from '../treeShakeSerializerPlugin';

describe(withSerializerPlugins, () => {
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
      sourceUrl: 'https://localhost:8081/index.bundle?platform=ios&dev=true&minify=false',
    };
    // @ts-expect-error
    await config.serializer.customSerializer('a', 'b', 'c', options);

    expect(customProcessor).toBeCalledWith('a', 'b', 'c', options);
    expect(customSerializer).toBeCalledWith('a', 'b', 'c', options);
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
  // General helper to reduce boilerplate
  async function serializeToWithGraph(
    options: Partial<Parameters<typeof microBundle>[0]>,
    processors: SerializerPlugin[] = [],
    configOptions: SerializerConfigOptions = {}
  ) {
    const serializer = createSerializerFromSerialProcessors(
      {
        projectRoot,
      },
      processors,
      null, // originalSerializer
      configOptions
    );

    const fs = {
      'index.js': `
        console.log("hello");
      `,
    };

    const serial = microBundle({
      fs,
      ...options,
    });

    const output = (await serializer(...serial)) as any;
    if (options.options?.output === 'static') {
      assert('artifacts' in output && Array.isArray(output.artifacts));
      return [serial, output.artifacts as SerialAsset[]];
    } else {
      return [serial, output];
    }
  }

  // General helper to reduce boilerplate
  async function serializeTo(
    options: Partial<Parameters<typeof microBundle>[0]>,
    processors: SerializerPlugin[] = [],
    configOptions: SerializerConfigOptions = {}
  ) {
    const [, output] = await serializeToWithGraph(options, processors, configOptions);
    return output;
  }

  describe('plugin callbacks', () => {
    it(`runs plugin with static output`, async () => {
      let didPluginRun = false;
      const unstablePlugin = ({ premodules }) => {
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
      const unstablePlugin = ({ premodules }) => {
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
        expect(artifacts.code).toMatch(/\/\/# debugId=6f769d4c-1534-40a6-adc8-eaeb61664424/);

        // Test that the debugId is added to the source map and matches the annotation.
        const debugId = '6f769d4c-1534-40a6-adc8-eaeb61664424';
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

      const filenames = artifacts.map(({ filename }) => filename);

      expect(filenames).toEqual([
        expect.stringMatching(/_expo\/static\/js\/web\/index-[\w\d]+\.js/),
        expect.stringMatching(/_expo\/static\/js\/web\/index-[\w\d]+\.js\.map/),
      ]);

      // Ensure no directive to include them is added.
      expect(artifacts[0].source).toMatch(
        /\/\/# sourceMappingURL=\/_expo\/static\/js\/web\/index-[\w\d]{32}\.js\.map/
      );
      // Debug ID annotation is included at the end.
      expect(artifacts[0].source).toMatch(/\/\/# debugId=431b98e2-c997-4975-a3d9-2987710abd44/);

      // Test that the debugId is added to the source map and matches the annotation.
      const debugId = '431b98e2-c997-4975-a3d9-2987710abd44';
      expect(artifacts[0].source).toContain(debugId);

      const mapArtifact = artifacts.find(({ filename }) =>
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

      const filenames = artifacts.map(({ filename }) => filename);

      expect(filenames).toEqual([
        expect.stringMatching(/_expo\/static\/js\/ios\/index-[\w\d]+\.hbc/),
        expect.stringMatching(/_expo\/static\/js\/ios\/index-[\w\d]+\.hbc\.map/),
      ]);

      // Ensure no directive to include them is added.
      expect(artifacts[0].source).toMatch(
        /\/\/# sourceMappingURL=https:\/\/localhost:8081\/_expo\/static\/js\/ios\/index-[\w\d]{32}\.hbc\.map/
      );
      // Debug ID annotation is included at the end.
      expect(artifacts[0].source).toMatch(/\/\/# debugId=431b98e2-c997-4975-a3d9-2987710abd44/);

      // Test that the debugId is added to the source map and matches the annotation.
      const debugId = '431b98e2-c997-4975-a3d9-2987710abd44';
      expect(artifacts[0].source).toContain(debugId);

      const mapArtifact = artifacts.find(({ filename }) =>
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

      const filenames = artifacts.map(({ filename }) => filename);

      expect(filenames).toEqual([
        expect.stringMatching(/_expo\/static\/js\/web\/index-[\w\d]+\.js/),
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
      expect(artifacts.map(({ filename }) => filename)).toEqual([
        expect.stringMatching(/_expo\/static\/js\/web\/index-[\w\d]+\.js/),
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
      expect(artifacts.map(({ filename }) => filename)).toEqual([
        expect.stringMatching(/_expo\/static\/js\/ios\/index-[\w\d]+\.hbc/),
        expect.stringMatching(/_expo\/static\/js\/ios\/index-[\w\d]+\.hbc\.map/),
      ]);

      // Ensure the annotation is included and uses the .hbc.map. We make this modification as
      // a string before passing to Hermes.
      expect(artifacts[0].source).toMatch(
        /\/\/# sourceMappingURL=https:\/\/localhost:8081\/_expo\/static\/js\/ios\/index-[\w\d]+\.hbc\.map/
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
      expect(artifacts.map(({ filename }) => filename)).toEqual([
        expect.stringMatching(/_expo\/static\/js\/ios\/index-[\w\d]+\.js/),
        expect.stringMatching(/_expo\/static\/js\/ios\/index-[\w\d]+\.js\.map/),
      ]);

      // Ensure the source uses the relative base URL in production to fetch maps from a non-standard hosting location.
      expect(artifacts[0].source).toMatch(
        /\/\/# sourceMappingURL=https:\/\/localhost:8081\/subdomain\/_expo\/static\/js\/ios\/index-[\w\d]+\.js\.map/
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
      expect(artifacts.map(({ filename }) => filename)).toEqual([
        expect.stringMatching(/_expo\/static\/js\/web\/index-[\w\d]+\.js/),
        expect.stringMatching(/_expo\/static\/js\/web\/index-[\w\d]+\.js\.map/),
      ]);

      // Ensure the source uses the relative base URL in production to fetch maps from a non-standard hosting location.
      expect(artifacts[0].source).toMatch(
        /\/\/# sourceMappingURL=\/_expo\/static\/js\/web\/index-[\w\d]+\.js\.map/
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
      expect(artifacts.map(({ filename }) => filename)).toEqual([
        expect.stringMatching(/_expo\/static\/js\/web\/index-[\w\d]+\.js/),
        expect.stringMatching(/_expo\/static\/js\/web\/index-[\w\d]+\.js\.map/),
      ]);

      // Ensure the source uses the relative base URL in production to fetch maps from a non-standard hosting location.
      expect(artifacts[0].source).toMatch(
        /\/\/# sourceMappingURL=\/subdomain\/_expo\/static\/js\/web\/index-[\w\d]+\.js\.map/
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
      expect(artifacts.map(({ filename }) => filename)).toEqual([
        expect.stringMatching(/_expo\/static\/js\/ios\/index-[\w\d]+\.js/),
        expect.stringMatching(/_expo\/static\/js\/ios\/index-[\w\d]+\.js\.map/),
      ]);

      // Ensure the source uses the absolute base URL in production to fetch maps from a non-standard hosting location.
      expect(artifacts[0].source).toMatch(
        /\/\/# sourceMappingURL=https:\/\/evanbacon\.dev\/_expo\/static\/js\/ios\/index-[\w\d]+\.js\.map/
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
      expect(artifacts.map(({ filename }) => filename)).toEqual([
        expect.stringMatching(/_expo\/static\/js\/web\/index-[\w\d]+\.js/),
        expect.stringMatching(/_expo\/static\/js\/web\/index-[\w\d]+\.js\.map/),
      ]);

      // Ensure the source uses the absolute base URL in production to fetch maps from a non-standard hosting location.
      expect(artifacts[0].source).toMatch(
        /\/\/# sourceMappingURL=https:\/\/evanbacon\.dev\/_expo\/static\/js\/web\/index-[\w\d]+\.js\.map/
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

      expect(artifacts.map(({ filename }) => filename)).toEqual([
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

    expect((await serializer(...microBundle({ fs }))).code).toMatchInlineSnapshot(`
      "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, dependencyMap) {
        var foo = _$$_REQUIRE(dependencyMap[0], "./foo").foo;
        console.log(foo);
      },"/app/index.js",["/app/foo.js"],"index.js");
      __d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, dependencyMap) {
        Object.defineProperty(exports, '__esModule', {
          value: true
        });
        const foo = 'foo';
        exports.foo = foo;
      },"/app/foo.js",[],"foo.js");
      TEST_RUN_MODULE("/app/index.js");"
    `);
  });

  it(`bundles basic development native using string output`, async () => {
    const str = await serializeTo({
      options: {
        dev: true,
        hot: true,
        platform: 'ios',
        hermes: false,
        sourceMaps: false,
      },
    });
    expect(typeof str).toBe('string');
    // Ensure the module is run.
    expect(str).toMatch(/TEST_RUN_MODULE\("\/app\/index\.js"\);/);
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
    expect(bundle.code).toMatch(/TEST_RUN_MODULE\("\/app\/index\.js"\);/);
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
    expect(bundle.code).toMatch(/TEST_RUN_MODULE\("\/app\/index\.js"\);/);
    expect(bundle.code).toMatch(/expo-mock\/async-require/);
    expect(bundle.map).toMatch(/debugId/);
  });

  // Serialize to a split bundle
  async function serializeSplitAsync(
    fs: Record<string, string>,
    options: { isReactServer?: boolean; treeshake?: boolean } = {}
  ) {
    return await serializeTo({
      fs,
      options: { platform: 'web', dev: false, output: 'static', splitChunks: true, ...options },
    });
  }
  // Serialize to a split bundle
  async function serializeShakingAsync(
    fs: Record<string, string>,
    options: { isReactServer?: boolean; treeshake?: boolean; splitChunks?: boolean } = {}
  ) {
    return await serializeToWithGraph(
      {
        fs,
        options: {
          platform: 'web',
          dev: false,
          output: 'static',
          treeshake: true,
          splitChunks: true,
          ...options,
        },
      },
      [
        sideEffectsSerializerPlugin,
        treeShakeSerializerPlugin({}),
        createPostTreeShakeTransformSerializerPlugin({}),
      ]
    );
  }

  it(`bundle splits a weak import`, async () => {
    const artifacts = await serializeSplitAsync({
      'index.js': `
          require.resolveWeak('./foo')
        `,
      'foo.js': `
          export const foo = 'foo';
        `,
    });

    expect(artifacts.map((art) => art.filename)).toMatchInlineSnapshot(`
      [
        "_expo/static/js/web/index-f691569b43bf60b98587650a8aef72d2.js",
        "_expo/static/js/web/foo-c054379d08b2cfa157d6fc1caa8f4802.js",
      ]
    `);

    expect(artifacts).toMatchInlineSnapshot(`
      [
        {
          "filename": "_expo/static/js/web/index-f691569b43bf60b98587650a8aef72d2.js",
          "metadata": {
            "isAsync": false,
            "modulePaths": [
              "/app/index.js",
            ],
            "paths": {
              "/app/index.js": {
                "/app/foo.js": "/_expo/static/js/web/foo-c054379d08b2cfa157d6fc1caa8f4802.js",
              },
            },
            "reactClientReferences": [],
            "requires": [],
          },
          "originFilename": "index.js",
          "source": "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, dependencyMap) {
        dependencyMap[0];
      },"/app/index.js",{"0":"/app/foo.js","paths":{"/app/foo.js":"/_expo/static/js/web/foo-c054379d08b2cfa157d6fc1caa8f4802.js"}});
      TEST_RUN_MODULE("/app/index.js");",
          "type": "js",
        },
        {
          "filename": "_expo/static/js/web/foo-c054379d08b2cfa157d6fc1caa8f4802.js",
          "metadata": {
            "isAsync": true,
            "modulePaths": [
              "/app/foo.js",
            ],
            "paths": {},
            "reactClientReferences": [],
            "requires": [],
          },
          "originFilename": "foo.js",
          "source": "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, dependencyMap) {
        Object.defineProperty(exports, '__esModule', {
          value: true
        });
        const foo = 'foo';
        exports.foo = foo;
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
      reactClientReferences: [],
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

    expect(artifacts.map((art) => art.filename)).toMatchInlineSnapshot(`
      [
        "_expo/static/js/web/index-f0606e9a7a39437c8958b4d8e3e9ff34.js",
        "_expo/static/js/web/foo-c054379d08b2cfa157d6fc1caa8f4802.js",
      ]
    `);

    expect(artifacts).toMatchInlineSnapshot(`
      [
        {
          "filename": "_expo/static/js/web/index-f0606e9a7a39437c8958b4d8e3e9ff34.js",
          "metadata": {
            "isAsync": false,
            "modulePaths": [
              "/app/index.js",
            ],
            "paths": {
              "/app/index.js": {
                "/app/foo.js": "/_expo/static/js/web/foo-c054379d08b2cfa157d6fc1caa8f4802.js",
              },
            },
            "reactClientReferences": [],
            "requires": [],
          },
          "originFilename": "index.js",
          "source": "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, dependencyMap) {
        _$$_REQUIRE(dependencyMap[1], "expo-mock/async-require")(dependencyMap[0], dependencyMap.paths, "./foo");
      },"/app/index.js",{"0":"/app/foo.js","1":"/app/node_modules/expo-mock/async-require/index.js","paths":{"/app/foo.js":"/_expo/static/js/web/foo-c054379d08b2cfa157d6fc1caa8f4802.js"}});
      TEST_RUN_MODULE("/app/index.js");",
          "type": "js",
        },
        {
          "filename": "_expo/static/js/web/foo-c054379d08b2cfa157d6fc1caa8f4802.js",
          "metadata": {
            "isAsync": true,
            "modulePaths": [
              "/app/foo.js",
            ],
            "paths": {},
            "reactClientReferences": [],
            "requires": [],
          },
          "originFilename": "foo.js",
          "source": "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, dependencyMap) {
        Object.defineProperty(exports, '__esModule', {
          value: true
        });
        const foo = 'foo';
        exports.foo = foo;
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
      reactClientReferences: [],
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

    expect(artifacts.map((art) => art.filename)).toEqual([
      '_expo/static/js/web/index-7dc6e73b19cad01f360b7d820c351f6c.js',
      '_expo/static/js/web/index-c054379d08b2cfa157d6fc1caa8f4802.js',
      '_expo/static/js/web/[foo]-8da94e949dff8f4bf13e6e6c77d68d3f.js',
      '_expo/static/js/web/{foo}-8da94e949dff8f4bf13e6e6c77d68d3f.js',
      '_expo/static/js/web/+foo-8da94e949dff8f4bf13e6e6c77d68d3f.js',
    ]);

    // Split bundle
    expect(artifacts.length).toBe(5);
    expect(artifacts[1].metadata).toEqual({
      isAsync: true,
      modulePaths: ['/app/(foo)/index.js'],
      requires: [],
      paths: {},
      reactClientReferences: [],
    });
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

    expect(artifacts.map((art) => art.filename)).toMatchInlineSnapshot(`
      [
        "_expo/static/js/web/index-b0f278bb5fc494c16eecc93bd05c55c6.js",
        "_expo/static/js/web/foo-c054379d08b2cfa157d6fc1caa8f4802.js",
      ]
    `);

    expect(artifacts).toMatchInlineSnapshot(`
      [
        {
          "filename": "_expo/static/js/web/index-b0f278bb5fc494c16eecc93bd05c55c6.js",
          "metadata": {
            "isAsync": false,
            "modulePaths": [
              "/app/index.js",
              "/app/two.js",
            ],
            "paths": {
              "/app/two.js": {
                "/app/foo.js": "/_expo/static/js/web/foo-c054379d08b2cfa157d6fc1caa8f4802.js",
              },
            },
            "reactClientReferences": [],
            "requires": [],
          },
          "originFilename": "index.js",
          "source": "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, dependencyMap) {
        _$$_REQUIRE(dependencyMap[0], "./two");
      },"/app/index.js",["/app/two.js"]);
      __d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, dependencyMap) {
        _$$_REQUIRE(dependencyMap[1], "expo-mock/async-require")(dependencyMap[0], dependencyMap.paths, "./foo");
      },"/app/two.js",{"0":"/app/foo.js","1":"/app/node_modules/expo-mock/async-require/index.js","paths":{"/app/foo.js":"/_expo/static/js/web/foo-c054379d08b2cfa157d6fc1caa8f4802.js"}});
      TEST_RUN_MODULE("/app/index.js");",
          "type": "js",
        },
        {
          "filename": "_expo/static/js/web/foo-c054379d08b2cfa157d6fc1caa8f4802.js",
          "metadata": {
            "isAsync": true,
            "modulePaths": [
              "/app/foo.js",
            ],
            "paths": {},
            "reactClientReferences": [],
            "requires": [],
          },
          "originFilename": "foo.js",
          "source": "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, dependencyMap) {
        Object.defineProperty(exports, '__esModule', {
          value: true
        });
        const foo = 'foo';
        exports.foo = foo;
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
      reactClientReferences: [],
    });
  });

  // NOTE: This has been disabled pending a shared runtime chunk.
  it(`dedupes shared module in async imports`, async () => {
    const artifacts = await serializeSplitAsync({
      'index.js': `
          import('./math');
          import('./shapes');
        `,
      'math.js': `
        import './colors';
          export const add = 'add';
        `,
      'shapes.js': `
      import './colors';
          export const square = 'square';
        `,
      'colors.js': `
          export const orange = 'orange';
        `,
    });

    expect(artifacts.map((art) => art.filename)).toMatchInlineSnapshot(`
      [
        "_expo/static/js/web/index-bd9fb82a51c035b74188cf502f39f808.js",
        "_expo/static/js/web/math-b278c4815cd8b12f59e193dbc2a4d19b.js",
        "_expo/static/js/web/shapes-405334a7946b0b9fb76331cda92fa85a.js",
      ]
    `);

    expect(artifacts).toMatchInlineSnapshot(`
      [
        {
          "filename": "_expo/static/js/web/index-bd9fb82a51c035b74188cf502f39f808.js",
          "metadata": {
            "isAsync": false,
            "modulePaths": [
              "/app/index.js",
              "/app/colors.js",
            ],
            "paths": {
              "/app/index.js": {
                "/app/math.js": "/_expo/static/js/web/math-b278c4815cd8b12f59e193dbc2a4d19b.js",
                "/app/shapes.js": "/_expo/static/js/web/shapes-405334a7946b0b9fb76331cda92fa85a.js",
              },
            },
            "reactClientReferences": [],
            "requires": [],
          },
          "originFilename": "index.js",
          "source": "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, dependencyMap) {
        _$$_REQUIRE(dependencyMap[1], "expo-mock/async-require")(dependencyMap[0], dependencyMap.paths, "./math");
        _$$_REQUIRE(dependencyMap[1], "expo-mock/async-require")(dependencyMap[2], dependencyMap.paths, "./shapes");
      },"/app/index.js",{"0":"/app/math.js","1":"/app/node_modules/expo-mock/async-require/index.js","2":"/app/shapes.js","paths":{"/app/math.js":"/_expo/static/js/web/math-b278c4815cd8b12f59e193dbc2a4d19b.js","/app/shapes.js":"/_expo/static/js/web/shapes-405334a7946b0b9fb76331cda92fa85a.js"}});
      __d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, dependencyMap) {
        Object.defineProperty(exports, '__esModule', {
          value: true
        });
        const orange = 'orange';
        exports.orange = orange;
      },"/app/colors.js",[]);
      TEST_RUN_MODULE("/app/index.js");",
          "type": "js",
        },
        {
          "filename": "_expo/static/js/web/math-b278c4815cd8b12f59e193dbc2a4d19b.js",
          "metadata": {
            "isAsync": true,
            "modulePaths": [
              "/app/math.js",
            ],
            "paths": {},
            "reactClientReferences": [],
            "requires": [],
          },
          "originFilename": "math.js",
          "source": "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, dependencyMap) {
        Object.defineProperty(exports, '__esModule', {
          value: true
        });
        _$$_REQUIRE(dependencyMap[0], "./colors");
        const add = 'add';
        exports.add = add;
      },"/app/math.js",["/app/colors.js"]);",
          "type": "js",
        },
        {
          "filename": "_expo/static/js/web/shapes-405334a7946b0b9fb76331cda92fa85a.js",
          "metadata": {
            "isAsync": true,
            "modulePaths": [
              "/app/shapes.js",
            ],
            "paths": {},
            "reactClientReferences": [],
            "requires": [],
          },
          "originFilename": "shapes.js",
          "source": "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, dependencyMap) {
        Object.defineProperty(exports, '__esModule', {
          value: true
        });
        _$$_REQUIRE(dependencyMap[0], "./colors");
        const square = 'square';
        exports.square = square;
      },"/app/shapes.js",["/app/colors.js"]);",
          "type": "js",
        },
      ]
    `);

    // Split bundle
    expect(artifacts.length).toBe(3);
    expect(artifacts[1].metadata).toEqual({
      isAsync: true,
      modulePaths: ['/app/math.js'],
      requires: [],
      paths: {},
      reactClientReferences: [],
    });
    expect(artifacts[2].metadata).toEqual({
      isAsync: true,
      modulePaths: ['/app/shapes.js'],
      requires: [],
      paths: {},
      reactClientReferences: [],
    });

    // // The shared sync import is deduped and added to a common chunk.
    // // This will be loaded in the index.html before the other bundles.
    // expect(artifacts[3].filename).toEqual(
    //   expect.stringMatching(/_expo\/static\/js\/web\/colors-.*\.js/)
    // );
    // expect(artifacts[3].metadata).toEqual({
    //   isAsync: false,
    //   modulePaths: ['/app/colors.js'],
    //   requires: [],
    // });
    // // Ensure the dedupe chunk isn't run, just loaded.
    // expect(artifacts[3].source).not.toMatch(/TEST_RUN_MODULE/);
  });

  describe('pruning', () => {
    function getModules(graph, name: string) {
      return graph.dependencies.get(name).output[0].data.modules;
    }

    // TODO: Add more tests for striping empty modules.
    it(`removes empty import`, async () => {
      // TODO: Make a test which actually marks as a side-effect.
      const [[, , graph], artifacts] = await serializeShakingAsync({
        'index.js': `
          import './side-effect.js';
        `,
        'side-effect.js': ``,
      });

      expect(getModules(graph, '/app/index.js')).toEqual({
        exports: [],
        imports: [expect.objectContaining({ key: '/app/side-effect.js' })],
      });
      expect(artifacts[0].source).not.toMatch('side-effect');
      expect(artifacts[0].source).toMatchInlineSnapshot(`
        "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, dependencyMap) {},"/app/index.js",[]);
        TEST_RUN_MODULE("/app/index.js");"
      `);
    });

    it(`supports async import()`, async () => {
      // TODO: Add actual support for eliminating code from async imports.
      const [[, , graph], artifacts] = await serializeShakingAsync(
        {
          'index.js': `
          const promise = import('./math');
          console.log('keep', promise);
        `,
          'math.js': `
          export default function add(a, b) {
            return a + b;
          }

          export function subtract(a, b) {
            return a - b;
          }

          export const multiply = (a, b) => a * b;
        `,
        },
        {
          // Disable split chunks to ensure the async import is kept.
          splitChunks: false,
        }
      );

      expect(getModules(graph, '/app/index.js')).toEqual({
        exports: [],
        imports: [
          {
            async: true,
            key: '/app/math.js',
            source: './math',
            specifiers: [],
          },
          // TODO: Parse these imports
        ],
      });
      expect(artifacts[0].source).toMatch('add');
      expect(artifacts[0].source).toMatch('subtract');
      // expect(artifacts[0].source).not.toMatch('subtract');
    });

    it(`barrel default as`, async () => {
      const [[, , graph], artifacts] = await serializeShakingAsync({
        'index.js': `
          import { add } from './barrel';
          console.log('keep', add(1, 2));
        `,
        'barrel.js': `export { default as add } from './math';`,
        'math.js': `
          export default function add(a, b) {
            return a + b;
          }

          export function subtract(a, b) {
            return a - b;
          }

          export const multiply = (a, b) => a * b;
        `,
      });

      expect(getModules(graph, '/app/index.js')).toEqual({
        exports: [],
        imports: [expect.objectContaining({ key: '/app/barrel.js' })],
      });
      expect(getModules(graph, '/app/barrel.js')).toEqual({
        exports: [],
        imports: [expect.objectContaining({ key: '/app/math.js' })],
      });
      expect(artifacts[0].source).not.toMatch('subtract');
    });

    describe('metro require', () => {
      xit(`uses require.context`, async () => {
        const [[, , graph], artifacts] = await serializeShakingAsync({
          'index.js': `
          const foo = require.context('./foo', false, /\.js$/);
          console.log('keep', foo);
        `,
          'foo/math.js': `
          module.exports.add = function add(a, b) {
            return subtract(a, b);
          }

          module.exports.subtract = function subtract(a, b) {
            return a - b;
          }
        `,
        });

        expect(getModules(graph, '/app/index.js')).toEqual({
          exports: [],
          imports: [expect.objectContaining({ key: '/app/math.js' })],
        });
        expect(artifacts[0].source).toMatch('subtract');
      });
      it(`require.resolveWeak`, async () => {
        // Basically just bundle splitting...
        const [[, , graph], artifacts] = await serializeShakingAsync({
          'index.js': `
          const Math = require.resolveWeak('./math');
          console.log('keep', Math.add(1, 2));
        `,
          'math.js': `
          module.exports.add = function add(a, b) {
            return subtract(a, b);
          }

          module.exports.subtract = function subtract(a, b) {
            return a - b;
          }
        `,
        });

        expect(getModules(graph, '/app/index.js')).toEqual({
          exports: [],
          imports: [],
        });
        expect(artifacts[0].source).not.toMatch('subtract');
      });

      // TODO: require.resolveWeak
      // TODO: Async import()
    });

    describe('cjs', () => {
      it(`import from module.exports`, async () => {
        const [[, , graph], artifacts] = await serializeShakingAsync({
          'index.js': `
          import { add } from './math';
          console.log('add', add(1, 2));
        `,
          'math.js': `
          module.exports.add = function add(a, b) {
            return subtract(a, b);
          }

          module.exports.subtract = function subtract(a, b) {
            return a - b;
          }
        `,
        });

        expect(getModules(graph, '/app/index.js')).toEqual({
          exports: [],
          imports: [expect.objectContaining({ key: '/app/math.js' })],
        });
        expect(artifacts[0].source).toMatch('subtract');
      });

      it(`requires all from module.exports`, async () => {
        const [[, , graph], artifacts] = await serializeShakingAsync({
          'index.js': `
          const Math = require('./math');
          console.log('keep', Math.add(1, 2));
        `,
          'math.js': `
          module.exports.add = function add(a, b) {
            return subtract(a, b);
          }

          module.exports.subtract = function subtract(a, b) {
            return a - b;
          }
        `,
        });

        expect(getModules(graph, '/app/index.js')).toEqual({
          exports: [],
          imports: [expect.objectContaining({ key: '/app/math.js' })],
        });
        expect(artifacts[0].source).toMatch('subtract');
      });
      it(`requires some from module.exports`, async () => {
        const [[, , graph], artifacts] = await serializeShakingAsync({
          'index.js': `
          const { add } = require('./math');
          console.log('keep', add(1, 2));
        `,
          'math.js': `
          module.exports.add = function add(a, b) {
            return subtract(a, b);
          }

          module.exports.subtract = function subtract(a, b) {
            return a - b;
          }
        `,
        });

        expect(getModules(graph, '/app/index.js')).toEqual({
          exports: [],
          imports: [expect.objectContaining({ key: '/app/math.js' })],
        });
        expect(artifacts[0].source).toMatch('subtract');
      });
      it(`requires some from exports`, async () => {
        const [[, , graph], artifacts] = await serializeShakingAsync({
          'index.js': `
          const { add } = require('./math');
          console.log('keep', add(1, 2));
        `,
          'math.js': `
          export function add(a, b) {
            return subtract(a, b);
          }

          export function subtract(a, b) {
            return a - b;
          }
        `,
        });

        expect(getModules(graph, '/app/index.js')).toEqual({
          exports: [],
          imports: [
            {
              cjs: true,
              key: '/app/math.js',
              source: './math',
              specifiers: [],
            },
          ],
        });
        expect(artifacts[0].source).toMatch('subtract');
        expect(artifacts[0].source).toMatch('_$$_REQUIRE(dependencyMap[0], "./math");');

        expect(artifacts[0].source).toMatchInlineSnapshot(`
          "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, dependencyMap) {
            const {
              add
            } = _$$_REQUIRE(dependencyMap[0], "./math");
            console.log('keep', add(1, 2));
          },"/app/index.js",["/app/math.js"]);
          __d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, dependencyMap) {
            Object.defineProperty(exports, '__esModule', {
              value: true
            });
            function add(a, b) {
              return subtract(a, b);
            }
            function subtract(a, b) {
              return a - b;
            }
            exports.add = add;
            exports.subtract = subtract;
          },"/app/math.js",[]);
          TEST_RUN_MODULE("/app/index.js");"
        `);
      });
    });

    // TODO: Test a JSON, asset, and script-type module from the transformer since they have different handling.
    describe('sanity', () => {
      // These tests do not optimize the graph but they ensure that tree shaking doesn't break anything.

      it(`makes the same bundle with tree shaking disabled`, async () => {
        // Compare the bundle across two runs with and without tree shaking.
        const fs = {
          'index.js': `
          import { add } from './math';
          console.log('keep', add(1, 2));
        `,
          'math.js': `
          export function add(a, b) {
            return a + b;
          }`,
        } as const;
        const [, artifacts] = await serializeShakingAsync(fs);
        const [, artifacts2] = await serializeShakingAsync(fs, { treeshake: false });
        expect(artifacts[0].source).toMatch(artifacts2[0].source);
      });

      it(`using unreferenced import inside other module`, async () => {
        // Event though subtract is not imported inside any other module it is still
        // used inside of the math module, therefore it cannot be pruned.
        const [[, , graph], artifacts] = await serializeShakingAsync({
          'index.js': `
          import { add } from './math';
          console.log('keep', add(1, 2));
        `,
          'math.js': `
          export function add(a, b) {
            return subtract(a, b);
          }

          export function subtract(a, b) {
            return a - b;
          }
        `,
        });

        expect(getModules(graph, '/app/index.js')).toEqual({
          exports: [],
          imports: [expect.objectContaining({ key: '/app/math.js' })],
        });
        expect(artifacts[0].source).toMatch('subtract');
      });
    });

    describe('Possible optimizations', () => {
      // TODO: Broken
      it(`require module`, async () => {
        const [[, , graph], artifacts] = await serializeShakingAsync({
          'index.js': `
            const { add } = require('./math');
            console.log('keep', add(1, 2));
          `,
          'math.js': `
            export function add(a, b) {
              return a + b;
            }
  
            export function subtract(a, b) {
              return a - b;
            }
          `,
        });

        expect(getModules(graph, '/app/index.js')).toEqual({
          exports: [],
          imports: [expect.objectContaining({ key: '/app/math.js' })],
        });
        expect(artifacts[0].source).toMatch('subtract');
      });

      it(`double barrel`, async () => {
        const [[, , graph], artifacts] = await serializeShakingAsync({
          'index.js': `
            import { add } from './barrel';
            console.log('keep', add(1, 2));
          `,
          'barrel.js': `export { add, subtract } from './barrel2';`,
          'barrel2.js': `export { add, subtract } from './math';`,
          'math.js': `
            export function add(a, b) {
              return a + b;
            }
  
            export function subtract(a, b) {
              return a - b;
            }
          `,
        });

        expect(getModules(graph, '/app/index.js')).toEqual({
          exports: [],
          imports: [expect.objectContaining({ key: '/app/barrel.js' })],
        });
        expect(getModules(graph, '/app/barrel.js')).toEqual({
          exports: [],
          imports: [expect.objectContaining({ key: '/app/barrel2.js' })],
        });
        expect(getModules(graph, '/app/barrel2.js')).toEqual({
          exports: [],
          imports: [expect.objectContaining({ key: '/app/math.js' })],
        });
        expect(artifacts[0].source).toMatch('subtract');
      });

      it(`barrel multiple`, async () => {
        const [[, , graph], artifacts] = await serializeShakingAsync({
          'index.js': `
            import { add } from './barrel';
            console.log('keep', add(1, 2));
          `,
          'barrel.js': `export { add, subtract } from './math';`,
          'math.js': `
            export function add(a, b) {
              return a + b;
            }
  
            export function subtract(a, b) {
              return a - b;
            }
          `,
        });

        expect(getModules(graph, '/app/index.js')).toEqual({
          exports: [],
          imports: [expect.objectContaining({ key: '/app/barrel.js' })],
        });
        expect(getModules(graph, '/app/barrel.js')).toEqual({
          exports: [],
          imports: [expect.objectContaining({ key: '/app/math.js' })],
        });
        expect(artifacts[0].source).toMatch('subtract');
      });

      it(`barrel getters`, async () => {
        const [[, , graph], artifacts] = await serializeShakingAsync({
          'index.js': `
          import { add } from './barrel';
          console.log('keep', add(1, 2));
        `,
          'barrel.js': `
          module.exports = {
            get add() {
              return require('./math').add;
            },
          };
        `,
          'math.js': `
          export default function add(a, b) {
            return a + b;
          }

          export function subtract(a, b) {
            return a - b;
          }

          export const multiply = (a, b) => a * b;
        `,
        });

        expect(getModules(graph, '/app/index.js')).toEqual({
          exports: [],
          imports: [expect.objectContaining({ key: '/app/barrel.js' })],
        });
        expect(getModules(graph, '/app/barrel.js')).toEqual({
          exports: [],
          imports: [expect.objectContaining({ key: '/app/math.js' })],
        });
        expect(artifacts[0].source).toMatch('subtract');
      });
      // TODO: Maybe extrapolate the star export for more shaking.
      it(`barrel star cannot shake`, async () => {
        const [[, , graph], artifacts] = await serializeShakingAsync({
          'index.js': `
          import { add } from './barrel';
          console.log('keep', add(1, 2));
        `,
          'barrel.js': `export * from './math';`,
          'math.js': `
          export function add(a, b) {
            return a + b;
          }

          export function subtract(a, b) {
            return a - b;
          }
        `,
        });

        expect(getModules(graph, '/app/index.js')).toEqual({
          exports: [],
          imports: [expect.objectContaining({ key: '/app/barrel.js' })],
        });
        expect(getModules(graph, '/app/barrel.js')).toEqual({
          exports: [],
          imports: [expect.objectContaining({ key: '/app/math.js' })],
        });
        expect(artifacts[0].source).toMatch('subtract');
      });
    });

    it(`import as`, async () => {
      const [[, , graph], artifacts] = await serializeShakingAsync({
        'index.js': `
          import { add as other } from './math';
          console.log('keep', add(1, 2));
        `,
        'math.js': `
          export function add(a, b) {
            return a + b;
          }

          export function subtract(a, b) {
            return a - b;
          }
        `,
      });

      expect(getModules(graph, '/app/index.js')).toEqual({
        exports: [],
        imports: [expect.objectContaining({ key: '/app/math.js' })],
      });
      expect(artifacts[0].source).not.toMatch('subtract');
    });

    it(`import star`, async () => {
      const [[, , graph], artifacts] = await serializeShakingAsync({
        'index.js': `
          import * as Math from './math';
          console.log('keep', Math.add(1, 2));
        `,
        'math.js': `
          export function add(a, b) {
            return a + b;
          }

          export function subtract(a, b) {
            return a - b;
          }
        `,
      });

      expect(getModules(graph, '/app/index.js')).toEqual({
        exports: [],
        imports: [expect.objectContaining({ key: '/app/math.js' })],
      });
      expect(artifacts[0].source).toMatch('subtract');
    });

    it(`barrel partial`, async () => {
      const [[, , graph], artifacts] = await serializeShakingAsync({
        'index.js': `
          import { add } from './barrel';
          console.log('keep', add(1, 2));
        `,
        'barrel.js': `export { add } from './math';`,
        'math.js': `
          export function add(a, b) {
            return a + b;
          }

          export function subtract(a, b) {
            return a - b;
          }
        `,
      });

      expect(getModules(graph, '/app/index.js')).toEqual({
        exports: [],
        imports: [expect.objectContaining({ key: '/app/barrel.js' })],
      });
      expect(getModules(graph, '/app/barrel.js')).toEqual({
        exports: [],
        imports: [expect.objectContaining({ key: '/app/math.js' })],
      });
      expect(artifacts[0].source).not.toMatch('subtract');
    });

    it(`removes unused exports`, async () => {
      const [[, , graph], artifacts] = await serializeShakingAsync({
        'index.js': `
          import { add } from './math';
          console.log('keep', add(1, 2));
        `,
        'math.js': `
          export function add(a, b) {
            return a + b;
          }

          export function subtract(a, b) {
            return a - b;
          }
        `,
      });

      expect(getModules(graph, '/app/index.js')).toEqual({
        exports: [],
        imports: [expect.objectContaining({ key: '/app/math.js' })],
      });
      // expect(graph.dependencies.get('/app/math.js').output[0].data.modules).toEqual({
      //   exports: [expect.objectContaining({ key: '/app/math.js' })],
      //   imports: [],
      // });
      // console.log(graph.dependencies.get('/app/index.js').output[0].data.modules);
      // console.log(graph.dependencies.get('/app/math.js').output[0].data.modules);

      expect(artifacts[0].source).not.toMatch('subtract');

      expect(artifacts).toMatchInlineSnapshot(`
        [
          {
            "filename": "_expo/static/js/web/index-424956f49a5d396da7b712264eead3f9.js",
            "metadata": {
              "isAsync": false,
              "modulePaths": [
                "/app/index.js",
                "/app/math.js",
              ],
              "paths": {},
              "reactClientReferences": [],
              "requires": [],
            },
            "originFilename": "index.js",
            "source": "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, dependencyMap) {
          var add = _$$_REQUIRE(dependencyMap[0], "./math").add;
          console.log('keep', add(1, 2));
        },"/app/index.js",["/app/math.js"]);
        __d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, dependencyMap) {
          Object.defineProperty(exports, '__esModule', {
            value: true
          });
          function add(a, b) {
            return a + b;
          }
          exports.add = add;
        },"/app/math.js",[]);
        TEST_RUN_MODULE("/app/index.js");",
            "type": "js",
          },
        ]
      `);
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

      expect(artifacts.map((art) => art.filename)).toEqual([
        '_expo/static/js/web/index-052296ff29736d0de884b8998010f6a0.js',
      ]);

      // Split bundle
      expect(artifacts.length).toBe(1);
      expect(artifacts[0].metadata).toEqual({
        isAsync: false,
        modulePaths: ['/app/index.js', '/app/other.js'],
        paths: {},
        reactClientReferences: ['file:///app/other.js'],
        requires: [],
      });

      expect(artifacts[0].source).toMatchInlineSnapshot(`
        "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, dependencyMap) {
          _$$_REQUIRE(dependencyMap[0], "./other.js");
        },"/app/index.js",["/app/other.js"]);
        __d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, dependencyMap) {
          Object.defineProperty(exports, '__esModule', {
            value: true
          });
          const proxy = _$$_REQUIRE(dependencyMap[0], "react-server-dom-webpack/server").createClientModuleProxy("file:///app/other.js");
          module.exports = proxy;
          const foo = proxy["foo"];
          exports.foo = foo;
        },"/app/other.js",["/app/node_modules/react-server-dom-webpack/server/index.js"]);
        TEST_RUN_MODULE("/app/index.js");"
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
        modulePaths: ['/app/index.js', '/app/other.js', '/app/second.js'],
        paths: {},
        reactClientReferences: ['file:///app/other.js', 'file:///app/second.js'],
        requires: [],
      });
    });
  });
});
