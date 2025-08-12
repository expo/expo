import type { Module } from '@expo/metro/metro/DeltaBundler';

import { microBundle, projectRoot } from '../fork/__tests__/mini-metro';
import {
  createJSVirtualModule,
  serializeSplitAsync,
  serializeTo,
} from '../fork/__tests__/serializer-test-utils';
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
      createModuleId: expect.any(Function),
      sourceUrl: 'https://localhost:8081/index.bundle?platform=ios&dev=true&minify=false',
    };
    // @ts-expect-error
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
      // Mimick serializer behavior where we call getModulesRunBeforeMainModule
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

    // @ts-expect-error
    await configWithSerializer.serializer.customSerializer(
      'a',
      'b',
      'c',
      configWithSerializer.serializer
    );

    // Ensure the serializer was invoked correctly
    expect(customProcessor).toHaveBeenCalledWith('a', 'b', 'c', configWithSerializer.serializer);
    expect(customSerializer).toHaveBeenCalledWith('a', 'b', 'c', configWithSerializer.serializer);
    // Ensure the serializer invoked the overriden config property
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

      const jsArtifacts = artifacts.filter((artifact) => artifact.type === 'js');
      const mapArtifacts = artifacts.filter((artifact) => artifact.type === 'map');

      jsArtifacts.forEach((artifact) => {
        expect(artifact.source.startsWith('testPreModule;')).toBeTruthy();
      });
      mapArtifacts.forEach((artifact) => {
        // Assert each map artifact has __testPreModule in sources
        const map = JSON.parse(artifact.source);
        expect(map.sources[0]).toEqual('__testPreModule');
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

      const indexJs = artifacts.find((artifact) => artifact.originFilename === 'index.js');
      const fooJs = artifacts.find((artifact) => artifact.originFilename === 'foo.js');

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
        expect.stringMatching(/_expo\/static\/js\/web\/index-(?<md5>[0-9a-fA-F]{32})\.js/),
        expect.stringMatching(/_expo\/static\/js\/web\/index-(?<md5>[0-9a-fA-F]{32})\.js\.map/),
      ]);

      // Ensure no directive to include them is added.
      expect(artifacts[0].source).toMatch(
        /\/\/# sourceMappingURL=\/_expo\/static\/js\/web\/index-(?<md5>[0-9a-fA-F]{32})\.js\.map/
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
        expect.stringMatching(/_expo\/static\/js\/ios\/index-(?<md5>[0-9a-fA-F]{32})\.hbc/),
        expect.stringMatching(/_expo\/static\/js\/ios\/index-(?<md5>[0-9a-fA-F]{32})\.hbc\.map/),
      ]);

      // Ensure no directive to include them is added.
      expect(artifacts[0].source).toMatch(
        /\/\/# sourceMappingURL=https:\/\/localhost:8081\/_expo\/static\/js\/ios\/index-(?<md5>[0-9a-fA-F]{32})\.hbc\.map/
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
      expect(artifacts.map(({ filename }) => filename)).toEqual([
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
      expect(artifacts.map(({ filename }) => filename)).toEqual([
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
      expect(artifacts.map(({ filename }) => filename)).toEqual([
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
      expect(artifacts.map(({ filename }) => filename)).toEqual([
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
      expect(artifacts.map(({ filename }) => filename)).toEqual([
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
      expect(artifacts.map(({ filename }) => filename)).toEqual([
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
      expect(artifacts.map(({ filename }) => filename)).toEqual([
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

        var _foo = _$$_REQUIRE(_dependencyMap[0], "./foo");
        console.log(_foo.foo);
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

    expect(artifacts.map((art) => art.filename)).toMatchInlineSnapshot(`
      [
        "_expo/static/js/web/index-ab51a54090935dbdd8a8f1ab4caa8eca.js",
        "_expo/static/js/web/a-5dd0b55bf95fcc6127b5e1fb0db14d8b.js",
        "_expo/static/js/web/b-5e1fcd4e30b82b5f22f834bc2d5bbb57.js",
        "_expo/static/js/web/c-d7e1c531872ed205c63163fe1919d971.js",
        "_expo/static/js/web/__common-f00c61b44236e82179327dcfbabec508.js",
        "_expo/static/js/web/__expo-metro-runtime-9766bff2257e805459e3ab4532b77d32.js",
      ]
    `);

    expect(artifacts).toMatchInlineSnapshot(`
      [
        {
          "filename": "_expo/static/js/web/index-ab51a54090935dbdd8a8f1ab4caa8eca.js",
          "metadata": {
            "expoDomComponentReferences": [],
            "isAsync": false,
            "modulePaths": [
              "/app/index.js",
              "/app/expo-mock/async-require",
            ],
            "paths": {
              "/app/index.js": {
                "/app/a.js": "/_expo/static/js/web/a-5dd0b55bf95fcc6127b5e1fb0db14d8b.js",
                "/app/b.js": "/_expo/static/js/web/b-5e1fcd4e30b82b5f22f834bc2d5bbb57.js",
                "/app/c.js": "/_expo/static/js/web/c-d7e1c531872ed205c63163fe1919d971.js",
              },
            },
            "reactClientReferences": [],
            "reactServerReferences": [],
            "requires": [
              "_expo/static/js/web/__common-f00c61b44236e82179327dcfbabec508.js",
              "_expo/static/js/web/__expo-metro-runtime-9766bff2257e805459e3ab4532b77d32.js",
            ],
          },
          "originFilename": "index.js",
          "source": "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
        _$$_REQUIRE(_dependencyMap[1])(_dependencyMap[0], _dependencyMap.paths);
        _$$_REQUIRE(_dependencyMap[1])(_dependencyMap[2], _dependencyMap.paths);
        _$$_REQUIRE(_dependencyMap[1])(_dependencyMap[3], _dependencyMap.paths);
      },"/app/index.js",{"0":"/app/a.js","1":"/app/expo-mock/async-require","2":"/app/b.js","3":"/app/c.js","paths":{"/app/a.js":"/_expo/static/js/web/a-5dd0b55bf95fcc6127b5e1fb0db14d8b.js","/app/b.js":"/_expo/static/js/web/b-5e1fcd4e30b82b5f22f834bc2d5bbb57.js","/app/c.js":"/_expo/static/js/web/c-d7e1c531872ed205c63163fe1919d971.js"}});
      __d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
        module.exports = () => 'MOCK';
      },"/app/expo-mock/async-require",[]);
      TEST_RUN_MODULE("/app/index.js");",
          "type": "js",
        },
        {
          "filename": "_expo/static/js/web/a-5dd0b55bf95fcc6127b5e1fb0db14d8b.js",
          "metadata": {
            "expoDomComponentReferences": [],
            "isAsync": true,
            "modulePaths": [
              "/app/a.js",
            ],
            "paths": {},
            "reactClientReferences": [],
            "reactServerReferences": [],
            "requires": [
              "_expo/static/js/web/__expo-metro-runtime-9766bff2257e805459e3ab4532b77d32.js",
            ],
          },
          "originFilename": "a.js",
          "source": "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
        "use strict";

        Object.defineProperty(exports, '__esModule', {
          value: true
        });
        _$$_REQUIRE(_dependencyMap[0]);
        _$$_REQUIRE(_dependencyMap[1]);
        const a = 'a';
        exports.a = a;
      },"/app/a.js",["/app/d.js","/app/e.js"]);",
          "type": "js",
        },
        {
          "filename": "_expo/static/js/web/b-5e1fcd4e30b82b5f22f834bc2d5bbb57.js",
          "metadata": {
            "expoDomComponentReferences": [],
            "isAsync": true,
            "modulePaths": [
              "/app/b.js",
            ],
            "paths": {},
            "reactClientReferences": [],
            "reactServerReferences": [],
            "requires": [
              "_expo/static/js/web/__expo-metro-runtime-9766bff2257e805459e3ab4532b77d32.js",
            ],
          },
          "originFilename": "b.js",
          "source": "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
        "use strict";

        Object.defineProperty(exports, '__esModule', {
          value: true
        });
        _$$_REQUIRE(_dependencyMap[0]);
        const b = 'b';
        exports.b = b;
      },"/app/b.js",["/app/d.js"]);",
          "type": "js",
        },
        {
          "filename": "_expo/static/js/web/c-d7e1c531872ed205c63163fe1919d971.js",
          "metadata": {
            "expoDomComponentReferences": [],
            "isAsync": true,
            "modulePaths": [
              "/app/c.js",
            ],
            "paths": {},
            "reactClientReferences": [],
            "reactServerReferences": [],
            "requires": [
              "_expo/static/js/web/__expo-metro-runtime-9766bff2257e805459e3ab4532b77d32.js",
            ],
          },
          "originFilename": "c.js",
          "source": "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
        "use strict";

        Object.defineProperty(exports, '__esModule', {
          value: true
        });
        _$$_REQUIRE(_dependencyMap[0]);
        const c = 'c';
        exports.c = c;
      },"/app/c.js",["/app/e.js"]);",
          "type": "js",
        },
        {
          "filename": "_expo/static/js/web/__common-f00c61b44236e82179327dcfbabec508.js",
          "metadata": {
            "expoDomComponentReferences": [],
            "isAsync": false,
            "modulePaths": [
              "/app/d.js",
              "/app/e.js",
            ],
            "paths": {},
            "reactClientReferences": [],
            "reactServerReferences": [],
            "requires": [
              "_expo/static/js/web/__expo-metro-runtime-9766bff2257e805459e3ab4532b77d32.js",
            ],
          },
          "originFilename": "../__common.js",
          "source": "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
        "use strict";

        Object.defineProperty(exports, '__esModule', {
          value: true
        });
        const d = 'd';
        exports.d = d;
      },"/app/d.js",[]);
      __d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
        "use strict";

        Object.defineProperty(exports, '__esModule', {
          value: true
        });
        const e = 'e';
        exports.e = e;
      },"/app/e.js",[]);",
          "type": "js",
        },
        {
          "filename": "_expo/static/js/web/__expo-metro-runtime-9766bff2257e805459e3ab4532b77d32.js",
          "metadata": {
            "expoDomComponentReferences": [],
            "isAsync": false,
            "modulePaths": [],
            "paths": {},
            "reactClientReferences": [],
            "reactServerReferences": [],
            "requires": [],
          },
          "originFilename": "../__expo-metro-runtime.js",
          "source": "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
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
    });
    expect(artifacts[2].metadata).toEqual({
      isAsync: true,
      modulePaths: ['/app/b.js'],
      requires: [expect.stringMatching(/_expo\/static\/js\/web\/__expo-metro-runtime-.*\.js/)],
      paths: {},
      expoDomComponentReferences: [],
      reactClientReferences: [],
      reactServerReferences: [],
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
    });
    // Ensure the common chunk isn't run, just loaded.
    expect(artifacts[4].source).not.toMatch(/TEST_RUN_MODULE/);
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
          const proxy = _$$_REQUIRE(_dependencyMap[0]).createClientModuleProxy("./other.js");
          module.exports = proxy;
          const foo = _$$_REQUIRE(_dependencyMap[0]).registerClientReference(function () {
            throw new Error("Attempted to call foo() of /app/other.js from the server but foo is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
          }, "./other.js", "foo");
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
        requires: [],
      });
    });
  });
});
