import * as babel from '@babel/core';

import preset from '..';

jest.mock('../utils/resolveModule.ts', () => {
  function resolveModule(_api: any, id: string): string | null {
    if (
      [
        'react-native-worklets/plugin',
        'react-native-reanimated/plugin',
        '@expo/ui/babel-plugin',
        'expo-router/package.json',
        'expo-widgets/package.json',
        '@expo/vector-icons',
      ].includes(id)
    ) {
      return id;
    }
    return null;
  }

  return {
    ...jest.requireActual('../utils/resolveModule.ts'),
    resolveModule: jest.fn(resolveModule),
    hasModule: jest.fn((api, id) => !!resolveModule(api, id)),
  };
});

/** Resolve the full Babel config and return the normalised plugin key list. */
function getPluginKeys(
  caller: Record<string, any>,
  presetOptions?: Record<string, any>,
  filename = '/test.tsx'
): string[] {
  const options = babel.loadOptions({
    babelrc: false,
    configFile: false,
    filename,
    presets: [presetOptions ? [preset, presetOptions] : preset],
    caller: caller as babel.TransformCaller,
  }) as any;
  if (!options) throw new Error('loadOptions returned null');
  return options.plugins.map((p: any) => p.key);
}

/* Full plugin list snapshots.
 * These snapshots are checking which plugins are applied in several scenarios, to
 * prevent regressions as parameters change, and capture them safely. */
