# Firebase iOS Open Source Development [![Build Status](https://travis-ci.org/firebase/firebase-ios-sdk.svg?branch=master)](https://travis-ci.org/firebase/firebase-ios-sdk)

This repository contains a subset of the Firebase iOS SDK source. It currently
includes FirebaseCore, FirebaseABTesting, FirebaseAuth, FirebaseDatabase,
FirebaseFirestore, FirebaseFunctions, FirebaseInstanceID, FirebaseInAppMessaging,
FirebaseInAppMessagingDisplay, FirebaseMessaging, FirebaseRemoteConfig, and
FirebaseStorage.

The repository also includes GoogleUtilities source. The
[GoogleUtilities](GoogleUtilities/README.md) pod is
a set of utilities used by Firebase and other Google products.

Firebase is an app development platform with tools to help you build, grow and
monetize your app. More information about Firebase can be found at
[https://firebase.google.com](https://firebase.google.com).

## Installation

See the three subsections for details about three different installation methods.
1. [Standard pod install](README.md#standard-pod-install)
1. [Installing from the GitHub repo](README.md#installing-from-github)
1. [Experimental Carthage](README.md#carthage-ios-only)

### Standard pod install

Go to
[https://firebase.google.com/docs/ios/setup](https://firebase.google.com/docs/ios/setup).

### Installing from GitHub

For releases starting with 5.0.0, the source for each release is also deployed
to CocoaPods master and available via standard
[CocoaPods Podfile syntax](https://guides.cocoapods.org/syntax/podfile.html#pod).

These instructions can be used to access the Firebase repo at other branches,
tags, or commits.

#### Background

See
[the Podfile Syntax Reference](https://guides.cocoapods.org/syntax/podfile.html#pod)
for instructions and options about overriding pod source locations.

#### Accessing Firebase Source Snapshots

All of the official releases are tagged in this repo and available via CocoaPods. To access a local
source snapshot or unreleased branch, use Podfile directives like the following:

To access FirebaseFirestore via a branch:
```
pod 'FirebaseCore', :git => 'https://github.com/firebase/firebase-ios-sdk.git', :branch => 'master'
pod 'FirebaseFirestore', :git => 'https://github.com/firebase/firebase-ios-sdk.git', :branch => 'master'
```

To access FirebaseMessaging via a checked out version of the firebase-ios-sdk repo do:

```
pod 'FirebaseCore', :path => '/path/to/firebase-ios-sdk'
pod 'FirebaseMessaging', :path => '/path/to/firebase-ios-sdk'
```

### Carthage (iOS only)

Instructions for the experimental Carthage distribution are at
[Carthage](Carthage.md).

### Rome

Instructions for installing binary frameworks via
[Rome](https://github.com/CocoaPods/Rome) are at [Rome](Rome.md).

## Development

To develop Firebase software in this repository, ensure that you have at least
the following software:

  * Xcode 10.1 (or later)
  * CocoaPods 1.7.2 (or later)
  * [CocoaPods generate](https://github.com/square/cocoapods-generate)

For the pod that you want to develop:

`pod gen Firebase{name here}.podspec --local-sources=./ --auto-open --platforms=ios`

Note: If the CocoaPods cache is out of date, you may need to run
`pod repo update` before the `pod gen` command.

Note: Set the `--platforms` option to `macos` or `tvos` to develop/test for
those platforms. Since 10.2, Xcode does not properly handle multi-platform
CocoaPods workspaces.

Firestore has a self contained Xcode project. See
[Firestore/README.md](Firestore/README.md).

### Development for Catalyst
* `pod gen {name here}.podspec --local-sources=./ --auto-open --platforms=ios`
* Check the Mac box in the App-iOS Build Settings
* Sign the App in the Settings Signing & Capabilities tab
* Click Pods in the Project Manager
* Add Signing to the iOS host app and unit test targets
* Select the Unit-unit scheme
* Run it to build and test

### Adding a New Firebase Pod

See [AddNewPod.md](AddNewPod.md).

### Code Formatting

To ensure that the code is formatted consistently, run the script
[./scripts/style.sh](https://github.com/firebase/firebase-ios-sdk/blob/master/scripts/style.sh)
before creating a PR.

Travis will verify that any code changes are done in a style compliant way. Install
`clang-format` and `swiftformat`.
These commands will get the right versions:

```
brew upgrade https://raw.githubusercontent.com/Homebrew/homebrew-core/e3496d9/Formula/clang-format.rb
brew upgrade https://raw.githubusercontent.com/Homebrew/homebrew-core/7963c3d/Formula/swiftformat.rb
```

Note: if you already have a newer version of these installed you may need to
`brew switch` to this version.

To update this section, find the versions of clang-format and swiftformat.rb to
match the versions in the CI failure logs
[here](https://github.com/Homebrew/homebrew-core/tree/master/Formula).

### Running Unit Tests

Select a scheme and press Command-u to build a component and run its unit tests.

#### Viewing Code Coverage

First, make sure that [xcov](https://github.com/nakiostudio/xcov) is installed with `gem install xcov`.

After running the `AllUnitTests_iOS` scheme in Xcode, execute
`xcov --workspace Firebase.xcworkspace --scheme AllUnitTests_iOS --output_directory xcov_output`
at Example/ in the terminal. This will aggregate the coverage, and you can run `open xcov_output/index.html` to see the results.

### Running Sample Apps
In order to run the sample apps and integration tests, you'll need valid
`GoogleService-Info.plist` files for those samples. The Firebase Xcode project contains dummy plist
files without real values, but can be replaced with real plist files. To get your own
`GoogleService-Info.plist` files:

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Create a new Firebase project, if you don't already have one
3. For each sample app you want to test, create a new Firebase app with the sample app's bundle
identifier (e.g. `com.google.Database-Example`)
4. Download the resulting `GoogleService-Info.plist` and replace the appropriate dummy plist file
(e.g. in [Example/Database/App/](Example/Database/App/));

Some sample apps like Firebase Messaging ([Example/Messaging/App](Example/Messaging/App)) require
special Apple capabilities, and you will have to change the sample app to use a unique bundle
identifier that you can control in your own Apple Developer account.

## Specific Component Instructions
See the sections below for any special instructions for those components.

### Firebase Auth

If you're doing specific Firebase Auth development, see
[the Auth Sample README](Example/Auth/README.md) for instructions about
building and running the FirebaseAuth pod along with various samples and tests.

### Firebase Database

To run the Database Integration tests, make your database authentication rules
[public](https://firebase.google.com/docs/database/security/quickstart).

### Firebase Storage

To run the Storage Integration tests, follow the instructions in
[FIRStorageIntegrationTests.m](Example/Storage/Tests/Integration/FIRStorageIntegrationTests.m).

#### Push Notifications

Push notifications can only be delivered to specially provisioned App IDs in the developer portal.
In order to actually test receiving push notifications, you will need to:

1. Change the bundle identifier of the sample app to something you own in your Apple Developer
account, and enable that App ID for push notifications.
2. You'll also need to
[upload your APNs Provider Authentication Key or certificate to the Firebase Console](https://firebase.google.com/docs/cloud-messaging/ios/certs)
at **Project Settings > Cloud Messaging > [Your Firebase App]**.
3. Ensure your iOS device is added to your Apple Developer portal as a test device.

#### iOS Simulator

The iOS Simulator cannot register for remote notifications, and will not receive push notifications.
In order to receive push notifications, you'll have to follow the steps above and run the app on a
physical device.

## Community Supported Efforts

We've seen an amazing amount of interest and contributions to improve the Firebase SDKs, and we are
very grateful!  We'd like to empower as many developers as we can to be able to use Firebase and
participate in the Firebase community.

### tvOS, macOS, and Catalyst
Thanks to contributions from the community, FirebaseABTesting, FirebaseAuth, FirebaseCore,
FirebaseDatabase, FirebaseMessaging, FirebaseFirestore,
FirebaseFunctions, FirebaseRemoteConfig, and FirebaseStorage now compile, run unit tests, and work on
tvOS, macOS, and Catalyst.

For tvOS, checkout the [Sample](Example/tvOSSample).

Keep in mind that macOS, Catalyst and tvOS are not officially supported by Firebase, and this
repository is actively developed primarily for iOS. While we can catch basic unit test issues with
Travis, there may be some changes where the SDK no longer works as expected on macOS or tvOS. If you
encounter this, please [file an issue](https://github.com/firebase/firebase-ios-sdk/issues).

To install, add a subset of the following to the Podfile:

```
pod 'Firebase/ABTesting'
pod 'Firebase/Auth'
pod 'Firebase/Database'
pod 'Firebase/Firestore'
pod 'Firebase/Functions'
pod 'Firebase/Messaging'
pod 'Firebase/RemoteConfig'
pod 'Firebase/Storage'
```

#### Additional Catalyst Notes

* FirebaseAuth and FirebaseMessaging require adding `Keychain Sharing Capability`
to Build Settings.
* FirebaseFirestore requires signing the
[gRPC Resource target](https://github.com/firebase/firebase-ios-sdk/issues/3500#issuecomment-518741681).

## Roadmap

See [Roadmap](ROADMAP.md) for more about the Firebase iOS SDK Open Source
plans and directions.

## Contributing

See [Contributing](CONTRIBUTING.md) for more information on contributing to the Firebase
iOS SDK.

## License

The contents of this repository is licensed under the
[Apache License, version 2.0](http://www.apache.org/licenses/LICENSE-2.0).

Your use of Firebase is governed by the
[Terms of Service for Firebase Services](https://firebase.google.com/terms/).
