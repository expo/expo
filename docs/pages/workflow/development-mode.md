---
title: Development and Production Mode
old_permalink: /versions/v12.0.0/guides/development-mode.html
previous___FILE: ./up-and-running.md
next___FILE: ./configuration.md
---

import Video from '~/components/plugins/Video'

Your project will always run in one of two modes: development or production. By default, running your project locally with `expo start` runs it in development mode, whereas a published project (via `expo publish`), or any standalone apps, will run in production mode.

Production mode [minifies your code](https://www.imperva.com/learn/performance/minification/) and better represents the performance your app will have on end users' devices. Development mode includes useful warnings and gives you access to tools that make development and debugging easier. Let's look at each of these modes more in detail and learn how you can toggle between them.

## Development Mode

React Native includes some very useful tools for development: remote JavaScript debugging in Chrome, live reload, hot reloading, and an element inspector similar to the beloved inspector that you use in Chrome. If you want to see how to use those tools, see our [debugging documentation](debugging.md). Development mode also performs validations while your app is running to give you warnings if, for example, you're using a deprecated property or if you forgot to pass a required property into a component. This video shows the Element Inspector and Performance Monitor in action, on both Android and iOS simulators:

<Video file="dev-prod/devMode.mp4" />

> **This comes at a cost: your app runs slower in development mode.** You can toggle it on and off from Expo Dev Tools and Expo CLI. When you switch it, just close and re-open your app for the change to take effect. **Any time you are testing the performance of your app, be sure to disable development mode**.

### Toggling Development Mode in Expo Dev Tools

To enable development mode, make sure the "Production mode" switch is turned off:

<Video file="dev-prod/expoDevTools.mp4" />

### Toggling Development Mode in Expo CLI

In the terminal with your project running in Expo CLI (initiate this with `expo start`), press `p` to toggle production mode.

### Showing the Developer Menu

The Developer Menu gives you access to a host of features that make development and debugging much easier. Invoking it depends on the device where you are running your application:

- iOS Device: Shake the device a little bit.
- iOS Simulator: Hit `Ctrl-Cmd-Z` on a Mac in the emulator to simulate the shake gesture, or press `Cmd+D`.
- Android Device: Shake the device vertically a little bit.
- Android Emulator: Either hit `Cmd+M`, or run `adb shell input keyevent 82` in your terminal window.

## Production Mode

Production mode is most useful for two things:

- Testing your app's performance, as Development slows your app down considerably
- Catching bugs that only show up in production 🐛

The easiest way to simulate how your project will run on end users' devices is with the command

```
expo start --no-dev --minify
```

Besides running in production mode (which tells the React Native packager to set the `__DEV__` environment variable to `false`, among a few other things) the `--minify` flag will minify your app, meaning it will get rid of any unnecessary data (comments, formatting, unused code). If you're getting an error or crash in your standalone app, running your project with this command can save you a lot of time in finding the root cause.