describe('plugin list snapshots', () => {
  it('native, default engine, dev', () => {
    const keys = getPluginKeys({ name: 'metro', platform: 'ios', isDev: true });
    expect(keys).toMatchInlineSnapshot(`
      [
        "syntax-hermes-parser",
        "syntax-export-default-from",
        "syntax-dynamic-import",
        "syntax-nullish-coalescing-operator",
        "syntax-optional-chaining",
        "transform-flow-enums",
        "transform-flow-strip-types",
        "transform-typescript",
        "base$0$2$0",
        "transform-object-rest-spread",
        "expo-define-globals",
        "expo-inline-or-reference-env-vars",
        "expo-inline-manifest-plugin",
        "expo-router",
        "expo-server-metadata",
        "expo-server-data-loaders",
        "expo-client-references",
        "expo-use-dom-directive",
        "expo-environment-restricted-imports-plugin",
        "expo-widgets",
        "expo-import-meta-transform",
        "expo-lazy-decorators",
        "worklets",
        "expo-ui",
        "warn-on-deep-imports",
        "transform-react-jsx",
        "transform-block-scoping",
        "transform-class-properties",
        "transform-class-static-block",
        "transform-private-methods",
        "transform-private-property-in-object",
        "transform-unicode-regex",
        "transform-classes",
        "transform-named-capturing-groups-regex",
        "transform-destructuring",
        "transform-async-generator-functions",
        "transform-async-to-generator",
        "transform-parameters",
        "transform-react-display-name",
        "transform-runtime",
        "transform-export-namespace-from",
        "proposal-export-default-from",
        "transform-modules-commonjs",
      ]
    `);
  });

  it('native, hermes engine, dev', () => {
    const keys = getPluginKeys({
      name: 'metro',
      engine: 'hermes',
      platform: 'ios',
      isDev: true,
    });
    expect(keys).toMatchInlineSnapshot(`
      [
        "syntax-hermes-parser",
        "syntax-export-default-from",
        "syntax-dynamic-import",
        "syntax-nullish-coalescing-operator",
        "syntax-optional-chaining",
        "transform-flow-enums",
        "transform-flow-strip-types",
        "transform-typescript",
        "base$0$2$0",
        "expo-define-globals",
        "expo-inline-or-reference-env-vars",
        "expo-inline-manifest-plugin",
        "expo-router",
        "expo-server-metadata",
        "expo-server-data-loaders",
        "expo-client-references",
        "expo-use-dom-directive",
        "expo-environment-restricted-imports-plugin",
        "expo-widgets",
        "expo-import-meta-transform",
        "expo-lazy-decorators",
        "worklets",
        "expo-ui",
        "warn-on-deep-imports",
        "transform-react-jsx",
        "fix-hermes-v1-async-arrow-non-simple-params",
        "fix-hermes-v1-super-in-object-accessor",
        "fix-hermes-v1-class-in-finally",
        "transform-block-scoping",
        "transform-class-static-block",
        "transform-async-generator-functions",
        "transform-runtime",
        "transform-export-namespace-from",
        "proposal-export-default-from",
        "transform-modules-commonjs",
      ]
    `);
  });

  it('native, hermes engine, prod', () => {
    const keys = getPluginKeys({
      name: 'metro',
      engine: 'hermes',
      platform: 'ios',
      isDev: false,
    });
    expect(keys).toMatchInlineSnapshot(`
      [
        "syntax-hermes-parser",
        "syntax-export-default-from",
        "syntax-dynamic-import",
        "syntax-nullish-coalescing-operator",
        "syntax-optional-chaining",
        "transform-flow-enums",
        "transform-flow-strip-types",
        "transform-typescript",
        "base$0$2$0",
        "expo-define-globals",
        "expo-minify-platform-select",
        "expo-inline-or-reference-env-vars",
        "expo-inline-manifest-plugin",
        "expo-router",
        "expo-server-metadata",
        "expo-server-data-loaders",
        "expo-client-references",
        "expo-use-dom-directive",
        "expo-environment-restricted-imports-plugin",
        "expo-widgets",
        "expo-import-meta-transform",
        "expo-lazy-decorators",
        "worklets",
        "expo-ui",
        "transform-react-jsx",
        "transform-react-pure-annotations",
        "fix-hermes-v1-async-arrow-non-simple-params",
        "fix-hermes-v1-super-in-object-accessor",
        "fix-hermes-v1-class-in-finally",
        "transform-block-scoping",
        "transform-class-static-block",
        "transform-async-generator-functions",
        "transform-runtime",
        "transform-export-namespace-from",
        "proposal-export-default-from",
        "transform-modules-commonjs",
      ]
    `);
  });

  it('web, dev', () => {
    const keys = getPluginKeys({ name: 'metro', platform: 'web', isDev: true });
    expect(keys).toMatchInlineSnapshot(`
      [
        "syntax-hermes-parser",
        "syntax-export-default-from",
        "syntax-dynamic-import",
        "syntax-nullish-coalescing-operator",
        "syntax-optional-chaining",
        "transform-flow-enums",
        "transform-flow-strip-types",
        "transform-typescript",
        "transform-object-rest-spread",
        "expo-define-globals",
        "expo-inline-or-reference-env-vars",
        "Rewrite react-native to react-native-web",
        "expo-inline-manifest-plugin",
        "expo-router",
        "expo-server-metadata",
        "expo-server-data-loaders",
        "expo-client-references",
        "expo-use-dom-directive",
        "expo-environment-restricted-imports-plugin",
        "expo-widgets",
        "expo-import-meta-transform",
        "expo-lazy-decorators",
        "worklets",
        "expo-ui",
        "warn-on-deep-imports",
        "transform-react-jsx",
        "transform-class-static-block",
        "transform-private-methods",
        "transform-private-property-in-object",
        "transform-runtime",
        "transform-export-namespace-from",
        "proposal-export-default-from",
        "transform-modules-commonjs",
      ]
    `);
  });

  it('web, prod', () => {
    const keys = getPluginKeys({ name: 'metro', platform: 'web', isDev: false });
    expect(keys).toMatchInlineSnapshot(`
      [
        "syntax-hermes-parser",
        "syntax-export-default-from",
        "syntax-dynamic-import",
        "syntax-nullish-coalescing-operator",
        "syntax-optional-chaining",
        "transform-flow-enums",
        "transform-flow-strip-types",
        "transform-typescript",
        "transform-object-rest-spread",
        "expo-define-globals",
        "expo-minify-platform-select",
        "expo-inline-or-reference-env-vars",
        "Rewrite react-native to react-native-web",
        "expo-inline-manifest-plugin",
        "expo-router",
        "expo-server-metadata",
        "expo-server-data-loaders",
        "expo-client-references",
        "expo-use-dom-directive",
        "expo-environment-restricted-imports-plugin",
        "expo-widgets",
        "expo-import-meta-transform",
        "expo-lazy-decorators",
        "worklets",
        "expo-ui",
        "transform-react-jsx",
        "transform-react-pure-annotations",
        "transform-class-static-block",
        "transform-private-methods",
        "transform-private-property-in-object",
        "transform-runtime",
        "transform-export-namespace-from",
        "proposal-export-default-from",
        "transform-modules-commonjs",
      ]
    `);
  });

  it('native server (SSR)', () => {
    const keys = getPluginKeys({
      name: 'metro',
      platform: 'ios',
      isDev: true,
      isServer: true,
    });
    expect(keys).toMatchInlineSnapshot(`
      [
        "syntax-hermes-parser",
        "syntax-export-default-from",
        "syntax-dynamic-import",
        "syntax-nullish-coalescing-operator",
        "syntax-optional-chaining",
        "transform-flow-enums",
        "transform-flow-strip-types",
        "transform-typescript",
        "transform-object-rest-spread",
        "expo-define-globals",
        "expo-inline-manifest-plugin",
        "expo-router",
        "expo-server-metadata",
        "expo-server-data-loaders",
        "expo-client-references",
        "expo-use-dom-directive",
        "expo-environment-restricted-imports-plugin",
        "expo-widgets",
        "expo-import-meta-transform",
        "expo-lazy-decorators",
        "worklets",
        "expo-ui",
        "warn-on-deep-imports",
        "transform-react-jsx",
        "transform-class-static-block",
        "transform-private-methods",
        "transform-private-property-in-object",
        "transform-runtime",
        "transform-export-namespace-from",
        "proposal-export-default-from",
        "transform-modules-commonjs",
      ]
    `);
  });

  it('react server', () => {
    const keys = getPluginKeys({
      name: 'metro',
      platform: 'web',
      isDev: true,
      isReactServer: true,
    });
    expect(keys).toMatchInlineSnapshot(`
      [
        "syntax-hermes-parser",
        "syntax-export-default-from",
        "syntax-dynamic-import",
        "syntax-nullish-coalescing-operator",
        "syntax-optional-chaining",
        "transform-flow-enums",
        "transform-flow-strip-types",
        "transform-typescript",
        "transform-object-rest-spread",
        "expo-define-globals",
        "expo-inline-or-reference-env-vars",
        "Rewrite react-native to react-native-web",
        "expo-inline-manifest-plugin",
        "expo-router",
        "expo-server-metadata",
        "expo-client-references",
        "expo-server-actions",
        "expo-environment-restricted-react-api-plugin",
        "expo-environment-restricted-imports-plugin",
        "expo-widgets",
        "expo-import-meta-transform",
        "expo-lazy-decorators",
        "worklets",
        "expo-ui",
        "warn-on-deep-imports",
        "transform-react-jsx",
        "transform-class-static-block",
        "transform-private-methods",
        "transform-private-property-in-object",
        "transform-runtime",
        "transform-export-namespace-from",
        "proposal-export-default-from",
        "transform-modules-commonjs",
      ]
    `);
  });

  it('DOM component', () => {
    const keys = getPluginKeys({
      name: 'metro',
      platform: 'web',
      isDev: true,
      isDomComponent: true,
    });
    expect(keys).toMatchInlineSnapshot(`
      [
        "syntax-hermes-parser",
        "syntax-export-default-from",
        "syntax-dynamic-import",
        "syntax-nullish-coalescing-operator",
        "syntax-optional-chaining",
        "transform-flow-enums",
        "transform-flow-strip-types",
        "transform-typescript",
        "base$0$2$0",
        "transform-object-rest-spread",
        "expo-define-globals",
        "expo-inline-or-reference-env-vars",
        "Rewrite react-native to react-native-web",
        "expo-inline-manifest-plugin",
        "expo-router",
        "expo-server-metadata",
        "expo-server-data-loaders",
        "expo-client-references",
        "expo-use-dom-directive",
        "expo-environment-restricted-imports-plugin",
        "expo-widgets",
        "expo-import-meta-transform",
        "expo-lazy-decorators",
        "worklets",
        "expo-ui",
        "warn-on-deep-imports",
        "transform-react-jsx",
        "transform-block-scoping",
        "transform-class-properties",
        "transform-class-static-block",
        "transform-classes",
        "transform-private-methods",
        "transform-private-property-in-object",
        "transform-unicode-regex",
        "transform-named-capturing-groups-regex",
        "transform-destructuring",
        "transform-async-generator-functions",
        "transform-async-to-generator",
        "transform-for-of",
        "transform-parameters",
        "transform-react-display-name",
        "transform-optional-catch-binding",
        "transform-optional-chaining",
        "transform-nullish-coalescing-operator",
        "transform-logical-assignment-operators",
        "transform-runtime",
        "transform-export-namespace-from",
        "proposal-export-default-from",
        "transform-modules-commonjs",
      ]
    `);
  });
});

