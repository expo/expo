---
title: Development Workflows
---


## Iterating on your product with custom clients

When you build a custom client for your project, you get a stable environment to load any changes to your application that can be defined in JavaScript or other asset-related changes to your application. Other changes to your application, whether defined directly in your `ios/` and `android/` directories, or by packages or SDKs you choose to install, will require a new build of your client.

To enforce an API contract between the JavaScript and native portion of your application, you should set the [`runtimeVersion`](../distribution/runtime-versions.md) value in your app.json or app.config.js. Each build you make will have this value embedded and will only load bundles with the same `runtimeVersion`, in both development and production.

## Tools

### Tunnel URLs

`expo start` can expose your development server on a publicly available URL that can be accessed through firewalls from around the globe.  This option is useful if you are not able to connect to your development server with the default LAN option or if you want to get feedback on your implementation while you are developing.

To get a tunneled URL, pass the `--tunnel` flag to `expo start` from the command line, or select the "tunnel" option for "CONNECTION" if you are using the developer tools.

### Published Updates

[`expo publish`](../workflow/publishing.md) packages the current state of your JavaScript and asset files into an optimized "update" stored on a free hosting service provided by Expo.  Published updates can be loaded in Expo Clients without needing to check out a particular commit or leave a development machine running.

### Deep linking URLs

You can load your application on a device that has a compatible build of your custom client by opening a URL of the form `{scheme}://expo-development-client/?url={manifestUrl}` where

| parameter | value |
| --------------- | ----------------------- |
| `scheme`         | URL scheme of your client (defaults to `exp+{slug}` where slug is the value set in your app.json)       |
| `url`         | URL-encoded URL of a update manifest to load  (e.g. as provided by `expo publish`)     |


### QR Codes

You can use our endpoint to generate a QR code that can be easily loaded by a build of your custom development client.

Requests to `https://qr.expo.dev/development-client`, when supplied the query parameters

| parameter | value |
| --------------- | ----------------------- |
| `appScheme`         | URL-encoded deeplinking scheme of your client (defaults to `exp+{slug}` where slug is the value set in your app.json)       |
| `url`         | URL of a update manifest to load  (e.g. as provided by `expo publish`)     |

receive a response with an SVG image containing a QR code that can be easily scanned to load a version of your project in your client.


## Example Workflows

These are a few examples of workflows to help your team get the most out of your custom clients.  If you come up with others that would be useful for other teams, please [submit a PR](https://github.com/expo/expo/blob/master/CONTRIBUTING.md#-updating-documentation) to share your knowledge!

### Development Builds

Developers on your team with expertise working with Xcode and Android Studio can update, review, and test changes to the native portion of your application and release them to your team periodically. The rest of your team can install these builds on their devices and simulators and quickly iterate on the JavaScript portion of your application without needing to understand and maintain the tooling required to create a new build.

### Side by side installation

If you need to look at release builds of your project, it is convenient to not overwrite the development version of your app every time you do so.  You can accomplish this by using [app.config.js](../workflow/configuration.md) to set the bundle identifier or package name based on an environment variable.  When changing the ID of your project, be aware that some modules will expect you to perform installation steps for each bundle identifier or package name you use.

```js
module.exports = () => {
  if (process.env.MY_ENVIRONMENT === 'production') {
    return {
      ios: { bundleIdentifier: "dev.expo.example"},
      android: { package: "dev.expo.example"}
    };
  } else {
    return {
      ios: { bundleIdentifier: "dev.expo.example.dev"},
      android: { package: "dev.expo.example.dev"}
    };
  }
};
```

### PR Previews

You can set up your CI process to publish your project whenever a pull request is published or updated and add a QR code that can be used to view the change in a compatible client.

[expo-preview-action](https://github.com/expo/expo-preview-action) can be used to implement this workflow in your project using GitHub Actions, or serve as a template in your CI of choice.
