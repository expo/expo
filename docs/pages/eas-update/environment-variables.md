---
title: Using environment variables with EAS Update
---

EAS Build and EAS Update allow setting and getting environment variables at different times. There are multiple steps to ensure the proper environment variables are available when developing, building, and publishing an update.

## Setting up the app config

To expose environment variables in our project, we'll have to set up our app config to allow it. After this, we'll be able to access these variables throughout our entire project.

First, we'll need to rename **app.json** to **app.config.js**, which will allow us to export our app's config, including JavaScript variables.

Next, we'll add an `API_URL` environment variable (as an example) to our project.

To add it to our app config, we'll add it under the `expo.extra` property.

**app.config.js**

```js
export default () => ({
  expo: {
    extra: {
      API_URL: process.env.API_URL || null,
    },
    // ...
  },
});
```

The code above sets the `extra` property to an object with the environment variable as a member. Now, we need to set and get the variable in our project.

## Setting and getting environment variables during development

To set the `API_URL` environment variable during development, we can prepend the variables before running `npx expo start` like this:

```bash
API_URL="http://localhost:3000" expo start
```

The command above will set the `API_URL` to `"http://localhost:3000"`. Now, it's time to access that value inside our project.

To access it, we can use the `expo-constants` library. It's located under the `Constants.expoConfig.extra.API_URL` property.

## Setting and getting environment variables when building

To set the `API_URL` environment variable during a build, we can include an `"env"` property in an **eas.json** build profile, like below:

**eas.json**:

```json
{
  "production": {
    "env": {
      "API_URL": "https://prod.example.com"
    }
  },
  "staging": {
    "env": {
      "API_URL": "https://staging.example.com"
    }
  }
}
```

Once we run a command like `eas build --profile production`, the `"env"` property in the "production" build profile will set the `API_URL` to `https://prod.example.com/` inside the build.

To access it, we can use the `expo-constants` library. It's located under the `Constants.expoConfig.extra.API_URL` property.

## Setting and getting environment variables when publishing an update

To set the `API_URL` environment variable when publishing an update, we can prepend the environment variables before running `eas update` like this:

```bash
API_URL="https://prod.example.com" eas update --branch production
```

When EAS CLI creates the update, it will set the `API_URL` to `https://prod.example.com` inside the update's bundle.

To access it, we can use the `expo-constants` library. It's located under the `Constants.expoConfig.extra.API_URL` property.

> Note: We could also use the `expo-updates` library to access `API_URL`. It is under `Updates.manifest?.extra?.expoClient?.extra?.eas?.API_URL`. However, `Updates.manifest` is only present when an update is currently running. If the project is in development, `Updates.manifest` will be `undefined`. In addition, if a build is running without an update (for example, it was just downloaded or there are no updates yet), `Updates.manifest` will also be `undefined`.

## Creating an Env.ts file to get environment variables

Many developers often create a file named **Env.ts** in their project, which they import into any file that needs to access environment variables. Combining the information above, we could write the following file to access `API_URL`:

**Env.ts**

```ts
import * as Constants from 'expo-constants';

function getApiUrl() {
  const API_URL = Constants.expoConfig.extra.API_URL;

  if (!API_URL) {
    throw new Error('API_URL is missing.');
  }

  return API_URL;
}

export const Env = {
  API_URL: getApiUrl(),
};
```

## Using a Babel plugin

Alternatively, you can use a Babel plugin to fill in environment variables. [Learn more](/guides/environment-variables/#using-babel-to-replace-variables).
