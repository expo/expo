---
title: Environment variables in Expo
sidebar_title: Environment variables
---

import { Terminal } from '~/ui/components/Snippet';

Environment variables are key-value pairs configured outside your source code that allow your app to behave differently depending on the environment. For example, you can enable or disable certain features when building a testing version of your app, or you can switch to a different API endpoint when building for production.

> Are you using [EAS Build](/build/introduction/)? The EAS Build documentation on [environment variables and build secrets](/build-reference/variables.md) explains how to work with sensitive values that you would not include in your source code and Git repository. It also explains how to set environment variables for build profiles.

## Using the `extra` field

In the app config, there is an `extra` property. This property is available when you publish your project with EAS Update and when you build with EAS Build.

### Dynamic app config

The following is an example of a [dynamic app config](/workflow/configuration#app-config) that reads from [`process.env`](https://nodejs.org/dist/latest/docs/api/process.html#process_process_env) to set an environment variable on the `extra` field.

```js
// app.config.js

module.exports = {
  name: 'MyApp',
  version: '1.0.0',
  extra: {
    apiUrl: process.env.API_URL,
  },
};
```

With this app config, we can configure the `extra.apiUrl` by running:

```bash
API_URL="https://production.example.com" npx expo start
```

### Reading environment variables

To read `extra` properties in your app, you can use the [`expo-constants`](/versions/latest/sdk/constants.md) library. The `extra` property is available on the `Constants.expoConfig` property.

```tsx
import { Button } from 'react-native';
import Constants from 'expo-constants';

function Post() {
  const apiUrl = Constants.expoConfig.extra.apiUrl;

  async function onPress() {
    await fetch(apiUrl, { ... })
  }

  return <Button onPress={onPress} title="Post" />;
}
```

## Using Babel to inline environment variables during build time

An alternative approach is to replace all references of `process.env.VARNAME` with a value using a babel plugin. For example:

```js
// Before build step (in your source code)
const API_URL = process.env.API_URL;

// After build step (in app bundle)
const API_URL = 'https://production.example.com';
```

### Installing and configuring babel-plugin-transform-inline-environment-variables

To use [`babel-plugin-transform-inline-environment-variables`](https://github.com/babel/website/blob/master/docs/plugin-transform-inline-environment-variables.md), install the library and add it to your Babel config, then restart your development server and clear the cache.

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

When you modify **babel.config.js**, you should always restart the development server and clear the cache: `npx expo start --clear`. Now you can use environment variables directly in your source code.

### Reading the variables from application code

```tsx
import { Button } from 'react-native';
import Constants from 'expo-constants';

function Post() {
  const apiUrl = process.env.API_URL;

  async function onPress() {
    await fetch(apiUrl, { ... })
  }

  return <Button onPress={onPress} title="Post" />;
}
```

This approach this plugin will work well with environment variables set in your shell process, but it won't automatically load **.env** files. We recommend using [direnv](https://direnv.net/) and **.envrc** to accomplish that.

## Storing environment variables in .envrc or .env

If you want to automatically load environment variables from a file in your project rather than setting them in your shell profile or manually when running `npx expo start`, you may want to use a **.envrc** or **.env** file.

### direnv

[direnv](https://direnv.net/) automatically loads and unloads environment variables in your shell depending on your current directory. When you `cd` into your project directory, it will load all of the variables as configured in **.envrc**. [Learn more](https://direnv.net/#getting-started).

### dotenv

[dotenv](https://github.com/motdotla/dotenv) is a library that you import in your project code to load the **.env** file. [Learn more](https://github.com/motdotla/dotenv).

## Security considerations

Never store sensitive secrets in your environment variables. When an end-user runs your app, they have access to all of the code and environment variables in your app. Read more about [storing sensitive info](https://reactnative.dev/docs/security#storing-sensitive-info).
