---
title: Environment variables in Expo
---

Environment variables are global values that are defined in your system. Without these variables, your operating system wouldn't know what to do when you execute a command like `expo start`. Under the hood, it uses the [`PATH`](http://www.linfo.org/path_env_var.html) variable to fetch a list of directories to search for the `expo` executable.

Because they are defined globally, these variables are useful to change the behavior of code _without changing the code itself_. Just like your system behaving "differently" when adding directories to the `PATH` variable, you can implement these in your Expo app as well. For example, you can enable or disable certain features when building a testing version of your app, or you can switch to a different API endpoint when building for production.

### The app manifest `.env`

If you have installed the [`expo-constants`](../versions/latest/sdk/constants.md) module in your managed workflow project, you can access the app manifest's properties. One of these properties is the `.env` property, a property that is **only** available when running `expo start`. As the name suggests, it contains some of your system-defined environment variables. For security reasons, only the variables that [starts with `REACT_NATIVE_` or `EXPO_` are available](https://github.com/expo/expo-cli/blob/62b296498100ad28a655a119a85b4d78fe9acd58/packages/xdl/src/Project.ts#L1929).

> While the `.env` property can be useful during development, this property is not available when running `expo publish` or `expo build`. It should not be used for feature flagging or other app-specific configuration because of this.

### Using app manifest `.extra`

In the app manifest, there is also a `.extra` property. Unlike `.env`, this property is included when you publish your project with `expo publish` or `expo build`. The contents of the `.extra` property are taken from your app manifest. By default, this does not add any environment variables, but we can make that happen with the [dynamic app manifest configuration](../workflow/configuration.md#app-config).

Below you can see an example of the dynamic `app.config.js` manifest. It's similar to the `app.json`, but written in JavaScript instead of JSON. The manifest is loaded when starting or publishing your app and has access to the environment variables using [`process.env`](https://nodejs.org/dist/latest/docs/api/process.html#process_process_env). With this we can configure the `.extra.enableComments` property without having to change the code itself, like `COOLAPP_COMMENTS=true; expo start`.

```js
export default {
  name: 'CoolApp',
  version: '1.0.0',
  extra: {
    enableComments: process.env.COOLAPP_COMMENTS === 'true',
  },
};
```

To use these `.extra` properties in your Expo app, you have to use the [`expo-constants`](../versions/latest/sdk/constants.md) module. Here you can see a simple component rendering the comments component, only when these are enabled.

```js
import Constants from 'expo-constants';

export const Post = props => (
  <View>
    <Text>...</Text>
    {props.enableComments && <Comments />}
  </View>
);

Post.defaultProps = {
  enableComments: Constants.manifest.extra.enableComments || false,
};
```

> You can also use `manifest.extra.enableComments` directly in your if statement, but that makes it a bit harder to test or override.

### Using Babel to "replace" variables

In the bare workflow, you don't have access to the manifest via the [`expo-constants`](../versions/latest/sdk/constants.md) module. You can still use environment variables using another method, a Babel plugin. This approach replaces all references to `process.env.VARNAME` with the variable contents, and works in both Bare and Managed Workflows.

To set this up, we need to install the [`babel-plugin-transform-inline-environment-variables`](https://github.com/babel/website/blob/master/docs/plugin-transform-inline-environment-variables.md) plugin. After adding this to your dev dependencies, we need to tell Babel to use this plugin. Below you can see a modifed `babel.config.js` with this plugin enabled.

```js
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['transform-inline-environment-variables'],
  };
};
```

After adding the new Babel plugin to your config, you can access the environment variable. Here you can see the same component as above, but without `expo-constants`.

```js
export const Post = props => (
  <View>
    <Text>...</Text>
    {props.enableComments && <Comments />}
  </View>
);

Post.defaultProps = {
  enableComments: process.env.EXPO_COOLAPP_COMMENTS === 'true' || false,
};
```

> Keep in mind that all environment variables are parsed as a string. If you use booleans like `true` or `false`, you have to check using their string equivalent.

### Using a dotenv file

Over time your app grows, and more configuration is added. When this happens, it could get harder to find the correct environment variables to start or build your app. Luckily, there is a concept called "dotenv" that can help when this happens.

A dotenv file is a file with all environment variables, and their value, within your project. You can load these dotenv files in Node with a library called [`dotenv`](https://github.com/motdotla/dotenv).

#### From `app.config.js`

Below you can see the dynamic manifest using this `dotenv` library. It imports the `/config` module to automatically load the `.env` and merge it with `process.env`. You can also use it without merging it to `process.env`, [read more about that here](https://github.com/motdotla/dotenv#config).

```js
import 'dotenv/config';

export default {
  name: 'CoolApp',
  version: '1.0.0',
  extra: {
    enableComments: process.env.COOLAPP_COMMENTS === 'true',
  },
};
```

#### From `babel.config.js`

The official `transform-inline-environment-variables` plugin does not load the `.env` file. If you want to use these files with Babel, you can use unofficial plugins like [`babel-plugin-inline-dotenv`](https://github.com/brysgo/babel-plugin-inline-dotenv). This plugin will load your `.env` when Babel is building your app.

```js
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['inline-dotenv'],
  };
};
```

### Security considerations

Never store sensitive secrets in your environment variables. The reason behind this is that your code is run on the client side, and thus including your environment variables in the code itself. You can [read more about this topic here](https://reactnative.dev/docs/security#storing-sensitive-info).
