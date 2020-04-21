---
title: Using Preact with Expo for Web
---

> Warning: Preact is not a first-class feature of React Native for web, if you run into any problems please open an issue at [expo-cli/issues](https://github.com/expo/expo-cli/issues).

[Preact](https://preactjs.com/) is a 3kb alternative to React. Using Preact in a blank `react-native-web` project can lower your GZipped bundle by nearly 24kb.

- Install Preact (requires Preact 10+): `yarn add preact-responder-event-plugin preact`
- Run `expo customize:web` and select `webpack.config.js`
- Modify the webpack config to use Preact instead of React:

  ```js
  const createExpoWebpackConfigAsync = require('@expo/webpack-config');
  const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

  module.exports = async (env, argv) => {
    const config = await createExpoWebpackConfigAsync(env, argv);

    config.resolve.alias = {
      ...config.resolve.alias,
      // Use Preact aliases
      react$: 'preact/compat',
      'react-dom$': 'preact/compat',
      // Fix the responder system which react-native-web depends on
      'react-dom/unstable-native-dependencies$': 'preact-responder-event-plugin',
    };

    // Optionally you can enable the bundle size report.
    // It's best to do this only with production builds.
    // If you use it, be sure to install it with `yarn add -D webpack-bundle-analyzer`
    if (env.mode === 'production') {
      config.plugins.push(
        new BundleAnalyzerPlugin({
          path: 'web-report',
        })
      );
    }
    return config;
  };
  ```

- That's it! Running `expo build:web` will now produce a significantly smaller bundle.
