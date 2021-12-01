---
title: Installing app variants on the same device
---

When creating [development, preview, and production builds](../eas-json.md#common-use-cases), it's common to want to install one of each build on your device at the same time. This allows you to do development work, preview the next version of your app, and run the production version all on the same device, without needing to uninstall and reinstall the app.

In order to be able to have multiple instances of an app installed on your device, each instance must have a unique Application ID (Android) or Bundle Identifier (iOS).

**If you have a bare project**, you can accomplish this using flavors (Android) and targets (iOS). To configure which flavor is used, use the `gradleCommand` field on your build profile; to configure which target is used, use the `scheme` field for iOS.

**If you have a managed project**, this can be accomplished by using **app.config.js** and environment variables in **eas.json**.

## Example: configuring development and production variants

Let's say we wanted a development build and production build of our managed Expo project. Your **eas.json** might look like this:

```json
{
  "build": {
    "development": {
      "developmentClient": true
    },
    "production": {}
  }
}
```

And your **app.json** might look like this:

```json
{
  "expo": {
    "name": "MyApp",
    "slug": "my-app",
    "ios": {
      "bundleIdentifier": "com.myapp"
    },
    "android": {
      "package": "com.myapp"
    }
  }
}
```

Let's convert this to **app.config.js** so we can make it more dynamic:

```javascript
export default {
  name: "MyApp",
  slug: "my-app",
  ios: {
    bundleIdentifier: "com.myapp",
  },
  android: {
    package: "com.myapp",
  },
};
```

Now let's switch out the iOS `bundleIdentifier` and Android `package` (which becomes the Application ID) based on the presence of an environment variable in **app.config.js**:

```js
const IS_DEV = process.env.APP_VARIANT === "development";

export default {
  // You can also switch out the app icon and other properties to further
  // differentiate the app on your device.
  name: IS_DEV ? "MyApp (Dev)" : "MyApp",
  slug: "my-app",
  ios: {
    bundleIdentifier: IS_DEV ? "com.myapp.dev" : "com.myapp",
  },
  android: {
    package: IS_DEV ? "com.myapp.dev" : "com.myapp",
  },
};
```

> Note: if you are using any libraries that require you to register your application identifier with an external service to use the SDK, such as Google Maps, you will need to have a separate configuration for that API for the iOS Bundle Identifier and Android Package. You can also swap this configuration in using the same approach as above.

To automatically set the `APP_VARIANT` environment variable when running builds with the "development" profile, we can use `env` in **eas.json**:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "env": {
        "APP_VARIANT": "development"
      }
    },
    "production": {}
  }
}
```

Now when you run `eas build --profile development`, the environment variable `APP_VARIANT` will be set to `"development"` when evaluating **app.config.js** both locally and on the EAS Build worker. When you start your development server, you will need to run `APP_VARIANT=development expo start` (or the platform equivalent if you use Windows); a shortcut for this could be to add a script to your **package.json** such as `"dev": "APP_VARIANT=development expo start"`.

When you run `eas build --profile production` the `APP_VARIANT` variable environment will not be set, and the build will run as the production variant.

> **Note**: if you use `expo-updates` to publish JavaScript updates to your app, you should be cautious to set the correct environment variables for the app variant that you are publishing for when you run the `expo publish` command. Refer to the EAS Build ["Environment variables and secrets" guide](/build/updates.md) for more information.