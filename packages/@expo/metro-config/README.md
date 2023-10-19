# `@expo/metro-config`

This package contains the default Metro config that is required for bundling Expo apps.

`metro.config.js`

```js
// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

module.exports = config;
```

## Exotic

Most of the [Exotic mode](https://blog.expo.dev/drastically-faster-bundling-in-react-native-a54f268e0ed1) performance benefits have been integrated in the default Expo CLI bundling pipeline (e.g. [less AST cloning](https://github.com/facebook/metro/pull/854), [faster worker creation](https://github.com/facebook/metro/pull/856)), and as such, the feature no longer needs to be enabled/disabled. Setting `mode: "exotic"` will no longer have any additional effects over the default.

If you'd like to use different transformers (e.g. Sucrase) for different files, you can still create a custom transformer and refine it for your project needs.

### Custom transformers

> Caution: This is an advanced feature for developers who need to speed up the bundling of very large apps.

You can use `@expo/metro-config/transformer` to create a custom multi-rule transformer. This is useful for running fewer transformations on node modules and speeding up bundling.

`metro.transformer.js`

```js
const { createExoticTransformer } = require('@expo/metro-config/transformer');

module.exports = createExoticTransformer({
  transpileModules: ['@stripe/stripe-react-native'],
  // You can uncomment the following lines to add any extra node_modules paths in a monorepo:
  //   nodeModulesPaths: [
  //     'node_modules',
  //     // Generally you'll add this when your config is in `apps/my-app/metro.config.js`
  //     '../../node_modules',
  //     // If you have custom packages in a `packages/` folder
  //     '../../packages',
  //   ],
});
```

Then use it in your project:

`metro.config.js`

```js
const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

// Use the new transformer
config.transformer.babelTransformerPath = require.resolve('./metro.transformer');

// Optionally, you can add support for the `react-native` resolver field back
// doing this will increase bundling time and size as many community packages ship untransformed code using this feature.
// Other packages like `nanoid` use the field to support `react-native` so you may need to enable it regardless.
// defaultConfig.resolver.resolverMainFields.unshift('react-native');

module.exports = config;
```