describe('disableImportExportTransform', () => {
  it('removes commonjs and export-default-from when true', () => {
    const keys = getPluginKeys(
      { name: 'metro', platform: 'ios', isDev: true },
      { disableImportExportTransform: true }
    );
    expect(keys).not.toContain('transform-modules-commonjs');
    expect(keys).not.toContain('proposal-export-default-from');
  });

  it('includes commonjs by default on native', () => {
    const keys = getPluginKeys({ name: 'metro', platform: 'ios', isDev: true });
    expect(keys).toContain('transform-modules-commonjs');
    expect(keys).toContain('proposal-export-default-from');
  });

  it('disables import/export transform when supportsStaticESM is true', () => {
    const keys = getPluginKeys({
      name: 'metro',
      platform: 'ios',
      isDev: true,
      supportsStaticESM: true,
    });
    expect(keys).not.toContain('transform-modules-commonjs');
    expect(keys).not.toContain('proposal-export-default-from');
  });

  it('disables import/export transform for webpack by default', () => {
    const keys = getPluginKeys({ name: 'babel-loader', isDev: true });
    expect(keys).not.toContain('transform-modules-commonjs');
    expect(keys).not.toContain('proposal-export-default-from');
  });

  it('adds detect-dynamic-exports when supportsStaticESM is true', () => {
    const keys = getPluginKeys({
      name: 'metro',
      platform: 'ios',
      isDev: true,
      supportsStaticESM: true,
    });
    expect(keys).toContain('expo-detect-dynamic-exports');
  });
});

