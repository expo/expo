---
title: Supported Expo SDK APIs
sidebar_title: Supported APIs
---

You can use any native code you like in the bare workflow; the following lists specifically address whether the Expo SDK APIs (the APIs you will find in the "API Reference" section of this documentation) are supported by the bare workflow. Some are only available in the managed workflow currently, you can [jump to those](#only-available-in-managed-workflow-currently) if you like.

Refer to the bare workflow ["Up and Running"](hello-world.md) page to learn about [installing one of these packages](hello-world.md#install-an-expo-sdk-package) and [using react-native-unimodules](hello-world.md#using-react-native-unimodules).

## Available in bare and managed workflows

The bare workflow is our way of describing the workflow where you use some of the Expo tools in a vanilla React Native app, and any of the following APIs are available in the bare workflow and therefore also in any React Native app.

- [AV](../versions/latest/sdk/av.md)
- [Accelerometer](../versions/latest/sdk/accelerometer.md)
- [Admob](../versions/latest/sdk/admob.md)
- [Amplitude](../versions/latest/sdk/amplitude.md)
- [AppAuth](../versions/latest/sdk/app-auth.md)
- [Application](../versions/latest/sdk/application.md)
- [Asset](../versions/latest/sdk/asset.md)
- [Audio](../versions/latest/sdk/audio.md)
- [AuthSession](../versions/latest/sdk/auth-session.md)
- [BackgroundFetch](../versions/latest/sdk/background-fetch.md)
- [BarCodeScanner](../versions/latest/sdk/bar-code-scanner.md)
- [Barometer](../versions/latest/sdk/barometer.md)
- [Battery](../versions/latest/sdk/battery.md)
- [BlurView](../versions/latest/sdk/blur-view.md)
- [Brightness](../versions/latest/sdk/brightness.md)
- [Calendar](../versions/latest/sdk/calendar.md)
- [Camera](../versions/latest/sdk/camera.md)
- [Cellular](../versions/latest/sdk/cellular.md)
- [Constants](../versions/latest/sdk/constants.md)
- [Contacts](../versions/latest/sdk/contacts.md)
- [Crypto](../versions/latest/sdk/crypto.md)
- [DeviceMotion](../versions/latest/sdk/devicemotion.md)
- [Device](../versions/latest/sdk/device.md)
- [DocumentPicker](../versions/latest/sdk/document-picker.md)
- [ErrorRecovery](../versions/latest/sdk/error-recovery.md)
- [FaceDetector](../versions/latest/sdk/facedetector.md)
- [Facebook](../versions/latest/sdk/facebook.md)
- [FileSystem](../versions/latest/sdk/filesystem.md)
- [Font](../versions/latest/sdk/font.md)
- [GLView](../versions/latest/sdk/gl-view.md)
- [GoogleSignIn](../versions/latest/sdk/google-sign-in.md)
- [Gyroscope](../versions/latest/sdk/gyroscope.md)
- [Haptics](../versions/latest/sdk/haptics.md)
- [ImageManipulator](../versions/latest/sdk/imagemanipulator.md)
- [ImagePicker](../versions/latest/sdk/imagepicker.md)
- [IntentLauncher](../versions/latest/sdk/intent-launcher.md)
- [KeepAwake](../versions/latest/sdk/keep-awake.md)
- [LinearGradient](../versions/latest/sdk/linear-gradient.md)
- [Linking](../versions/latest/sdk/linking.md)
- [LocalAuthentication](../versions/latest/sdk/local-authentication.md)
- [Localization](../versions/latest/sdk/localization.md)
- [Location](../versions/latest/sdk/location.md)
- [Magnetometer](../versions/latest/sdk/magnetometer.md)
- [MailComposer](../versions/latest/sdk/mail-composer.md)
- [MediaLibrary](../versions/latest/sdk/media-library.md)
- [Network](../versions/latest/sdk/network.md)
- [Notifications](../versions/latest/sdk/notifications.md)
- [Pedometer](../versions/latest/sdk/pedometer.md)
- [Permissions](../versions/latest/sdk/permissions.md)
- [Print](../versions/latest/sdk/print.md)
- [Random](../versions/latest/sdk/random.md)
- [SMS](../versions/latest/sdk/sms.md)
- [SQLite](../versions/latest/sdk/sqlite.md)
- [ScreenOrientation](../versions/latest/sdk/screen-orientation.md)
- [SecureStore](../versions/latest/sdk/securestore.md)
- [Segment](../versions/latest/sdk/segment.md)
- [Sharing](../versions/latest/sdk/sharing.md)
- [SplashScreen](../versions/latest/sdk/splash-screen.md)
- [StoreReview](../versions/latest/sdk/storereview.md)
- [TaskManager](../versions/latest/sdk/task-manager.md)
- [Updates](../versions/latest/sdk/updates.md)
- [VideoThumbnails](../versions/latest/sdk/video-thumbnails.md)
- [Video](../versions/latest/sdk/video.md)
- [WebBrowser](../versions/latest/sdk/webbrowser.md)

## Only available in the bare workflow currently

- [Branch](../versions/latest/sdk/branch.md) (\* _this only applies to Android, Branch is supported in iOS standalone builds_)
- [InAppPurchases](../versions/latest/sdk/in-app-purchases.md)

## Only available in managed workflow currently

- [AR](/versions/latest/sdk/AR/) (\* _deprecated, soon to be available only in bare_)
- [AppLoading](../versions/latest/sdk/app-loading.md) (\* _use [SplashScreen](../versions/latest/sdk/splash-screen.md)instead for same capabilities_)
