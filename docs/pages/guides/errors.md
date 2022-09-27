---
title: Error Handling
---

This guide details a few strategies for reporting and recovering from errors in your project.

## Fatal JavaScript errors

If your app encounters a fatal JavaScript error, native runtime will report the error differently depending on whether your app is in development or production.

**In Development:** If you're serving your app from [Expo CLI](/workflow/expo-cli#develop), the fatal JavaScript error will be reported to the [React Native `RedBox` API](https://reactnative.dev/docs/debugging.html#in-app-errors-and-warnings) and no other action will be taken.

**In Production:** If your published app encounters a fatal JavaScript error, the native app will immediately reload your JavaScript bundle. If the error happens very quickly after reloading, your native app will crash.

## Tracking JavaScript Errors

We recommend using [Sentry](/guides/using-sentry) to track JavaScript errors in production and configuring a [post-publish hook](/versions/latest/config/app/#postpublish) to keep your exported source maps up to date.

## Native errors

You can compile your project locally to use the first-party native debuggers (Xcode/Android Studio). To learn more, visit the [native debugging guide](/workflow/debugging#native-debugging).

Unlike the browser, there are a few circumstances where it's possible to crash the native app by writing invalid JavaScript. Usually these are in areas where it would be performance-prohibitive to add native validation to your code, e.g. the part of the React Native bridge that converts JS objects into typed native values. If you encounter an inexplicable native crash, double check that your parameters are of the right type. These types of issues can be mitigated by [using TypeScript](/guides/typescript).
