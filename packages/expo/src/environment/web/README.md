# Metro web runtime

The code in this directory installs the required runtime code for using Metro to bundle web apps in development. This runtime code is responsible for:

- Setting up websocket controls like 'press `r` to reload' in the Expo CLI Terminal UI in web.
- Installing Fast Refresh and sending UI events.
- Configuring hot module reloading.

Unlike `react-native` DevSupport, this does not currently configure `react-devtools-core`.

Expo Webpack users didn't need a folder like this because `@expo/webpack-config` utilized the built-in systems provided by both Webpack and Create React App -- this is suboptimal in size and doesn't implement Fast Refresh.

The [`HMRClient`](./HMRClient.ts) communicates with the [Metro runtime HMR module](https://github.com/facebook/metro/blob/main/packages/metro-runtime/src/modules/HMRClient.js) over a websocket connection. The `HMRClient` module is a fork of the [upstream `react-native` module](https://github.com/facebook/react-native/blob/main/Libraries/Utilities/HMRClient.js#L1) but web-only (code like this would typically live in `react-native-web`).
