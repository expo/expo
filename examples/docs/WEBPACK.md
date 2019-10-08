# Customizing the Webpack Configuration

Expo uses the `@expo/webpack-config` to cover the majority of use-cases involved with running a react-native project in the browser. This is akin to `react-scripts` with `create-react-app`.

You will more than likely need to customize your webpack config in a large scale or production application. The best way to do this is to extend or rebuild the webpack config using methods exported from `@expo/webpack-config`.

By default `expo-cli` checks to see if a `webpack.config.js` files exists in the root directory before using `@expo/webpack-config`. This should provide you with a simple interface for creating complex configurations.

## Extending the Default Config

Say you want to add a file type that isn't supported by default.
Simply create a `webpack.config.js` and merge in a new loader.

**`webpack.config.js`**

```ts
const merge = require('webpack-merge');
// This will automatically get the dev/prod config based on process.env.NODE_ENV.
const expoConfig = require('@expo/webpack-config');

// Create a loader which can import `.obj` & `.mtl` (popular 3D model files (not popular enough to be part of the default config though... 😏))
const modelLoaderConfiguration = {
  test: /\.(obj|mtl)$/,
  use: {
    loader: 'file-loader',
  },
};

// Expo expects a function so we can pass around options.
module.exports = function(env, argv) {
  return merge(expoConfig(env, argv), {
    module: {
      rules: [modelLoaderConfiguration],
    },
  });
};
```
