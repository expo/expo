---
title: Supported Expo SDK APIs
sidebar_title: Supported APIs
---

You can use any native code you like in the bare workflow; the following lists specifically address whether the Expo SDK APIs (the APIs you will find in the "API Reference" section of this documentation) are supported by the bare workflow. Some are only available in the managed workflow currently, you can [jump to those](#only-available-in-managed-workflow-currently) if you like.

Refer to the bare workflow ["Up and Running"](../hello-world/) page to learn about [installing one of these packages](../hello-world/#install-an-expo-sdk-package) and [using react-native-unimodules](../hello-world/#using-react-native-unimodules).

## Available in bare and managed workflows

The bare workflow is our way of describing the workflow where you use some of the Expo tools in a vanilla React Native app, and any of the following APIs are available in the bare workflow and therefore also in any React Native app.

- [AV](/versions/latest/sdk/av/)
- [Accelerometer](/versions/latest/sdk/accelerometer/)
- [Admob](/versions/latest/sdk/admob/)
- [Amplitude](/versions/latest/sdk/amplitude/)
- [AppAuth](/versions/latest/sdk/app-auth/)
- [Application](/versions/latest/sdk/application/)
- [Asset](/versions/latest/sdk/asset/)
- [Audio](/versions/latest/sdk/audio/)
- [AuthSession](/versions/latest/sdk/auth-session/)
- [BackgroundFetch](/versions/latest/sdk/background-fetch/)
- [BarCodeScanner](/versions/latest/sdk/bar-code-scanner/)
- [Barometer](/versions/latest/sdk/barometer/)
- [Battery](/versions/latest/sdk/battery/)
- [BlurView](/versions/latest/sdk/blur-view/)
- [Brightness](/versions/latest/sdk/brightness/)
- [Calendar](/versions/latest/sdk/calendar/)
- [Camera](/versions/latest/sdk/camera/)
- [Cellular](/versions/latest/sdk/cellular/)
- [Constants](/versions/latest/sdk/constants/)
- [Contacts](/versions/latest/sdk/contacts/)
- [Crypto](/versions/latest/sdk/crypto/)
- [DeviceMotion](/versions/latest/sdk/devicemotion/)
- [Device](/versions/latest/sdk/device/)
- [DocumentPicker](/versions/latest/sdk/document-picker/)
- [ErrorRecovery](/versions/latest/sdk/error-recovery/)
- [FaceDetector](/versions/latest/sdk/facedetector/)
- [Facebook](/versions/latest/sdk/facebook/)
- [FileSystem](/versions/latest/sdk/filesystem/)
- [Font](/versions/latest/sdk/font/)
- [GLView](/versions/latest/sdk/gl-view/)
- [GoogleSignIn](/versions/latest/sdk/google-sign-in/)
- [Gyroscope](/versions/latest/sdk/gyroscope/)
- [Haptics](/versions/latest/sdk/haptics/)
- [ImageManipulator](/versions/latest/sdk/imagemanipulator/)
- [ImagePicker](/versions/latest/sdk/imagepicker/)
- [IntentLauncher](/versions/latest/sdk/intent-launcher/)
- [KeepAwake](/versions/latest/sdk/keep-awake/)
- [LinearGradient](/versions/latest/sdk/linear-gradient/)
- [Linking](/versions/latest/sdk/linking/)
- [LocalAuthentication](/versions/latest/sdk/local-authentication/)
- [Localization](/versions/latest/sdk/localization/)
- [Location](/versions/latest/sdk/location/)
- [Magnetometer](/versions/latest/sdk/magnetometer/)
- [MailComposer](/versions/latest/sdk/mail-composer/)
- [MediaLibrary](/versions/latest/sdk/media-library/)
- [Network](/versions/latest/sdk/network/)
- [Notifications](/versions/latest/sdk/notifications/)
- [Pedometer](/versions/latest/sdk/pedometer/)
- [Permissions](/versions/latest/sdk/permissions/)
- [Print](/versions/latest/sdk/print/)
- [Random](/versions/latest/sdk/random/)
- [SMS](/versions/latest/sdk/sms/)
- [SQLite](/versions/latest/sdk/sqlite/)
- [ScreenOrientation](/versions/latest/sdk/screen-orientation/)
- [SecureStore](/versions/latest/sdk/securestore/)
- [Segment](/versions/latest/sdk/segment/)
- [Sharing](/versions/latest/sdk/sharing/)
- [SplashScreen](/versions/latest/sdk/splash-screen/)
- [StoreReview](/versions/latest/sdk/storereview/)
- [TaskManager](/versions/latest/sdk/task-manager/)
- [Updates](/versions/latest/sdk/updates/)
- [VideoThumbnails](/versions/latest/sdk/video-thumbnails/)
- [Video](/versions/latest/sdk/video/)
- [WebBrowser](/versions/latest/sdk/webbrowser/)

## Only available in the bare workflow currently

- [Branch](/versions/latest/sdk/branch/) (\* _this only applies to Android, Branch is supported in iOS standalone builds_)
- [InAppPurchases](/versions/latest/sdk/in-app-purchases/)

## Only available in managed workflow currently

- [AR](/versions/latest/sdk/AR/) (\* _deprecated, soon to be available only in bare_)
- [AppLoading](/versions/latest/sdk/app-loading/) (\* _use [SplashScreen](/versions/latest/sdk/splash-screen/)instead for same capabilities_)
