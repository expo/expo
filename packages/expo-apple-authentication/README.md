# expo-apple-authentication

This library provides Apple authentication for iOS standalone apps in the managed and bare workflows. Beginning with iOS 13, any app that includes third-party authentication options **must** provide Apple authentication as an option in order to comply with App Store Review guidelines. Learn more about Apple authentication on the ["Sign In with Apple" website](https://developer.apple.com/sign-in-with-apple/).

# API documentation

- [Documentation for the main branch](https://github.com/expo/expo/blob/main/docs/pages/versions/unversioned/sdk/apple-authentication.md)
- [Documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/apple-authentication/)

# Installation in managed Expo projects

For [managed](https://docs.expo.dev/versions/latest/introduction/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/apple-authentication/).

# Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `expo` package](https://docs.expo.dev/bare/installing-expo-modules/) before continuing.

### Add the package to your npm dependencies

```
expo install expo-apple-authentication
```

### Configure for iOS

Run `npx pod-install` after installing the npm package.

# Setup iOS project

1. Enable the "Sign In with Apple" capability in your app. For bare projects, enable the capability in Xcode under "Signing & Capabilities" -- you'll need to be on Xcode 11 or later. For managed projects, set `ios.usesAppleSignIn` to `true` in app.json.
2. Log into the Apple Developer Console, go to "Certificates, Identifiers, & Profiles" and then "Identifiers".
3. You need to choose a primary app for the Apple Sign In configuration. This is the app whose icon will show up in the Apple Sign In system UI. If you have a set of related apps you might choose the "main" app as the primary, but most likely you'll want to just use the app you're working on now as the primary.
4. In the list of identifiers, click on the one corresponding to your primary app. Enable the "Sign In with Apple" capability, click "Edit", and choose the "Enable as a primary App ID" option. Save the new configuration.
5. If you chose a different app to be the primary, you'll also need to open up the configuration page for your current app, enable the "Sign In with Apple" capability, click "Edit" and choose the "Group with an existing primary App ID" option. Save this configuration as well.
6. Next, go to the "Keys" page and register a new key. Add the "Sign In with Apple" capability, and make sure to choose the correct primary app on the configuration screen.
7. Finally, when you want to make a standalone build to test with, run `expo build:ios --clear-provisioning-profile --revoke-credentials` so that your provisioning profile is regenerated with the new entitlement.

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
