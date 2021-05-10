---
title: '"Application has not been registered" error'
---

When developing an Expo or React Native app, it's not uncommon to run into an error that looks like:

```
Application "main" has not been registered.
```

or

```
Invariant Violation: "main" has not been registered.
```

Where "main" can be any string.

## What this error means

This error usually means that there is a mismatch between the `AppKey` being provided to [`AppRegistry.registerComponent`](https://reactnative.dev/docs/appregistry#registercomponent), and the `AppKey` being registered on the native iOS or Android side.

In Expo projects (both managed and bare workflow), the default behavior is to use "main" as the `AppKey`. If you open your `index.js` file in an Expo project (or the file defined by `main` in your `package.json`), it should look something like:

```js
import { registerRootComponent } from 'expo';
import App from './App';
registerRootComponent(App);
```

where `registerRootComponent` is implemented as:

```js
function registerRootComponent(component) {
  AppRegistry.registerComponent('main', () => component);
}
```

And on the native side, in `AppDelegate.m` you should see:

```objectivec
RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge moduleName:@"main" initialProperties:nil];
```

and in `MainActivity.java`:

```java
  @Override
  protected String getMainComponentName() {
    return "main";
  }
```

By default, "main" is consistently used throughout the project. If you're running into this error, it's likely that something has been changed and these values no longer coincide.

## How to fix it

In the managed workflow, make sure you are relying on Expo's `registerRootComponent` function since you don't have access to those native files.

In the bare workflow, ensure that the names you are registering on the JavaScript side are the ones expected on the native side (if you're using Expo's `registerRootComponent` function, that would be "main").

## Other considerations

This error can also occur in a few other scenarios, but it's less predictable and the fixes would be more specific to your project. For example, some other cases are:

- You're connecting to the wrong project's local packager. Try closing out other Expo CLI or React Native CLI processes (find them with `ps -A | grep "expo\|react-native"`).
- If this error is only occuring in your production app, then try running the app locally in production mode with `expo start --no-dev --minify` to find the source of the error.
