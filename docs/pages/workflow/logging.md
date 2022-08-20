---
title: Viewing logs
---

import { Terminal } from '~/ui/components/Snippet';

Writing to the logs in an Expo app works just like in the browser: use `console.log`, `console.warn` and `console.error`. Note: we don't currently support `console.table` outside of remote debugging mode.

## Recommended: View logs with Expo tools

When you open an app that is being served from Expo CLI, the app will send logs over to the server and make them conveniently available to you.
This means that you don't need to even have your device connected to your computer to see the logs -- in fact, if someone opens the app from the other side of the world you can still see your app's logs from their device.

### Viewing logs with Expo CLI

If you use our command line tool Expo CLI, bundler logs and app logs will both automatically stream as long as your project is running. To stop your project (and end the logs stream), terminate the process with <kbd>Ctrl</kbd> + <kbd>C</kbd>.

## Optional: Manually access device logs

While it's usually not necessary, if you want to see logs for everything happening on your device, even the logs from other apps and the OS itself, you can use one of the following approaches.

### View logs for your iPhone or iPad

The following instructions apply to macOS.

- Install `libimobiledevice`:
  <Terminal cmd={["$ brew install --HEAD libimobiledevice -g"]} />
- Plug your phone in and run:
  <Terminal cmd={["$ idevicepair pair"]} />
- Press accept on your device, after that run:
  <Terminal cmd={["$ idevicesyslog"]} />

### View logs for an iOS simulator

#### Option 1: Use GUI log

- In simulator, press <kbd>Cmd ⌘</kbd> + <kbd>/</kbd>, or go to `Debug -> Open System Log`.<br />Both of these open a log window that displays all of the logs from your device, including the logs from your Expo app.

#### Option 2: Open it in terminal

- <Terminal cmd={["xcrun xctrace list devices"]} />
- Find the device / OS version that the simulator you are using.<br />Example: `iPhone 13 Pro Simulator (15.2) (197FE178-B32F-42D8-8CC2-93F449DC9C1A)`
- The part in the brackets at the end is the device code, so you can now run:
  <Terminal cmd={[
"$ tail -f ~/Library/Logs/CoreSimulator/DEVICE_CODE/system.log",
"# Example: tail -f ~/Library/Logs/CoreSimulator/197FE178-B32F-42D8-8CC2-93F449DC9C1A/system.log"
]} />

### View logs from Android device or emulator

The following instructions apply to any OS that supports Android development.

- Ensure that [USB debugging is enabled on your device](https://developer.android.com/studio/run/device#device-developer-options) (not necessary for emulator).
- Ensure Android SDK is installed, then run:
  <Terminal cmd={["$ adb logcat"]} />
