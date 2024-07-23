import assert from 'assert';

import { microBundle, projectRoot } from '../fork/__tests__/mini-metro';
import {
  SerialAsset,
  SerializerConfigOptions,
  SerializerPlugin,
  createSerializerFromSerialProcessors,
  withSerializerPlugins,
} from '../withExpoSerializers';

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
  async function serializeTo(
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
    const output = (await serializer(
      ...microBundle({
        fs,
        ...options,
      })
    )) as any;
    if (options.options?.output === 'static') {
      assert('artifacts' in output && Array.isArray(output.artifacts));
      return output.artifacts as SerialAsset[];
    } else {
      return output;
    }
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
      expect(artifacts[0].source).toMatch(/\/\/# debugId=4447d9ad-77e0-47ef-916e-bd72fd1ad0aa/);

      // Test that the debugId is added to the source map and matches the annotation.
      const debugId = '4447d9ad-77e0-47ef-916e-bd72fd1ad0aa';
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
      expect(artifacts[0].source).toMatch(/\/\/# debugId=4447d9ad-77e0-47ef-916e-bd72fd1ad0aa/);

      // Test that the debugId is added to the source map and matches the annotation.
      const debugId = '4447d9ad-77e0-47ef-916e-bd72fd1ad0aa';
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
  async function serializeSplitAsync(fs: Record<string, string>) {
    return await serializeTo({
      fs,
      options: { platform: 'web', dev: false, output: 'static', splitChunks: true },
    });
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
        "_expo/static/js/web/index-478fdadb2a389d7da8a3562cc0d0a992.js",
        "_expo/static/js/web/foo-2e5e55cd3caaecc5f0307f86ea98ea1f.js",
      ]
    `);

    expect(artifacts).toMatchInlineSnapshot(`
      [
        {
          "filename": "_expo/static/js/web/index-478fdadb2a389d7da8a3562cc0d0a992.js",
          "metadata": {
            "isAsync": false,
            "modulePaths": [
              "/app/index.js",
            ],
            "requires": [],
          },
          "originFilename": "index.js",
          "source": "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, dependencyMap) {
        dependencyMap[0];
      },"/app/index.js",{"0":"/app/foo.js","paths":{"/app/foo.js":"/_expo/static/js/web/foo-2e5e55cd3caaecc5f0307f86ea98ea1f.js"}});
      TEST_RUN_MODULE("/app/index.js");",
          "type": "js",
        },
        {
          "filename": "_expo/static/js/web/foo-2e5e55cd3caaecc5f0307f86ea98ea1f.js",
          "metadata": {
            "isAsync": true,
            "modulePaths": [
              "/app/foo.js",
            ],
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
        "_expo/static/js/web/index-d4d015cad1caef433eabf84c7d7e5576.js",
        "_expo/static/js/web/foo-2e5e55cd3caaecc5f0307f86ea98ea1f.js",
      ]
    `);

    expect(artifacts).toMatchInlineSnapshot(`
      [
        {
          "filename": "_expo/static/js/web/index-d4d015cad1caef433eabf84c7d7e5576.js",
          "metadata": {
            "isAsync": false,
            "modulePaths": [
              "/app/index.js",
            ],
            "requires": [],
          },
          "originFilename": "index.js",
          "source": "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, dependencyMap) {
        _$$_REQUIRE(dependencyMap[1], "expo-mock/async-require")(dependencyMap[0], dependencyMap.paths, "./foo");
      },"/app/index.js",{"0":"/app/foo.js","1":"/app/node_modules/expo-mock/async-require/index.js","paths":{"/app/foo.js":"/_expo/static/js/web/foo-2e5e55cd3caaecc5f0307f86ea98ea1f.js"}});
      TEST_RUN_MODULE("/app/index.js");",
          "type": "js",
        },
        {
          "filename": "_expo/static/js/web/foo-2e5e55cd3caaecc5f0307f86ea98ea1f.js",
          "metadata": {
            "isAsync": true,
            "modulePaths": [
              "/app/foo.js",
            ],
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
      '_expo/static/js/web/index-04a64c0ffb487581ce228c8891ac7a28.js',
      '_expo/static/js/web/index-bf6cd3b94b02892ee3c4ef23bc7f274a.js',
      '_expo/static/js/web/[foo]-a387f30209e86a0120edb65180728fc7.js',
      '_expo/static/js/web/{foo}-a865646e59f08a27288aaf5124f76a04.js',
      '_expo/static/js/web/+foo-fc257e8635983fb79f0d70797fb6b149.js',
    ]);

    // Split bundle
    expect(artifacts.length).toBe(5);
    expect(artifacts[1].metadata).toEqual({
      isAsync: true,
      modulePaths: ['/app/(foo)/index.js'],
      requires: [],
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
        "_expo/static/js/web/index-13858a9c3af9682c1d91d27d238a0c6e.js",
        "_expo/static/js/web/foo-2e5e55cd3caaecc5f0307f86ea98ea1f.js",
      ]
    `);

    expect(artifacts).toMatchInlineSnapshot(`
      [
        {
          "filename": "_expo/static/js/web/index-13858a9c3af9682c1d91d27d238a0c6e.js",
          "metadata": {
            "isAsync": false,
            "modulePaths": [
              "/app/index.js",
              "/app/two.js",
            ],
            "requires": [],
          },
          "originFilename": "index.js",
          "source": "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, dependencyMap) {
        _$$_REQUIRE(dependencyMap[0], "./two");
      },"/app/index.js",["/app/two.js"]);
      __d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, dependencyMap) {
        _$$_REQUIRE(dependencyMap[1], "expo-mock/async-require")(dependencyMap[0], dependencyMap.paths, "./foo");
      },"/app/two.js",{"0":"/app/foo.js","1":"/app/node_modules/expo-mock/async-require/index.js","paths":{"/app/foo.js":"/_expo/static/js/web/foo-2e5e55cd3caaecc5f0307f86ea98ea1f.js"}});
      TEST_RUN_MODULE("/app/index.js");",
          "type": "js",
        },
        {
          "filename": "_expo/static/js/web/foo-2e5e55cd3caaecc5f0307f86ea98ea1f.js",
          "metadata": {
            "isAsync": true,
            "modulePaths": [
              "/app/foo.js",
            ],
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
        "_expo/static/js/web/index-d6f9a314ecdc04e1ba0449c4326c22e0.js",
        "_expo/static/js/web/math-05ed1c99ba33d99d7aff2e074b9d0a49.js",
        "_expo/static/js/web/shapes-10e09fe9385c919670df0f85f4102561.js",
      ]
    `);

    expect(artifacts).toMatchInlineSnapshot(`
      [
        {
          "filename": "_expo/static/js/web/index-d6f9a314ecdc04e1ba0449c4326c22e0.js",
          "metadata": {
            "isAsync": false,
            "modulePaths": [
              "/app/index.js",
              "/app/colors.js",
            ],
            "requires": [],
          },
          "originFilename": "index.js",
          "source": "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, dependencyMap) {
        _$$_REQUIRE(dependencyMap[1], "expo-mock/async-require")(dependencyMap[0], dependencyMap.paths, "./math");
        _$$_REQUIRE(dependencyMap[1], "expo-mock/async-require")(dependencyMap[2], dependencyMap.paths, "./shapes");
      },"/app/index.js",{"0":"/app/math.js","1":"/app/node_modules/expo-mock/async-require/index.js","2":"/app/shapes.js","paths":{"/app/math.js":"/_expo/static/js/web/math-05ed1c99ba33d99d7aff2e074b9d0a49.js","/app/shapes.js":"/_expo/static/js/web/shapes-10e09fe9385c919670df0f85f4102561.js"}});
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
          "filename": "_expo/static/js/web/math-05ed1c99ba33d99d7aff2e074b9d0a49.js",
          "metadata": {
            "isAsync": true,
            "modulePaths": [
              "/app/math.js",
            ],
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
          "filename": "_expo/static/js/web/shapes-10e09fe9385c919670df0f85f4102561.js",
          "metadata": {
            "isAsync": true,
            "modulePaths": [
              "/app/shapes.js",
            ],
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
    });
    expect(artifacts[2].metadata).toEqual({
      isAsync: true,
      modulePaths: ['/app/shapes.js'],
      requires: [],
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
});
