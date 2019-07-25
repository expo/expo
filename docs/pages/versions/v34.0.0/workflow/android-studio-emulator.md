---
title: Android Studio Emulator
---

If you don't have an Android device available to test with, we recommend using the default emulator that comes with Android Studio. If you run into any problems setting it up, follow the steps in this guide.

## Step 1: Set up Android Studio's tools

- Install Android Studio 3.0+.

- Go to Preferences -> Appearance & Behavior -> System Settings -> Android SDK. Click on the "SDK Tools" tab and make sure you have at least one version of the "Android SDK Build-Tools" installed.

![Android SDK location](/static/images/android-studio-build-tools.png)

- Copy or remember the path listed in the box that says "Android SDK Location."

![Android SDK location](/static/images/android-studio-sdk-location.png)

- If you are on macOS or Linux, add the Android SDK location to your PATH using `~/.bash_profile` or `~/.bash_rc`. You can do this by adding a line like `export ANDROID_SDK=/Users/myuser/Library/Android/sdk`.

- On macOS, you will also need to add `platform-tools` to your `~/.bash_profile` or `~/.bash_rc.`, by adding a line like `export PATH=/Users/myuser/Library/Android/sdk/platform-tools:$PATH`

- Make sure that you can run `adb` from your terminal.

## Step 2: Set up a virtual device

- In Android Studio, go to Tools -> Android -> AVD Manager.

- Press the "+ Create Virtual Device" button.

![Android SDK location](/static/images/android-studio-avd-manager.png)

- Choose the type of hardware you'd like to emulate. We recommend testing against a variety of devices, but if you're unsure where to start, the newest device in the Pixel line could be a good choice.

- Select an OS version to load on the emulator (probably one of the system images in the "Recommended" tab), and download the image.

- Change any other settings you'd like, and press "Finish" to create the virtual device. You can now run this device anytime by pressing the Play button in the AVD Manager window.

#### Multiple `adb` versions

Having multiple `adb` versions on your system can result in the error `adb server version (xx) doesn't match this client (xx); killing...`

This is because the adb version on your system is different from the adb version on the android sdk platform-tools.

- Open the terminal and check the `adb` version on the system:

`$adb version`

- And from the Android SDK platform-tool directory:

`$cd ~/Android/sdk/platform-tools`

`$./adb version`

- Copy `adb` from Android SDK directory to `usr/bin` directory:

`$sudo cp ~/Android/sdk/platform-tools/adb /usr/bin`
