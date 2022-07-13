---
title: Known issues
---

EAS Update is in "preview" meaning we may still make breaking developer-facing changes. With that, EAS Update is ready for production apps.

With our initial release of EAS Update, there are several known issues you may encounter. As we continue to iterate on EAS Update, we will address these issues.

### Known issues

- `eas update` will not create or send source maps to Sentry. This will result in less informative error reports from Sentry.
- When using the new manifest format with Expo Go, the project's name will appear as "Untitled experience" in the dev menu.
- After publishing an update, it's impossible to revert back to the build's embedded update.

Are you experiencing issues not listed above? [Contact us](https://expo.dev/contact) or join us on [Discord](https://chat.expo.dev/) in the #eas channel.
