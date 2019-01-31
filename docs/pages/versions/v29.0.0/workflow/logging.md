---
title: Viewing Logs
---

import withDocumentationElements from '~/components/page-higher-order/withDocumentationElements';

export default withDocumentationElements(meta);

Writing to the logs in an Expo app works just like in the browser: use `console.log`, `console.warn` and `console.error`. Note: we don't currently support `console.table` outside of remote debugging mode.

## Recommended: View logs with Expo tools

When you open an app that is being served from XDE or exp, the app will send logs over to the server and make them conveniently available to you. This means that you don't need to even have your device connected to your computer to see the logs -- in fact, if someone opens the app from the other side of the world you can still see your app's logs from their device.

### XDE logging pane

When you open a project in XDE, the log window is split in two. Your app logs show up on the right, and the packager logs show up on the left

.![XDE window with logs](/static/images/xde-logs.png)

XDE also lets you switch between the logs for any device that has opened the app

.![XDE window with device picker selected](/static/images/xde-logs-device-picker.png)

### Viewing logs with `exp`

If you use our command line tool `exp`, packager logs and app logs will both automatically stream as long as your project is running. To stop your project (and end the logs stream), terminate the process with `ctrl+C`.

## Optional: Manually access device logs

While it's usually not necessary, if you want to see logs for everything happening on your device, even the logs from other apps and the OS itself, you can use one of the following approaches.

### View logs for an iOS simulator

#### Option 1: Use GUI log

-   In simulator, press `⌘ + /`, _or_ go to `Debug -> Open System Log` -- both of these open a log window that displays all of the logs from your device, including the logs from your Expo app.

#### Option 2: Open it in terminal

-   Run `instruments -s devices`
-   Find the device / OS version that the simulator you are using, eg: `iPhone 6s (9.2) [5083E2F9-29B4-421C-BDB5-893952F2B780]`
-   The part in the brackets at the end is the device code, so you can now do this: `tail -f ~/Library/Logs/CoreSimulator/DEVICE_CODE/system.log`, eg: `tail -f ~/Library/Logs/CoreSimulator/5083E2F9-29B4-421C-BDB5-893952F2B780/system.log`

### View logs for your iPhone

-   `brew install libimobiledevice`
-   Plug your phone in
-   `idevicepair pair`
-   Press accept on your device
-   Run `idevicesyslog`

### View logs from Android device or emulator

-   Ensure Android SDK is installed
-   Ensure that [USB debugging is enabled on your device](https://developer.android.com/studio/run/device.html#device-developer-options) (not necessary for emulator).
-   Run `adb logcat`
