module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        require('@babel/preset-env'),
        {
          modules: false, // Disable the default `modules-commonjs`, to enable lazy evaluation
          targets: {
            node: '18.0.0',
          },
        },
      ],
      require('@babel/preset-typescript'),
    ],
    plugins: [
      require('babel-plugin-dynamic-import-node'),
      require('@babel/plugin-transform-export-namespace-from'),
      [
        require('@babel/plugin-transform-modules-commonjs'),
        {
          lazy: () => true,
        },
      ],
    ],
  };
};