describe('enableBabelRuntime', () => {
  it('removes transform-runtime when false', () => {
    const keys = getPluginKeys(
      { name: 'metro', platform: 'ios', isDev: true },
      { enableBabelRuntime: false }
    );
    expect(keys).not.toContain('transform-runtime');
  });

  it('includes transform-runtime by default', () => {
    const keys = getPluginKeys({ name: 'metro', platform: 'ios', isDev: true });
    expect(keys).toContain('transform-runtime');
  });

  it('removes transform-runtime when metroSourceType is script', () => {
    const keys = getPluginKeys({
      name: 'metro',
      platform: 'ios',
      isDev: true,
      metroSourceType: 'script',
    });
    expect(keys).not.toContain('transform-runtime');
  });
});

describe('decorators', () => {
  it('removes proposal-decorators when false', () => {
    const keys = getPluginKeys(
      { name: 'metro', platform: 'ios', isDev: true },
      { decorators: false }
    );
    expect(keys).not.toContain('expo-lazy-decorators');
  });

  it('includes proposal-decorators by default', () => {
    const keys = getPluginKeys({ name: 'metro', platform: 'ios', isDev: true });
    expect(keys).toContain('expo-lazy-decorators');
  });
});

describe('disableDeepImportWarnings', () => {
  it('removes warn-on-deep-imports when true', () => {
    const keys = getPluginKeys(
      { name: 'metro', platform: 'ios', isDev: true },
      { disableDeepImportWarnings: true }
    );
    expect(keys).not.toContain('warn-on-deep-imports');
  });

  it('includes warn-on-deep-imports in dev by default', () => {
    const keys = getPluginKeys({ name: 'metro', platform: 'ios', isDev: true });
    expect(keys).toContain('warn-on-deep-imports');
  });

  it('excludes warn-on-deep-imports in prod', () => {
    const keys = getPluginKeys({ name: 'metro', platform: 'ios', isDev: false });
    expect(keys).not.toContain('warn-on-deep-imports');
  });
});

describe('isDomComponent', () => {
  it('does not add downlevel transforms for normal native builds', () => {
    const keys = getPluginKeys({ name: 'metro', platform: 'ios', isDev: true });
    expect(keys).not.toContain('transform-logical-assignment-operators');
  });
});

describe('engine-driven plugins', () => {
  it('adds transform-object-rest-spread for non-hermes engine', () => {
    const keys = getPluginKeys({ name: 'metro', platform: 'ios', isDev: true });
    expect(keys).toContain('transform-object-rest-spread');
  });

  it('does not add transform-object-rest-spread for hermes engine', () => {
    const keys = getPluginKeys({ name: 'metro', engine: 'hermes', platform: 'ios', isDev: true });
    expect(keys).not.toContain('transform-object-rest-spread');
  });

  it('adds transform-parameters for default engine (hermes-v0)', () => {
    const keys = getPluginKeys({ name: 'metro', platform: 'ios', isDev: true });
    expect(keys).toContain('transform-parameters');
  });

  it('does not add transform-parameters for hermes engine (hermes-v1)', () => {
    const keys = getPluginKeys({ name: 'metro', engine: 'hermes', platform: 'ios', isDev: true });
    expect(keys).not.toContain('transform-parameters');
  });

  it('adds transform-class-static-block for hermes on native', () => {
    const keys = getPluginKeys({ name: 'metro', engine: 'hermes', platform: 'ios', isDev: true });
    expect(keys).toContain('transform-class-static-block');
  });
});

