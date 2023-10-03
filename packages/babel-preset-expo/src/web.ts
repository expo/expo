import { ConfigAPI, PluginItem, TransformOptions } from '@babel/core';

type BabelPresetExpoPlatformOptions = {
  useTransformReactJSXExperimental?: boolean;
  disableImportExportTransform?: boolean;
  // Defaults to undefined, set to something truthy to disable `@babel/plugin-transform-react-jsx-self` and `@babel/plugin-transform-react-jsx-source`.
  withDevTools?: boolean;
  // Defaults to undefined, set to `false` to disable `@babel/plugin-transform-runtime`
  enableBabelRuntime?: boolean;
  // Defaults to `'default'`, can also use `'hermes-canary'`
  unstable_transformProfile?: 'default' | 'hermes-stable' | 'hermes-canary';
};

export type BabelPresetExpoOptions = {
  lazyImports?: boolean;
  reanimated?: boolean;
  jsxRuntime?: 'classic' | 'automatic';
  jsxImportSource?: string;

  web?: BabelPresetExpoPlatformOptions;
};

export function babelPresetExpoWeb(
  api: ConfigAPI,
  options: BabelPresetExpoOptions = {}
): TransformOptions {
  let isDev = api.caller((caller) => (caller as any)?.isDev);
  if (typeof isDev !== 'boolean') {
    isDev = process.env.BABEL_ENV === 'development' || process.env.NODE_ENV === 'development';
  }

  const bundler = api.caller(getBundler);
  const isWebpack = bundler === 'webpack';
  let platform = api.caller((caller) => (caller as any)?.platform);

  // If the `platform` prop is not defined then this must be a custom config that isn't
  // defining a platform in the babel-loader. Currently this may happen with Next.js + Expo web.
  if (!platform && isWebpack) {
    platform = 'web';
  }

  const platformOptions: BabelPresetExpoPlatformOptions = {
    // Only disable import/export transform when Webpack is used because
    // Metro does not support tree-shaking.
    disableImportExportTransform: isWebpack,
    unstable_transformProfile: 'default',
    ...options.web,
  };

  const metroOptions = options.web;

  const extraPlugins: PluginItem[] = [require('babel-plugin-react-native-web')];

  if (metroOptions?.enableBabelRuntime !== false) {
    // Allows configuring a specific runtime version to optimize output
    const isVersion = typeof metroOptions?.enableBabelRuntime === 'string';
    extraPlugins.push([
      require('@babel/plugin-transform-runtime'),
      {
        helpers: true,
        regenerator: true,
        // useESModules: supportsESM && presetEnvConfig.modules !== 'commonjs',

        ...(isVersion && {
          version: metroOptions.enableBabelRuntime,
        }),
      },
    ]);
  }

  return {
    comments: false,
    compact: true,

    presets: [
      [
        require('@babel/preset-env'),
        {
          modules: platformOptions.disableImportExportTransform ? false : 'commonjs',
        },
      ],

      // React support with similar options to Metro.
      [
        require('@babel/preset-react'),
        {
          // Defaults to `automatic`, pass in `classic` to disable auto JSX transformations.
          runtime: options?.jsxRuntime || 'automatic',
          ...(options &&
            options.jsxRuntime !== 'classic' && {
              importSource: (options && options.jsxImportSource) || 'react',
            }),
          development: isDev,
        },
      ],

      // TypeScript support
      [require('@babel/preset-typescript'), { allowNamespaces: true }],
    ],

    // React Native legacy transforms for flow and TypeScript
    overrides: [
      // the flow strip types plugin must go BEFORE class properties!
      // there'll be a test case that fails if you don't.
      {
        test: (filename) => filename == null || !/\.tsx?$/.test(filename),
        plugins: [
          require('@babel/plugin-transform-flow-strip-types'),
          require('babel-plugin-transform-flow-enums'),
        ],
      },

      // Additional features
      {
        plugins: [
          // TODO: Remove
          [require('@babel/plugin-proposal-decorators'), { legacy: true }],

          //   [
          //     require('@babel/plugin-transform-class-properties'),
          //     // use `this.foo = bar` instead of `this.defineProperty('foo', ...)`
          //     {
          //       loose: true,
          //     },
          //   ],
          require('@babel/plugin-syntax-dynamic-import'),
          require('@babel/plugin-syntax-export-default-from'),

          //   require('@babel/plugin-proposal-numeric-separator'),
          //   require('@babel/plugin-proposal-export-namespace-from'),

          require('@babel/plugin-transform-spread'),
          [
            require('@babel/plugin-proposal-object-rest-spread'),
            // Assume no dependence on getters or evaluation order. See https://github.com/babel/babel/pull/11520
            {
              loose: true,
              useBuiltIns: true,
            },
          ],
        ],
      },
      {
        plugins: extraPlugins,
      },
    ],
  };
}

/** Determine which bundler is being used. */
function getBundler(caller: any) {
  if (!caller) return null;
  if (caller.bundler) return caller.bundler;
  if (
    // Known tools that use `webpack`-mode via `babel-loader`: `@expo/webpack-config`, Next.js <10
    caller.name === 'babel-loader' ||
    // NextJS 11 uses this custom caller name.
    caller.name === 'next-babel-turbo-loader'
  ) {
    return 'webpack';
  }

  // Assume anything else is Metro.
  return 'metro';
}
