export default function (api) {
  api.cache(true);
  return {
    presets: [
      [
        '@babel/preset-env',
        {
          modules: false, // Disable the default `modules-commonjs`, to enable lazy evaluation
          targets: {
            node: '18.0.0',
          },
        },
      ],
      '@babel/preset-typescript',
    ],
    plugins: [
      'babel-plugin-dynamic-import-node',
      '@babel/plugin-transform-export-namespace-from',
      [
        '@babel/plugin-transform-modules-commonjs',
        {
          lazy: () => true,
        },
      ],
    ],
  };
};
