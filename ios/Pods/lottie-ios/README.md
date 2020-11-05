# Lottie for iOS, macOS (and [Android](https://github.com/airbnb/lottie-android) and [React Native](https://github.com/airbnb/lottie-react-native))
[![Version](https://img.shields.io/cocoapods/v/lottie-ios.svg?style=flat)](https://cocoapods.org/pods/lottie-ios)[![License](https://img.shields.io/cocoapods/l/lottie-ios.svg?style=flat)](https://cocoapods.org/pods/lottie-ios)[![Platform](https://img.shields.io/cocoapods/p/lottie-ios.svg?style=flat)](https://cocoapods.org/pods/lottie-ios)

# View documentation, FAQ, help, examples, and more at [airbnb.io/lottie](http://airbnb.io/lottie/)

Lottie is a mobile library for Android and iOS that natively renders vector based animations and art in realtime with minimal code.

Lottie loads and renders animations and vectors exported in the bodymovin JSON format. Bodymovin JSON can be created and exported from After Effects with [bodymovin](https://github.com/bodymovin/bodymovin), Sketch with [Lottie Sketch Export](https://github.com/buba447/Lottie-Sketch-Export), and from [Haiku](https://www.haiku.ai). 

For the first time, designers can create **and ship** beautiful animations without an engineer painstakingly recreating it by hand.
Since the animation is backed by JSON they are extremely small in size but can be large in complexity!
Animations can be played, resized, looped, sped up, slowed down, reversed, and even interactively scrubbed.
Lottie can play or loop just a portion of the animation as well, the possibilities are endless!
Animations can even be ***changed at runtime*** in various ways! Change the color, position or any keyframable value!
Lottie also supports native UIViewController Transitions out of the box!

Here is just a small sampling of the power of Lottie

![Example1](_Gifs/Examples1.gif)
![Example2](_Gifs/Examples2.gif)

<img src="_Gifs/Community 2_3.gif" />

![Example3](_Gifs/Examples3.gif)

![Abcs](_Gifs/Examples4.gif)

## Installing Lottie
Lottie supports [CocoaPods](https://cocoapods.org/) and [Carthage](https://github.com/Carthage/Carthage) (Both dynamic and static). Lottie is written in ***Swift 4.2***.
### Github Repo

You can pull the [Lottie Github Repo](https://github.com/airbnb/lottie-ios/) and include the Lottie.xcodeproj to build a dynamic or static library.

### CocoaPods
Add the pod to your Podfile:
```ruby
pod 'lottie-ios'
```

And then run:
```ruby
pod install
```
After installing the cocoapod into your project import Lottie with 
```swift
import Lottie
```
### Carthage
Add Lottie to your Cartfile:
```
github "airbnb/lottie-ios" "master"
```

And then run:
```
carthage update
```
In your application targets “General” tab under the “Linked Frameworks and Libraries” section, drag and drop lottie-ios.framework from the Carthage/Build/iOS directory that `carthage update` produced.

### Swift Package Manager
``` swift
// swift-tools-version:5.1

import PackageDescription

let package = Package(
  name: "YourTestProject",
  platforms: [
       .iOS(.v12),
  ],
  dependencies: [
    .package(url: "https://github.com/airbnb/lottie-ios.git", from: "3.1.2")
  ],
  targets: [
    .target(name: "YourTestProject", dependencies: ["Lottie"])
  ]
)
```
And then import wherever needed: ```import Lottie```

#### Adding it to an existent iOS Project via Swift Package Manager

1. Using Xcode 11 go to File > Swift Packages > Add Package Dependency
2. Paste the project URL: https://github.com/airbnb/lottie-ios
3. Click on next and select the project target
4. Don't forget to set `DEAD_CODE_STRIPPING = NO` in your `Build Settings` (https://bugs.swift.org/plugins/servlet/mobile#issue/SR-11564)
  **NOTE: For MacOS you must set the `Branch` field to `lottie/macos-spm`
  ![Example](_Gifs/spm-branch.png)

If you have doubts, please, check the following links:

[How to use](https://developer.apple.com/videos/play/wwdc2019/408/)

[Creating Swift Packages](https://developer.apple.com/videos/play/wwdc2019/410/)

After successfully retrieved the package and added it to your project, just import `Lottie` and you can get the full benefits of it.

### Objective-C Support

As of 3.0 Lottie has been completely rewritten in Swift! 

For Objective-C support please use Lottie 2.5.3. Alternatively an Objective-C branch exists and is still active.

The official objective c branch can be found here:

[Objective-C Branch](https://github.com/airbnb/lottie-ios/tree/lottie/objectiveC)

Also check out the documentation regarding it here: 

[iOS Migration](http://airbnb.io/lottie/#/ios-migration)
