module.exports = () => ({
  presets: [
    [
      require('@babel/preset-env'),
      {
        targets: {
          node: '12.0.0',
        },
        modules: false,
      },
    ],
    require('@babel/preset-typescript'),
  ],
  plugins: [
    require('babel-plugin-dynamic-import-node'),
    require('@babel/plugin-proposal-export-namespace-from'),
    require('@babel/plugin-proposal-class-properties'),
    [
      require('@babel/plugin-transform-modules-commonjs'),
      {
        lazy: /* istanbul ignore next */ source => true,
      },
    ],
    require('@babel/plugin-proposal-optional-chaining'),
    require('@babel/plugin-proposal-nullish-coalescing-operator'),
  ],
});
