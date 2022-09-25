---
title: Viewing logs
---

import { Terminal } from '~/ui/components/Snippet';

Writing to the logs in a React Native app works just like in the browser: use `console.log`, `console.warn` and `console.error`.

## Console logs

When you run `npx expo start` and connect a device, console logs will show up in the terminal process. These logs are sent from the runtime to Expo CLI over web sockets, meaning the results are lower fidelity than connecting dev tools directly to the engine.

You can view **high fidelity** logs and use advanced logging functions like `console.table` by creating a _development build_ with [Hermes](/guides/using-hermes), and [connecting the inspector](/guides/using-hermes#javascript-inspector-for-hermes).

## Native logs

You can view native runtime logs in Xcode and Android Studio by compiling the native app locally. Learn more in the [native debugging guide](/workflow/debugging#native-debugging).

## System logs

While it's usually not necessary, if you want to see logs for everything happening on your device, even the logs from other apps and the OS itself, you can use the following commands:

<Terminal cmd={[
"# Show system logs for an Android device with adb logcat",
"$ npx react-native log-android",
"# Show system logs for an iOS device",
"$ npx react-native log-ios",
]} />
