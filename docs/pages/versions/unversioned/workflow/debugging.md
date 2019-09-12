---
title: Debugging
---

## Using a Simulator / Emulator

**There is no substitute to testing the performance and feel of your app on an actual device**, but when it comes to debugging you might have an easier time using an emulator/simulator.

Apple refers to their emulator as a "Simulator" and Google refers to theirs as an "Emulator".

### iOS

Make sure you have the latest Xcode (e.g. from the [Mac App Store](https://itunes.apple.com/us/app/xcode/id497799835?mt=12)). This includes the iOS Simulator, among several other tools.

### Android

Follow our [Android Studio emulator guide](../android-studio-emulator/) to set up the Android tools and create a virtual device to use for testing.

## Developer Menu

This menu gives you access to several functions which are useful for debugging.
It is also known as the Debug Menu.
Invoking it depends on the device where you are running your application.

### On an iOS Device

Shake the device a little bit.

### On iOS Simulator

Hit `Ctrl-Cmd-Z` on a Mac in the emulator to simulate the shake gesture, or press `Cmd+D`.

### On Android Virtual Device

Either hit `Cmd+M`, or run `adb shell input keyevent 82` in your terminal window.

## Redbox Errors and the Stack Trace

When you encounter an error during development, you will see the React Native "Redbox" error screen. When you run your app it is transformed through babel and your code will no longer look the same as it does in your editor. 

The error that is reported is exactly as it appears in the transformed/transpiled source. Under that error you will see the stack trace that tells you where the error comes from along with the line number. For example, in the following screenshot we know that the error came from the file `App.js` on line 11 and column (character) 19.

![](/static/images/redbox.png)

## Debugging Javascript

You can debug Expo apps using the Chrome debugger tools. Rather than running your app's JavaScript on your phone, it will instead run it inside of a webworker in Chrome. You can then set breakpoints, inspect variables, execute code, etc, as you would when debugging a web app.

- To ensure the best debugging experience, first change your host type in Expo Dev Tools to `LAN` or `localhost`. If you use `Tunnel` with debugging enabled, you are likely to experience so much latency that your app is unusable. While here, also ensure that `Development Mode` is checked.

![](/static/images/debugging-host.png)

- If you are using `LAN`, make sure your device is on the same wifi network as your development machine. This may not work on some public networks. `localhost` will not work for iOS unless you are in the simulator, and it only work on Android if your device is connected to your machine via usb.

- Open the app on your device, reveal the developer menu then tap on `Debug JS Remotely`. This should open up a Chrome tab with the URL `http://localhost:19001/debugger-ui`. From there, you can set breakpoints and interact through the JavaScript console. Shake the device and stop Chrome debugging when you're done.

- Line numbers for `console.log` statements don't work by default when using Chrome debugging. To get correct line numbers open up the Chrome Dev Tools settings, go to the "Blackboxing" tab, make sure that "Blackbox content scripts" is checked, and add `expo/build/logs/RemoteConsole.js` as a pattern with "Blackbox" selected.

### Troubleshooting localhost debugging

When you start a project with Expo CLI and when you press `Run on Android device/emulator` in Expo Dev Tools (or `a` in the terminal), Expo CLI will automatically tell your device to forward `localhost:19000` and `19001` to your development machine, as long as your device is plugged in or emulator is running. If you are using `localhost` for debugging and it isn't working, close the app and open it up again using `Open on Android`. Alternatively, you can manually forward the ports using the following command if you have the Android developer tools installed: `adb reverse tcp:19000 tcp:19000` - `adb reverse tcp:19001 tcp:19001`

### Source maps and async functions

Source maps and async functions aren't 100% reliable. React Native doesn't play well with Chrome's source mapping in every case, so if you want to make sure you're breakpointing in the correct place, you should use the `debugger` call directly from your code.

## Debugging HTTP

To debug your app's HTTP requests you should use a proxy. The following options will all work:

- [Charles Proxy](https://www.charlesproxy.com/documentation/configuration/browser-and-system-configuration/) ($50 USD, our preferred tool)
- [mitmproxy](https://medium.com/@rotxed/how-to-debug-http-s-traffic-on-android-7fbe5d2a34#.hnhanhyoz)
- [Fiddler](http://www.telerik.com/fiddler)

On Android, the [Proxy Settings](https://play.google.com/store/apps/details?id=com.lechucksoftware.proxy.proxysettings) app is helpful for switch between debug and non-debug mode. Unfortunately it doesn't work with Android M yet.

There is [future work](https://github.com/facebook/react-native/issues/934) to get network requests showing up in Chrome DevTools.

## Debugging Redux

[Redux](https://redux.js.org/) is a popular library for managing the state of your app that doesn't belong to any single component, and instead it shared throughout the app. [React Native Debugger](https://github.com/jhen0409/react-native-debugger) is a desktop app that combines [Redux Devtools](https://github.com/zalmoxisus/redux-devtools-extension), [React Devtools](https://github.com/facebook/react-devtools), and Chrome Devtools all in one window. These are the same tools that you would be using on the web to debug your Redux and React apps, but the set up in React Native is a little bit different:


1. Download React Native Debugger from the [releases page](https://github.com/jhen0409/react-native-debugger/releases).
2. Open the app, press `⌘+t`/`ctrl+t` to open new window, then set the port to 19001.
3. Start your app, open the in-app developer menu, and select “Debug JS Remotely.”
4. Configure `__REDUX_DEVTOOLS_EXTENSION__` as [shown here](https://github.com/zalmoxisus/redux-devtools-extension#11-basic-store).

You're now good to go! If you are experiencing any issues or want to learn more about how to use these tools, refer to this [guide](https://medium.com/@tetsuyahasegawa/how-to-integrate-react-native-debugger-to-your-expo-react-native-project-db1d631fad02).

## Hot Reloading and Live Reloading

[Hot Module Reloading](http://facebook.github.io/react-native/blog/2016/03/24/introducing-hot-reloading.html) is a quick way to reload changes without losing your state in the screen or navigation stack. To enable, invoke the developer menu and tap the "Enable Hot Reloading" item. Whereas Live Reload will reload the entire JS context, Hot Module Reloading will make your debug cycles even faster. 

> **Note**: Make sure you don't have both options turned on. Hot reloading will not work if you do.

> **Note**: In order to use Live Reload, your components must be **class** components, rather than a functional components. You can read about their differences [here](https://reactjs.org/docs/components-and-props.html#function-and-class-components).

## Other Debugging Tips

Dotan Nahum outlined in his ["Debugging React Native Applications" Medium post](https://medium.com/reactnativeacademy/debugging-react-native-applications-6bff3f28c375) other useful tools such as spying on bridge messages and JSEventLoopWatchdog.
