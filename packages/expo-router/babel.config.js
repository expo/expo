module.exports = function (api) {
  const env = api.cache(() => process.env.NODE_ENV);
  //   api.cache(true);
  //   const isTest = process.env.NODE_ENV === 'test';
  if (env === 'test') {
    return {
      presets: ['babel-preset-expo'],
    };
  }

  // This is the Node.js setting for SSR bundling.
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
      require('@babel/preset-react'),
    ],
    plugins: [
      // Skip this when running in tests. We want the CJS build to be optimized for Node.js, which currently doesn't support native platforms.
      require('babel-plugin-react-native-web'),
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
