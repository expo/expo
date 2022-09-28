---
title: Development Workflows
---

## Iterating on your product with development builds

When you create a development build of your project, you'll get a stable environment to load any changes to your app that can be defined in JavaScript or other asset-related changes to your app. Other changes to your app, whether defined directly in your **ios/** and **android/** directories or by packages or SDKs you choose to install, will require you to create a new build of your development build.

To enforce an API contract between the JavaScript and native layers of your app, you should set the [`runtimeVersion`](../distribution/runtime-versions.md) value in **app.json** or **app.config.js**. Each build you make will have this value embedded and will only load bundles with the same `runtimeVersion`, in both development and production.

## Tools

### Tunnel URLs

`npx expo start` exposes your development server on a publicly available URL that can be accessed through firewalls from around the globe. This option is useful if you are not able to connect to your development server with the default LAN option or if you want to get feedback on your implementation while you are developing.

To get a tunneled URL, pass the `--tunnel` flag to `npx expo start` from the command line, or select the "tunnel" option for "CONNECTION" if you are using the developer tools.

### Published Updates

EAS CLI's `eas update` command bundles the current state of your JavaScript and asset files into an optimized "update" stored on a hosting service by Expo. A development build of your app can load published updates without needing to check out a particular commit or needing to leave a development machine running.

### Manually entering an update's URL

When a development build launches, it will expose UI to load a development server, or to "Enter URL manually". You can provide a URL manually that will launch a specific branch. The URL follows this pattern:

```
https://u.expo.dev/[your-project-id]?channel-name=[channel-name]

# Example
https://u.expo.dev/F767ADF57-B487-4D8F-9522-85549C39F43F?channel-name=main
```

To get your project's ID, use the URL in **app.json**'s `expo.updates.url` field. To see a list of channels, run `eas channel:list`.

### Deep linking URLs

You can load your app on a device that has a compatible build of your custom client by opening a URL of the form `{scheme}://expo-development-client/?url={manifestUrl}` where

| parameter | value                                                                                                                            |
| --------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `scheme`  | URL scheme of your client (defaults to `exp+{slug}` where slug is the value set in your app.json)                                |
| `url`     | URL-encoded URL of a update manifest to load. The URL will be `https://u.expo.dev/[your-project-id]?channel-name=[channel-name]` |

Example:

```
exp+app-slug://expo-development=client/?url=https%3A%2F%2Fu.expo.dev%2F767ADF57-B487-4D8F-9522-85549C39F43F%2F%3Fchannel-name%3Dmain
```

In the example above, the `scheme` is `exp+app-slug`, and the `url` is a project with an ID of `F767ADF57-B487-4D8F-9522-85549C39F43F` and a channel of `main`.

### QR Codes

You can use our endpoint to generate a QR code that can be easily loaded by a development build.

Requests to `https://qr.expo.dev/development-client`, when supplied the query parameters

| parameter   | value                                                                                                                                |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `appScheme` | URL-encoded deeplinking scheme of your development build (defaults to `exp+{slug}` where slug is the value set in your **app.json**) |
| `url`       | URL-encoded URL of a update manifest to load. The URL will be `https://u.expo.dev/[your-project-id]?channel-name=[channel-name]`     |

receive a response with an SVG image containing a QR code that can be easily scanned to load a version of your project in your development build.

Example:

```
https://qr.expo.dev/development-client?appScheme=exp%2Bapps-slug&url=https%3A%2F%2Fu.expo.dev%2FF767ADF57-B487-4D8F-9522-85549C39F43F0%3Fchannel-name%3Dmain
```

In the example above, the `scheme` is `exp+app-slug`, and the `url` is a project with an ID of `F767ADF57-B487-4D8F-9522-85549C39F43F` and a channel of `main`.

## Example Workflows

These are a few examples of workflows to help your team get the most out of your development build. If you come up with others that would be useful for other teams, please [submit a PR](https://github.com/expo/expo/tree/main/CONTRIBUTING.md#-updating-documentation) to share your knowledge!

### Development Builds

Developers on your team with expertise working with Xcode and Android Studio can update, review, and test changes to the native portion of your app and release them to your team periodically. The rest of your team can install these builds on their devices and simulators and quickly iterate on the JavaScript portion of your app without needing to understand and maintain the tooling required to create a new build.

### Side by side installation

If you need to look at release builds of your project, it is convenient to not overwrite the development build of your app every time you do so. You can accomplish this by using [**app.config.js**](../workflow/configuration.md) to set the bundle identifier or package name based on an environment variable. When changing the ID of your project, be aware that some modules will expect you to perform installation steps for each bundle identifier or package name you use. [Learn more about how to use this pattern on EAS Build with build variants](/build-reference/variants.md).

```js app.config.js
// Example app.config.js where the bundle identifier and package name are
// swapped out depending on an environment variable
module.exports = () => {
  if (process.env.MY_ENVIRONMENT === 'production') {
    return {
      ios: { bundleIdentifier: 'dev.expo.example' },
      android: { package: 'dev.expo.example' },
    };
  } else {
    return {
      ios: { bundleIdentifier: 'dev.expo.example.dev' },
      android: { package: 'dev.expo.example.dev' },
    };
  }
};
```

### PR Previews

You can set up your CI process to publish your project whenever a pull request is merged or updated and add a QR code that can be used to view the change in a compatible development build.

[expo-preview-action](https://github.com/expo/expo-preview-action) can be used to implement this workflow in your project using GitHub Actions, or serve as a template in your CI of choice.
