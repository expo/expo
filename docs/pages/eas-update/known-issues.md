---
title: Known issues
---

EAS Update is in "preview", meaning that we may still make breaking developer-facing changes. However, once you start sending updates to your users, those updates will continue to work indefinitely.

With our initial release of EAS Update, there are a variety of known issues you may encounter. These are important to consider when migrating your project from Classic Updates to EAS Update.

Known issues:

- `eas branch:publish` will not create or send source maps to Sentry. This will result in less informative error reports from Sentry.
- A build's `channel` is no longer exposed through the expo-updates library. Instead, you can use [environment variables](/build-reference/variables) to replace any logic that previously relied on `channel`.
- If you use the `defaultSource` prop on the `<Image />` component from `react-native`, your app will crash. Removing that prop resolves the issue.
- When using the new manifest format with Expo Go (`yarn start --force-manifest-type=expo-updates`), the project's name will appear as "Untitled experience" in the dev menu.
- The `eas branch:publish` has an `--auto` flag, which will use the current git branch and the latest commit message and make them the EAS branch and message while publishing. This flag does not work on CI services, like GitHub Actions.
