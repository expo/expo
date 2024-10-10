import { microBundle, projectRoot } from '../fork/__tests__/mini-metro';
import { serializeSplitAsync, serializeTo } from '../fork/__tests__/serializer-test-utils';
import {
  SerialAsset,
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
      expect((await serializer(...(await microBundle({ fs })))).code).toMatchInlineSnapshot(`
              "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
                let _module = {};
                let _require = {};
                let _global = {};
                let _exports = {};
              },"/app/index.js",[],"index.js");
              TEST_RUN_MODULE("/app/index.js");"
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
        expect(artifacts.code).toMatch(/\/\/# debugId=d582bbf1-5fdf-4ce7-afea-e784a502f5bc/);

        // Test that the debugId is added to the source map and matches the annotation.
        const debugId = 'd582bbf1-5fdf-4ce7-afea-e784a502f5bc';
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
      expect(artifacts[0].source).toMatch(/\/\/# debugId=295379f8-3d45-4ee7-8da9-c63d70ba75f3/);

      // Test that the debugId is added to the source map and matches the annotation.
      const debugId = '295379f8-3d45-4ee7-8da9-c63d70ba75f3';
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
      expect(artifacts[0].source).toMatch(/\/\/# debugId=295379f8-3d45-4ee7-8da9-c63d70ba75f3/);

      // Test that the debugId is added to the source map and matches the annotation.
      const debugId = '295379f8-3d45-4ee7-8da9-c63d70ba75f3';
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

    expect((await serializer(...(await microBundle({ fs })))).code).toMatchInlineSnapshot(`
      "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
        "use strict";

        var foo = _$$_REQUIRE(_dependencyMap[0], "./foo").foo;
        console.log(foo);
      },"/app/index.js",["/app/foo.js"],"index.js");
      __d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
        "use strict";

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
        "_expo/static/js/web/index-0b3b05dfd72525874c3b666ed3231144.js",
        "_expo/static/js/web/foo-aac9e47d61669a7fb7a95ea6aeb91d64.js",
      ]
    `);

    expect(artifacts).toMatchInlineSnapshot(`
      [
        {
          "filename": "_expo/static/js/web/index-0b3b05dfd72525874c3b666ed3231144.js",
          "metadata": {
            "expoDomComponentReferences": [],
            "isAsync": false,
            "modulePaths": [
              "/app/index.js",
            ],
            "paths": {
              "/app/index.js": {
                "/app/foo.js": "/_expo/static/js/web/foo-aac9e47d61669a7fb7a95ea6aeb91d64.js",
              },
            },
            "reactClientReferences": [],
            "reactServerReferences": [],
            "requires": [],
          },
          "originFilename": "index.js",
          "source": "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
        _dependencyMap[0];
      },"/app/index.js",{"0":"/app/foo.js","paths":{"/app/foo.js":"/_expo/static/js/web/foo-aac9e47d61669a7fb7a95ea6aeb91d64.js"}});
      TEST_RUN_MODULE("/app/index.js");",
          "type": "js",
        },
        {
          "filename": "_expo/static/js/web/foo-aac9e47d61669a7fb7a95ea6aeb91d64.js",
          "metadata": {
            "expoDomComponentReferences": [],
            "isAsync": true,
            "modulePaths": [
              "/app/foo.js",
            ],
            "paths": {},
            "reactClientReferences": [],
            "reactServerReferences": [],
            "requires": [],
          },
          "originFilename": "foo.js",
          "source": "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
        "use strict";

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
      expoDomComponentReferences: [],
      reactClientReferences: [],
      reactServerReferences: [],
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
        "_expo/static/js/web/index-8cc83f2e616cdd8e531ae27d9127c263.js",
        "_expo/static/js/web/foo-aac9e47d61669a7fb7a95ea6aeb91d64.js",
      ]
    `);

    expect(artifacts).toMatchInlineSnapshot(`
      [
        {
          "filename": "_expo/static/js/web/index-8cc83f2e616cdd8e531ae27d9127c263.js",
          "metadata": {
            "expoDomComponentReferences": [],
            "isAsync": false,
            "modulePaths": [
              "/app/index.js",
              "/app/expo-mock/async-require",
            ],
            "paths": {
              "/app/index.js": {
                "/app/foo.js": "/_expo/static/js/web/foo-aac9e47d61669a7fb7a95ea6aeb91d64.js",
              },
            },
            "reactClientReferences": [],
            "reactServerReferences": [],
            "requires": [],
          },
          "originFilename": "index.js",
          "source": "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
        _$$_REQUIRE(_dependencyMap[1])(_dependencyMap[0], _dependencyMap.paths);
      },"/app/index.js",{"0":"/app/foo.js","1":"/app/expo-mock/async-require","paths":{"/app/foo.js":"/_expo/static/js/web/foo-aac9e47d61669a7fb7a95ea6aeb91d64.js"}});
      __d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
        module.exports = () => 'MOCK';
      },"/app/expo-mock/async-require",[]);
      TEST_RUN_MODULE("/app/index.js");",
          "type": "js",
        },
        {
          "filename": "_expo/static/js/web/foo-aac9e47d61669a7fb7a95ea6aeb91d64.js",
          "metadata": {
            "expoDomComponentReferences": [],
            "isAsync": true,
            "modulePaths": [
              "/app/foo.js",
            ],
            "paths": {},
            "reactClientReferences": [],
            "reactServerReferences": [],
            "requires": [],
          },
          "originFilename": "foo.js",
          "source": "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
        "use strict";

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
      expoDomComponentReferences: [],
      reactClientReferences: [],
      reactServerReferences: [],
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
      '_expo/static/js/web/index-95c9198c40034f849b6c9f8b62d0bd22.js',
      '_expo/static/js/web/index-7a32f921c2f0758792cf0bf8ddd33c77.js',
      '_expo/static/js/web/[foo]-b99e2a64404cca4d65e32984620b7bf1.js',
      '_expo/static/js/web/{foo}-d032e4cf31d79b9563f18fce5c4d4da8.js',
      '_expo/static/js/web/+foo-2b47c1ed90cec08c1514324d9ade788c.js',
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
        "_expo/static/js/web/index-2f681759ccdffed0c24df6bd62adc744.js",
        "_expo/static/js/web/foo-aac9e47d61669a7fb7a95ea6aeb91d64.js",
      ]
    `);

    expect(artifacts).toMatchInlineSnapshot(`
      [
        {
          "filename": "_expo/static/js/web/index-2f681759ccdffed0c24df6bd62adc744.js",
          "metadata": {
            "expoDomComponentReferences": [],
            "isAsync": false,
            "modulePaths": [
              "/app/index.js",
              "/app/two.js",
              "/app/expo-mock/async-require",
            ],
            "paths": {
              "/app/two.js": {
                "/app/foo.js": "/_expo/static/js/web/foo-aac9e47d61669a7fb7a95ea6aeb91d64.js",
              },
            },
            "reactClientReferences": [],
            "reactServerReferences": [],
            "requires": [],
          },
          "originFilename": "index.js",
          "source": "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
        "use strict";

        _$$_REQUIRE(_dependencyMap[0]);
      },"/app/index.js",["/app/two.js"]);
      __d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
        _$$_REQUIRE(_dependencyMap[1])(_dependencyMap[0], _dependencyMap.paths);
      },"/app/two.js",{"0":"/app/foo.js","1":"/app/expo-mock/async-require","paths":{"/app/foo.js":"/_expo/static/js/web/foo-aac9e47d61669a7fb7a95ea6aeb91d64.js"}});
      __d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
        module.exports = () => 'MOCK';
      },"/app/expo-mock/async-require",[]);
      TEST_RUN_MODULE("/app/index.js");",
          "type": "js",
        },
        {
          "filename": "_expo/static/js/web/foo-aac9e47d61669a7fb7a95ea6aeb91d64.js",
          "metadata": {
            "expoDomComponentReferences": [],
            "isAsync": true,
            "modulePaths": [
              "/app/foo.js",
            ],
            "paths": {},
            "reactClientReferences": [],
            "reactServerReferences": [],
            "requires": [],
          },
          "originFilename": "foo.js",
          "source": "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
        "use strict";

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
      expoDomComponentReferences: [],
      reactClientReferences: [],
      reactServerReferences: [],
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
        "_expo/static/js/web/index-6deb415e9765e2f7033a805e8c5f20ee.js",
        "_expo/static/js/web/math-751c65eacf161e04a1cff839cdf43b51.js",
        "_expo/static/js/web/shapes-3d697f5eb8b842d8141b9a849a473086.js",
      ]
    `);

    expect(artifacts).toMatchInlineSnapshot(`
      [
        {
          "filename": "_expo/static/js/web/index-6deb415e9765e2f7033a805e8c5f20ee.js",
          "metadata": {
            "expoDomComponentReferences": [],
            "isAsync": false,
            "modulePaths": [
              "/app/index.js",
              "/app/expo-mock/async-require",
              "/app/colors.js",
            ],
            "paths": {
              "/app/index.js": {
                "/app/math.js": "/_expo/static/js/web/math-751c65eacf161e04a1cff839cdf43b51.js",
                "/app/shapes.js": "/_expo/static/js/web/shapes-3d697f5eb8b842d8141b9a849a473086.js",
              },
            },
            "reactClientReferences": [],
            "reactServerReferences": [],
            "requires": [],
          },
          "originFilename": "index.js",
          "source": "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
        _$$_REQUIRE(_dependencyMap[1])(_dependencyMap[0], _dependencyMap.paths);
        _$$_REQUIRE(_dependencyMap[1])(_dependencyMap[2], _dependencyMap.paths);
      },"/app/index.js",{"0":"/app/math.js","1":"/app/expo-mock/async-require","2":"/app/shapes.js","paths":{"/app/math.js":"/_expo/static/js/web/math-751c65eacf161e04a1cff839cdf43b51.js","/app/shapes.js":"/_expo/static/js/web/shapes-3d697f5eb8b842d8141b9a849a473086.js"}});
      __d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
        module.exports = () => 'MOCK';
      },"/app/expo-mock/async-require",[]);
      __d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
        "use strict";

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
          "filename": "_expo/static/js/web/math-751c65eacf161e04a1cff839cdf43b51.js",
          "metadata": {
            "expoDomComponentReferences": [],
            "isAsync": true,
            "modulePaths": [
              "/app/math.js",
            ],
            "paths": {},
            "reactClientReferences": [],
            "reactServerReferences": [],
            "requires": [],
          },
          "originFilename": "math.js",
          "source": "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
        "use strict";

        Object.defineProperty(exports, '__esModule', {
          value: true
        });
        _$$_REQUIRE(_dependencyMap[0]);
        const add = 'add';
        exports.add = add;
      },"/app/math.js",["/app/colors.js"]);",
          "type": "js",
        },
        {
          "filename": "_expo/static/js/web/shapes-3d697f5eb8b842d8141b9a849a473086.js",
          "metadata": {
            "expoDomComponentReferences": [],
            "isAsync": true,
            "modulePaths": [
              "/app/shapes.js",
            ],
            "paths": {},
            "reactClientReferences": [],
            "reactServerReferences": [],
            "requires": [],
          },
          "originFilename": "shapes.js",
          "source": "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
        "use strict";

        Object.defineProperty(exports, '__esModule', {
          value: true
        });
        _$$_REQUIRE(_dependencyMap[0]);
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
      expoDomComponentReferences: [],
      reactClientReferences: [],
      reactServerReferences: [],
    });
    expect(artifacts[2].metadata).toEqual({
      isAsync: true,
      modulePaths: ['/app/shapes.js'],
      requires: [],
      paths: {},
      expoDomComponentReferences: [],
      reactClientReferences: [],
      reactServerReferences: [],
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
        '_expo/static/js/web/index-e442a5eec0eab76e713768637a386582.js',
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
        requires: [],
      });

      expect(artifacts[0].source).toMatchInlineSnapshot(`
        "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
          "use strict";

          _$$_REQUIRE(_dependencyMap[0]);
        },"/app/index.js",["/app/other.js"]);
        __d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
          "use strict";

          Object.defineProperty(exports, '__esModule', {
            value: true
          });
          const proxy = _$$_REQUIRE(_dependencyMap[0]).createClientModuleProxy("file:///app/other.js");
          module.exports = proxy;
          const foo = proxy["foo"];
          exports.foo = foo;
        },"/app/other.js",["/app/react-server-dom-webpack/server"]);
        __d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {},"/app/react-server-dom-webpack/server",[]);
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
        requires: [],
      });
    });
  });
});
