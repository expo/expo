import type { ConfigAPI, PluginItem } from '@babel/core';

export interface ReactConfigOptions {
  dev: boolean | undefined;
  jsxRuntime: 'classic' | 'automatic' | undefined;
  jsxImportSource: string | undefined;
}

module.exports = function (_api: ConfigAPI, options: ReactConfigOptions) {
  const runtime = options.jsxRuntime || 'automatic';
  const plugins: PluginItem[] = [];

  if (runtime === 'classic' && options.dev) {
    // NOTE(@kitten): runtime 'classic' is typically not needed but preserved for legacy cases (deprecated)
    plugins.push([
      require('@babel/plugin-transform-react-jsx-development'),
      { runtime },
    ]);
  } else {
    plugins.push([
      require('@babel/plugin-transform-react-jsx'),
      {
        pure: !options.dev,
        runtime,
        ...(runtime !== 'classic' && {
          importSource: options.jsxImportSource || 'react',
        }),
      },
    ]);
  }

  if (!options.dev) {
    plugins.push([
      require('@babel/plugin-transform-react-pure-annotations')
    ]);
  }

  return {
    comments: false,
    compact: true,
    plugins,
  };
};
