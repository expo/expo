---
title: Environment variables in Expo
sidebar_title: Environment variables
---

import { Terminal } from '~/ui/components/Snippet';

> Are you using [EAS Build](/build/introduction/)? The [EAS Build documentation about environment variables build secrets](/build-reference/variables.md) explains how to work with sensitive values that you would not include in your source code and Git repository. It also explains how to set environment variables for build profiles.

Environment variables are global values that are defined in your system. Without these variables, your operating system wouldn't know what to do when you execute a command like `npx expo start`. Under the hood, it uses the [`PATH`](http://www.linfo.org/path_env_var.html) variable to fetch a list of directories to search for the `expo` executable. Environment variables are always strings.

Because they are defined globally, these variables are useful to change the behavior of code _without changing the code itself_. Just like your system behaving _differently_ when adding directories to the `PATH` variable, you can implement these in your React Native app as well. For example, you can enable or disable certain features when building a testing version of your app, or you can switch to a different API endpoint when building for production.

## Passing data through the app manifest `extra` field

In the app manifest, there is also a `extra` property. This property is inlined when you publish your project with EAS Update, and at build time for EAS Build (be sure to set the environment variable in your build profile if needed).

### Dynamic app config

The following is an example of a [dynamic **app.config.js** config](/workflow/configuration#app-config) that reads from the [`process.env`](https://nodejs.org/dist/latest/docs/api/process.html#process_process_env) to expose it through the `extra` field.

```js
// app.config.js

module.exports = {
  name: 'CoolApp',
  version: '1.0.0',
  extra: {
    enableComments: process.env.COOLAPP_COMMENTS === 'true',
  },
};
```

With this app config, we can configure the `extra.enableComments` property without having to change the code itself by running: `COOLAPP_COMMENTS=true npx expo start`.

### Reading the variables from application code

To use these `extra` properties in your app, you have to use the [`expo-constants`](/versions/latest/sdk/constants.md) module. Here you can see a simple component rendering the comments component, only when these are enabled.

```tsx
import Constants from 'expo-constants';

export const Post = ({ enableComments = Constants.manifest.extra.enableComments || false }) => (
  <>
    <Text>...</Text>
    {enableComments && <Comments />}
  </>
);
```

> You can also use `manifest.extra.enableComments` directly in your if statement, but that makes it a bit harder to test or override.

## Using Babel to inline environment variables in code at build time

This approach replaces all references to `process.env.VARNAME` with the value directly in your app source code, not just in the app manifest. For example:

```js
// Before build step (in your source code)
const API_URL = process.env.API_URL;

// After build step (in app bundle)
const API_URL = 'https://api.production.com';
```

### Installing and configuring babel-plugin-transform-inline-environment-variables

To use [`babel-plugin-transform-inline-environment-variables`](https://github.com/babel/website/blob/master/docs/plugin-transform-inline-environment-variables.md), install the package and add it to your Babel config, then restart your development server and clear the cache.

<Terminal cmd={['$ npm install --save-dev babel-plugin-transform-inline-environment-variables']} />

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['transform-inline-environment-variables'],
  };
};
```

When you modify **babel.config.js** you should always restart the development server and clear the cache: `npx expo start --clear`. Now you can use environment variables directly in your source code.

### Reading the variables from application code

```tsx
export const Post = ({
  enableComments = process.env.EXPO_COOLAPP_COMMENTS === 'true' || false,
}) => (
  <>
    <Text>...</Text>
    {props.enableComments && <Comments />}
  </>
);
```

This approach this plugin will work well with environment variables set in your shell process, but it won't automatically load **.env** files. We recommend using [direnv](https://direnv.net/) and **.envrc** to accomplish this.

## Storing environment variables in .envrc or .env

If you want to automatically load environment variables from a file in your project rather than setting them in your shell profile or manually when running `npx expo start`, you may want to use a **.envrc** or **.env** file.

### direnv

[direnv](https://direnv.net/) automatically loads and unloads environment variables in your shell depending on your current directory. So when you `cd` into your project directory, it will load all of the variables as configured in **.envrc**. [Learn how to get started](https://direnv.net/#getting-started).

### dotenv

[dotenv](https://github.com/motdotla/dotenv) is a library that you import in your application code to load the **.env** file. We prefer [direnv](https://direnv.net/) because it hooks into the shell rather than your application code. If you want to use dotenv, you can [learn more in the README](https://github.com/motdotla/dotenv).

## Security considerations

Never store sensitive secrets in your environment variables. The reason behind this is that your code is run on the client side, and thus including your environment variables in the code itself. You can [read more about this topic here](https://reactnative.dev/docs/security#storing-sensitive-info).