describe('unstable_transformProfile override', () => {
  it('selects default profile despite hermes engine', () => {
    const keys = getPluginKeys(
      { name: 'metro', engine: 'hermes', platform: 'ios', isDev: true },
      { native: { unstable_transformProfile: 'default' } }
    );
    expect(keys).toContain('transform-classes');
    expect(keys).toContain('transform-class-properties');
  });

  it('selects hermes-canary profile', () => {
    const keys = getPluginKeys(
      { name: 'metro', platform: 'ios', isDev: true },
      { native: { unstable_transformProfile: 'hermes-canary' } }
    );
    expect(keys).not.toContain('transform-classes');
    expect(keys).not.toContain('transform-class-properties');
  });
});

describe('TypeScript overrides', () => {
  const caller = { name: 'metro', platform: 'ios', isDev: true };

  it('includes transform-typescript for .tsx files', () => {
    expect(getPluginKeys(caller, undefined, '/test.tsx')).toContain('transform-typescript');
  });

  it('includes transform-typescript for .ts files', () => {
    expect(getPluginKeys(caller, undefined, '/test.ts')).toContain('transform-typescript');
  });

  it('excludes transform-typescript for .js files on native', () => {
    expect(getPluginKeys(caller, undefined, '/test.js')).not.toContain('transform-typescript');
  });

  it('excludes transform-typescript for .js files on web', () => {
    expect(
      getPluginKeys({ name: 'metro', platform: 'web', isDev: true }, undefined, '/test.js')
    ).not.toContain('transform-typescript');
  });
});

describe('platform-specific plugins', () => {
  it('adds react-native-web rewrite for web', () => {
    const keys = getPluginKeys({ name: 'metro', platform: 'web', isDev: true });
    expect(keys).toContain('Rewrite react-native to react-native-web');
  });

  it('does not add react-native-web rewrite for native', () => {
    const keys = getPluginKeys({ name: 'metro', platform: 'ios', isDev: true });
    expect(keys).not.toContain('Rewrite react-native to react-native-web');
  });

  it('excludes expo-inline-manifest-plugin for webpack', () => {
    expect(getPluginKeys({ name: 'babel-loader', isDev: true })).not.toContain(
      'expo-inline-manifest-plugin'
    );
  });

  it('includes expo-inline-manifest-plugin for metro', () => {
    expect(getPluginKeys({ name: 'metro', platform: 'ios', isDev: true })).toContain(
      'expo-inline-manifest-plugin'
    );
  });
});

describe('server environment', () => {
  it('includes server-actions and restricted-react-api for react server', () => {
    const keys = getPluginKeys({
      name: 'metro',
      platform: 'web',
      isDev: true,
      isReactServer: true,
    });
    expect(keys).toContain('expo-server-actions');
    expect(keys).toContain('expo-environment-restricted-react-api-plugin');
    expect(keys).not.toContain('expo-use-dom-directive');
  });

  it('includes use-dom-directive for client environments', () => {
    const keys = getPluginKeys({ name: 'metro', platform: 'ios', isDev: true });
    expect(keys).toContain('expo-use-dom-directive');
    expect(keys).not.toContain('expo-server-actions');
  });

  it('excludes expo-inline-or-reference-env-vars for server', () => {
    const keys = getPluginKeys({
      name: 'metro',
      platform: 'ios',
      isDev: true,
      isServer: true,
    });
    expect(keys).not.toContain('expo-inline-or-reference-env-vars');
  });
});

describe('jsx', () => {
  it('uses production jsx transform', () => {
    const keys = getPluginKeys({ name: 'metro', platform: 'ios', isDev: false });
    expect(keys).toContain('transform-react-jsx');
    expect(keys).not.toContain('transform-react-jsx/development');
  });

  it('uses development jsx transform in dev with classic runtime', () => {
    const keys = getPluginKeys(
      { name: 'metro', platform: 'ios', isDev: true },
      { jsxRuntime: 'classic' }
    );
    expect(keys).toContain('transform-react-jsx/development');
  });
});
