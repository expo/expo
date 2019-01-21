---
title: Android Studio Emulator
---

If you don't have an Android device available to test with, we recommend using the default emulator that comes with Android Studio. If you run into any problems setting it up, follow the steps in this guide.

## Step 1: Set up Android Studio's tools

-   Install Android Studio 3.0+.

-   Go to Preferences -> Appearance & Behavior -> System Settings -> Android SDK. Click on the "SDK Tools" tab and make sure you have at least one version of the "Android SDK Build-Tools" installed.

[![Android SDK location](/static/images/android-studio-build-tools.png)](#)

-   Copy or remember the path listed in the box that says "Android SDK Location."

[![Android SDK location](/static/images/android-studio-sdk-location.png)](#)

-   If you are on macOS or Linux, add the Android SDK location to your PATH using `~/.bash_profile` or `~/.bash_rc`. You can do this by adding a line like `export ANDROID_SDK=/Users/myuser/Library/Android/sdk`.

-   On macOS, you will also need to add `platform-tools` to your `~/.bash_profile` or `~/.bash_rc.`, by adding a line like `export PATH=/Users/myuser/Library/Android/sdk/platform-tools:$PATH`

-   Make sure that you can run `adb` from your terminal.

#### Optional: Set your path in XDE

If you use XDE, you may need to complete this step to properly integrate the Android tools.

-   Run `npm install -g exp` to install `exp` globally.

-   Then run `exp path`. This will save your `PATH` environment variable so that XDE knows where to find your Android tools.

## Step 2: Set up a virtual device

-   In Android Studio, go to Tools -> Android -> AVD Manager.

-   Press the "+ Create Virtual Device" button.

[![Android SDK location](/static/images/android-studio-avd-manager.png)](#)

-   Choose the type of hardware you'd like to emulate. We recommend testing against a variety of devices, but if you're unsure where to start, the newest device in the Pixel line could be a good choice.

-   Select an OS version to load on the emulator (probably one of the system images in the "Recommended" tab), and download the image.

-   Change any other settings you'd like, and press "Finish" to create the virtual device. You can now run this device anytime by pressing the Play button in the AVD Manager window.
