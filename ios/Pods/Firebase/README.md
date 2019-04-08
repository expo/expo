# Firebase APIs for iOS

Simplify your iOS development, grow your user base, and monetize more
effectively with Firebase services.

Much more information can be found at [https://firebase.google.com](https://firebase.google.com).

## Install a Firebase SDK using CocoaPods

Firebase distributes several iOS specific APIs and SDKs via CocoaPods.
You can install the CocoaPods tool on OS X by running the following command from
the terminal. Detailed information is available in the [Getting Started
guide](https://guides.cocoapods.org/using/getting-started.html#getting-started).

```
$ sudo gem install cocoapods
```

## Try out an SDK

You can try any of the SDKs with `pod try`. Run the following command and select
the SDK you are interested in when prompted:

```
$ pod try Firebase
```

Note that some SDKs may require credentials. More information is available in
the SDK-specific documentation at [https://firebase.google.com/docs/](https://firebase.google.com/docs/).

## Add a Firebase SDK to your iOS app

CocoaPods is used to install and manage dependencies in existing Xcode projects.

1.  Create an Xcode project, and save it to your local machine.
2.  Create a file named `Podfile` in your project directory. This file defines
    your project's dependencies, and is commonly referred to as a Podspec.
3.  Open `Podfile`, and add your dependencies. A simple Podspec is shown here:

    ```
    platform :ios, '8.0'
    pod 'Firebase'
    ```

4.  Save the file.

5.  Open a terminal and `cd` to the directory containing the Podfile.

    ```
    $ cd <path-to-project>/project/
    ```

6.  Run the `pod install` command. This will install the SDKs specified in the
    Podspec, along with any dependencies they may have.

    ```
    $ pod install
    ```

7.  Open your app's `.xcworkspace` file to launch Xcode. Use this file for all
    development on your app.

8.  You can also install other Firebase SDKs by adding the subspecs in the
    Podfile.

    ```
    pod 'Firebase/AdMob'
    pod 'Firebase/Analytics'
    pod 'Firebase/Auth'
    pod 'Firebase/Database'
    pod 'Firebase/DynamicLinks'
    pod 'Firebase/Firestore'
    pod 'Firebase/Functions'
    pod 'Firebase/InAppMessaging'
    pod 'Firebase/InAppMessagingDisplay'
    pod 'Firebase/Messaging'
    pod 'Firebase/MLCommon'
    pod 'Firebase/MLModelInterpreter'
    pod 'Firebase/MLNLLanguageID'
    pod 'Firebase/MLNLSmartReply'
    pod 'Firebase/MLNaturalLanguage'
    pod 'Firebase/MLVision'
    pod 'Firebase/MLVisionBarcodeModel'
    pod 'Firebase/MLVisionFaceModel'
    pod 'Firebase/MLVisionLabelModel'
    pod 'Firebase/MLVisionTextModel'
    pod 'Firebase/Performance'
    pod 'Firebase/RemoteConfig'
    pod 'Firebase/Storage'
    ```
