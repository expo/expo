---
title: Known issues
---

EAS Update is in "preview", meaning that we may still make breaking developer-facing changes. With that, EAS Update is ready for production apps.

With our initial release of EAS Update, there are a variety of known issues you may encounter. These are important to consider when migrating your project from Classic Updates to EAS Update. As we continue to iterate on EAS Update, we will address these issues.

Known issues:

- `eas branch:publish` will not create or send source maps to Sentry. This will result in less informative error reports from Sentry.
- If you use the `defaultSource` prop on the `<Image />` component from `react-native`, your app will crash. Removing that prop resolves the issue.
- When using the new manifest format with Expo Go (`yarn start --force-manifest-type=expo-updates`), the project's name will appear as "Untitled experience" in the dev menu.
- The `eas branch:publish` has an `--auto` flag, which will use the current git branch and the latest commit message and make them the EAS branch and message while publishing. This flag does not work on CI services, like GitHub Actions.
- It is not possible to load an update published with EAS Update inside of Expo Go.
- If you publish a update with code that is incompatible with a build's native code, the build will try to load the update and will crash on launch. This will result in an end-user needing to delete and reinstall the app after a new update with a fix is published. To avoid this, we recommend using the `"runtimeVersion": { "policy": "sdkVersion" }` configuration in your project's app config (**app.json**/**app.config.js**). Also, if you introduce an new native modules, you must update the `"runtimeVersion"` to a new version. To avoid this whole class of errors, test your project after making changes with a preview build before sending the update to production builds. Read more on [configuring your project's runtime version](/eas-update/runtime-versions).

Experiencing issues not listed above? Join us on [Discord](https://chat.expo.dev/) in the #eas channel.
