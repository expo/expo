---
title: Customizing Webpack
---

When you run `expo start --web` or `expo build:web` the CLI will check to see if your project has a `webpack.config.js` in the root directory. If the project doesn't then Expo will use the default `@expo/webpack-config` (preferred).

> This is akin to `react-scripts` & `create-react-app`.

If you need to edit the config the best way to do this is by running `expo customize:web` and selecting the `webpack.config.js` option.
This will install `@expo/webpack-config` as a devDependency and create a template `webpack.config.js` into your project.
You can now make changes to a config object based on the default config and return it for Expo CLI to use.
Deleting the config will cause Expo to fall back to the default again.

If you create a new Webpack config or make any changes to it you'll need to restart your Webpack dev server with `expo start --web`.

## Example

**`webpack.config.js`**

```ts
const createExpoWebpackConfigAsync = require('@expo/webpack-config');

// Expo CLI will await this method so you can optionally return a promise.
module.exports = async function(env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);
  // If you want to add a new alias to the config.
  config.resolve.alias['moduleA'] = 'moduleB';

  // Maybe you want to turn off compression in dev mode.
  if (config.mode === 'development') {
    config.devServer.compress = false;
  }

  // Or prevent minimizing the bundle when you build.
  if (config.mode === 'production') {
    config.optimization.minimize = false;
  }

  // Finally return the new config for the CLI to use.
  return config;
};
```

# Editing static files

You can also use `expo customize:web` to generate the static project files: `index.html`, `serve.json`, `favicon.ico`, etc...
These can be used to customize your project in a more familiar way.

All of the files you select from the terminal prompt will be copied to a `web/` folder in your project's root directory. Think of this folder like `public/` in Create React App. We use "web" instead of "public" because Expo projects target more then just web. For mobile platforms, we similarly put platform-specific project files in `/ios` and `/android` folders.

Deleting any of these files will cause Expo CLI to fall back to their respective default copies.
If at some point you want to reset these files to their initial values simply run `expo customize:web --force` or `-f` for short.

## Why

- Customizing the favicon icon
- Adding third-party API code to the `<head/>` in your `index.html`
- Changing the caching policy in the `serve.json` file
