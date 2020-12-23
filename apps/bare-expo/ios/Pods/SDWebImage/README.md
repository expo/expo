<p align="center" >
  <img src="https://raw.githubusercontent.com/SDWebImage/SDWebImage/master/SDWebImage_logo.png" title="SDWebImage logo" float=left>
</p>


[![Build Status](http://img.shields.io/travis/SDWebImage/SDWebImage/master.svg?style=flat)](https://travis-ci.org/SDWebImage/SDWebImage)
[![Pod Version](http://img.shields.io/cocoapods/v/SDWebImage.svg?style=flat)](http://cocoadocs.org/docsets/SDWebImage/)
[![Pod Platform](http://img.shields.io/cocoapods/p/SDWebImage.svg?style=flat)](http://cocoadocs.org/docsets/SDWebImage/)
[![Pod License](http://img.shields.io/cocoapods/l/SDWebImage.svg?style=flat)](https://www.apache.org/licenses/LICENSE-2.0.html)
[![Carthage compatible](https://img.shields.io/badge/Carthage-compatible-brightgreen.svg)](https://github.com/SDWebImage/SDWebImage)
[![SwiftPM compatible](https://img.shields.io/badge/SwiftPM-compatible-brightgreen.svg)](https://swift.org/package-manager/)
[![Mac Catalyst compatible](https://img.shields.io/badge/Catalyst-compatible-brightgreen.svg)](https://developer.apple.com/documentation/xcode/creating_a_mac_version_of_your_ipad_app/)
[![codecov](https://codecov.io/gh/SDWebImage/SDWebImage/branch/master/graph/badge.svg)](https://codecov.io/gh/SDWebImage/SDWebImage)

This library provides an async image downloader with cache support. For convenience, we added categories for UI elements like `UIImageView`, `UIButton`, `MKAnnotationView`.

## Features

- [x] Categories for `UIImageView`, `UIButton`, `MKAnnotationView` adding web image and cache management
- [x] An asynchronous image downloader
- [x] An asynchronous memory + disk image caching with automatic cache expiration handling
- [x] A background image decompression to avoid frame rate drop
- [x] [Progressive image loading](https://github.com/SDWebImage/SDWebImage/wiki/Advanced-Usage#progressive-animation) (including animated image, like GIF showing in Web browser)
- [x] [Thumbnail image decoding](https://github.com/SDWebImage/SDWebImage/wiki/Advanced-Usage#thumbnail-decoding-550) to save CPU && Memory for large images
- [x] [Extendable image coder](https://github.com/SDWebImage/SDWebImage/wiki/Advanced-Usage#custom-coder-420) to support massive image format, like WebP
- [x] [Full-stack solution for animated images](https://github.com/SDWebImage/SDWebImage/wiki/Advanced-Usage#animated-image-50) which keep a balance between CPU && Memory
- [x] [Customizable and composable transformations](https://github.com/SDWebImage/SDWebImage/wiki/Advanced-Usage#transformer-50) can be applied to the images right after download
- [x] [Customizable and multiple caches system](https://github.com/SDWebImage/SDWebImage/wiki/Advanced-Usage#custom-cache-50)
- [x] [Customizable and multiple loaders system](https://github.com/SDWebImage/SDWebImage/wiki/Advanced-Usage#custom-loader-50) to expand the capabilities, like [Photos Library](https://github.com/SDWebImage/SDWebImagePhotosPlugin)
- [x] [Image loading indicators](https://github.com/SDWebImage/SDWebImage/wiki/How-to-use#use-view-indicator-50)
- [x] [Image loading transition animation](https://github.com/SDWebImage/SDWebImage/wiki/Advanced-Usage#image-transition-430)
- [x] A guarantee that the same URL won't be downloaded several times
- [x] A guarantee that bogus URLs won't be retried again and again
- [x] A guarantee that main thread will never be blocked
- [x] Modern Objective-C and better Swift support 
- [x] Performances!

## Supported Image Formats

- Image formats supported by Apple system (JPEG, PNG, TIFF, HEIC, ...), including GIF/APNG/HEIC animation
- WebP format, including animated WebP (use the [SDWebImageWebPCoder](https://github.com/SDWebImage/SDWebImageWebPCoder) project). Note iOS 14/macOS 11.0 supports built-in WebP decoding (no encoding).
- Support extendable coder plugins for new image formats like BPG, AVIF. And vector format like PDF, SVG. See all the list in [Image coder plugin List](https://github.com/SDWebImage/SDWebImage/wiki/Coder-Plugin-List)

## Additional modules and Ecosystem

In order to keep SDWebImage focused and limited to the core features, but also allow extensibility and custom behaviors, during the 5.0 refactoring we focused on modularizing the library.
As such, we have moved/built new modules to [SDWebImage org](https://github.com/SDWebImage).

#### SwiftUI
[SwiftUI](https://developer.apple.com/xcode/swiftui/) is an innovative UI framework written in Swift to build user interfaces across all Apple platforms.

We support SwiftUI by building a brand new framework called [SDWebImageSwiftUI](https://github.com/SDWebImage/SDWebImageSwiftUI), which is built on top of SDWebImage core functions (caching, loading and animation).

The new framework introduce two View structs `WebImage` and `AnimatedImage` for SwiftUI world, `ImageIndicator` modifier for any View, `ImageManager` observable object for data source. Supports iOS 13+/macOS 10.15+/tvOS 13+/watchOS 6+ and Swift 5.1. Have a nice try and provide feedback!

#### Coders for additional image formats
- [SDWebImageWebPCoder](https://github.com/SDWebImage/SDWebImageWebPCoder) - coder for WebP format. iOS 8+/macOS 10.10+. Based on [libwebp](https://chromium.googlesource.com/webm/libwebp)
- [SDWebImageHEIFCoder](https://github.com/SDWebImage/SDWebImageHEIFCoder) - coder for HEIF format, iOS 8+/macOS 10.10+ support. Based on [libheif](https://github.com/strukturag/libheif)
- [SDWebImageBPGCoder](https://github.com/SDWebImage/SDWebImageBPGCoder) - coder for BPG format. Based on [libbpg](https://github.com/mirrorer/libbpg)
- [SDWebImageFLIFCoder](https://github.com/SDWebImage/SDWebImageFLIFCoder) - coder for FLIF format. Based on [libflif](https://github.com/FLIF-hub/FLIF)
- [SDWebImageAVIFCoder](https://github.com/SDWebImage/SDWebImageAVIFCoder) - coder for AVIF (AV1-based) format. Based on [libavif](https://github.com/AOMediaCodec/libavif)
- [SDWebImagePDFCoder](https://github.com/SDWebImage/SDWebImagePDFCoder) - coder for PDF vector format. Using built-in frameworks
- [SDWebImageSVGCoder](https://github.com/SDWebImage/SDWebImageSVGCoder) - coder for SVG vector format. Using built-in frameworks
- [SDWebImageLottieCoder](https://github.com/SDWebImage/SDWebImageLottieCoder) - coder for Lottie animation format. Based on [rlottie](https://github.com/Samsung/rlottie)
- and more from community!

#### Custom Caches
- [SDWebImageYYPlugin](https://github.com/SDWebImage/SDWebImageYYPlugin) - plugin to support caching images with [YYCache](https://github.com/ibireme/YYCache)
- [SDWebImagePINPlugin](https://github.com/SDWebImage/SDWebImagePINPlugin) - plugin to support caching images with [PINCache](https://github.com/pinterest/PINCache)

#### Custom Loaders
- [SDWebImagePhotosPlugin](https://github.com/SDWebImage/SDWebImagePhotosPlugin) - plugin to support loading images from Photos (using `Photos.framework`) 
- [SDWebImageLinkPlugin](https://github.com/SDWebImage/SDWebImageLinkPlugin) - plugin to support loading images from rich link url, as well as `LPLinkView` (using `LinkPresentation.framework`) 

#### Integration with 3rd party libraries
- [SDWebImageLottiePlugin](https://github.com/SDWebImage/SDWebImageLottiePlugin) - plugin to support [Lottie-iOS](https://github.com/airbnb/lottie-ios), vector animation rending with remote JSON files
- [SDWebImageSVGKitPlugin](https://github.com/SDWebImage/SDWebImageLottiePlugin) - plugin to support [SVGKit](https://github.com/SVGKit/SVGKit), SVG rendering using Core Animation, iOS 8+/macOS 10.10+ support
- [SDWebImageFLPlugin](https://github.com/SDWebImage/SDWebImageFLPlugin) - plugin to support [FLAnimatedImage](https://github.com/Flipboard/FLAnimatedImage) as the engine for animated GIFs
- [SDWebImageYYPlugin](https://github.com/SDWebImage/SDWebImageYYPlugin) - plugin to integrate [YYImage](https://github.com/ibireme/YYImage) & [YYCache](https://github.com/ibireme/YYCache) for image rendering & caching

#### Community driven popular libraries
- [FirebaseUI](https://github.com/firebase/FirebaseUI-iOS) - Firebase Storage binding for query images, based on SDWebImage loader system
- [react-native-fast-image](https://github.com/DylanVann/react-native-fast-image) - React Native fast image component, based on SDWebImage Animated Image solution
- [flutter_image_compress](https://github.com/OpenFlutter/flutter_image_compress) - Flutter compresses image plugin, based on SDWebImage WebP coder plugin

#### Make our lives easier
- [libwebp-Xcode](https://github.com/SDWebImage/libwebp-Xcode) - A wrapper for [libwebp](https://chromium.googlesource.com/webm/libwebp) + an Xcode project.
- [libheif-Xcode](https://github.com/SDWebImage/libheif-Xcode) - A wrapper for [libheif](https://github.com/strukturag/libheif) + an Xcode project.
- [libavif-Xcode](https://github.com/SDWebImage/libavif-Xcode) - A wrapper for [libavif](https://github.com/AOMediaCodec/libavif) + an Xcode project.
- and more third-party C/C++ image codec libraries with CocoaPods/Carthage/SwiftPM support.

You can use those directly, or create similar components of your own, by using the customizable architecture of SDWebImage.

## Requirements

- iOS 9.0 or later
- tvOS 9.0 or later
- watchOS 2.0 or later
- macOS 10.11 or later (10.15 for Catalyst)
- Xcode 11.0 or later

#### Backwards compatibility

- For iOS 8, macOS 10.10 or Xcode < 11, use [any 5.x version up to 5.9.5](https://github.com/SDWebImage/SDWebImage/releases/tag/5.9.5)
- For iOS 7, macOS 10.9 or Xcode < 8, use [any 4.x version up to 4.4.6](https://github.com/SDWebImage/SDWebImage/releases/tag/4.4.6)
- For macOS 10.8, use [any 4.x version up to 4.3.0](https://github.com/SDWebImage/SDWebImage/releases/tag/4.3.0)
- For iOS 5 and 6, use [any 3.x version up to 3.7.6](https://github.com/SDWebImage/SDWebImage/tag/3.7.6)
- For iOS < 5.0, please use the last [2.0 version](https://github.com/SDWebImage/SDWebImage/tree/2.0-compat).

## Getting Started

- Read this Readme doc
- Read the [How to use section](https://github.com/SDWebImage/SDWebImage#how-to-use)
- Read the [Latest Documentation](https://sdwebimage.github.io/) and [CocoaDocs for old version](http://cocoadocs.org/docsets/SDWebImage/)
- Try the example by downloading the project from Github or even easier using CocoaPods try `pod try SDWebImage`
- Read the [Installation Guide](https://github.com/SDWebImage/SDWebImage/wiki/Installation-Guide)
- Read the [SDWebImage 5.0 Migration Guide](https://github.com/SDWebImage/SDWebImage/blob/master/Docs/SDWebImage-5.0-Migration-guide.md) to get an idea of the changes from 4.x to 5.x
- Read the [SDWebImage 4.0 Migration Guide](https://github.com/SDWebImage/SDWebImage/blob/master/Docs/SDWebImage-4.0-Migration-guide.md) to get an idea of the changes from 3.x to 4.x
- Read the [Common Problems](https://github.com/SDWebImage/SDWebImage/wiki/Common-Problems) to find the solution for common problems 
- Go to the [Wiki Page](https://github.com/SDWebImage/SDWebImage/wiki) for more information such as [Advanced Usage](https://github.com/SDWebImage/SDWebImage/wiki/Advanced-Usage)

## Who Uses It
- Find out [who uses SDWebImage](https://github.com/SDWebImage/SDWebImage/wiki/Who-Uses-SDWebImage) and add your app to the list.

## Communication

- If you **need help**, use [Stack Overflow](http://stackoverflow.com/questions/tagged/sdwebimage). (Tag 'sdwebimage')
- If you'd like to **ask a general question**, use [Stack Overflow](http://stackoverflow.com/questions/tagged/sdwebimage).
- If you **found a bug**, open an issue.
- If you **have a feature request**, open an issue.
- If you **need IRC channel**, use [Gitter](https://gitter.im/SDWebImage/community).

## Contribution

- If you **want to contribute**, read the [Contributing Guide](https://github.com/SDWebImage/SDWebImage/blob/master/.github/CONTRIBUTING.md)
- For **development contribution guide**, read the [How-To-Contribute](https://github.com/SDWebImage/SDWebImage/wiki/How-to-Contribute)
- For **understanding code architecture**, read the [Code Architecture Analysis](https://github.com/SDWebImage/SDWebImage/wiki/5.6-Code-Architecture-Analysis)

## How To Use

* Objective-C

```objective-c
#import <SDWebImage/SDWebImage.h>
...
[imageView sd_setImageWithURL:[NSURL URLWithString:@"http://www.domain.com/path/to/image.jpg"]
             placeholderImage:[UIImage imageNamed:@"placeholder.png"]];
```

* Swift

```swift
import SDWebImage

imageView.sd_setImage(with: URL(string: "http://www.domain.com/path/to/image.jpg"), placeholderImage: UIImage(named: "placeholder.png"))
```

- For details about how to use the library and clear examples, see [The detailed How to use](https://github.com/SDWebImage/SDWebImage/blob/master/Docs/HowToUse.md)

## Animated Images (GIF) support

In 5.0, we introduced a brand new mechanism for supporting animated images. This includes animated image loading, rendering, decoding, and also supports customizations (for advanced users).

This animated image solution is available for `iOS`/`tvOS`/`macOS`. The `SDAnimatedImage` is subclass of `UIImage/NSImage`, and `SDAnimatedImageView` is subclass of `UIImageView/NSImageView`, to make them compatible with the common frameworks APIs.

The `SDAnimatedImageView` supports the familiar image loading category methods, works like drop-in replacement for `UIImageView/NSImageView`.

Don't have UIView (like WatchKit or CALayer)? you can still use `SDAnimatedPlayer` the player engine for advanced playback and rendering.

See [Animated Image](https://github.com/SDWebImage/SDWebImage/wiki/Advanced-Usage#animated-image-50) for more detailed information.

* Objective-C

```objective-c
SDAnimatedImageView *imageView = [SDAnimatedImageView new];
SDAnimatedImage *animatedImage = [SDAnimatedImage imageNamed:@"image.gif"];
imageView.image = animatedImage;
```

* Swift

```swift
let imageView = SDAnimatedImageView()
let animatedImage = SDAnimatedImage(named: "image.gif")
imageView.image = animatedImage
```

#### FLAnimatedImage integration has its own dedicated repo
In order to clean up things and make our core project do less things, we decided that the `FLAnimatedImage` integration does not belong here. From 5.0, this will still be available, but under a dedicated repo [SDWebImageFLPlugin](https://github.com/SDWebImage/SDWebImageFLPlugin).

## Installation

There are four ways to use SDWebImage in your project:
- using CocoaPods
- using Carthage
- using Swift Package Manager
- manual install (build frameworks or embed Xcode Project)

### Installation with CocoaPods

[CocoaPods](http://cocoapods.org/) is a dependency manager for Objective-C, which automates and simplifies the process of using 3rd-party libraries in your projects. See the [Get Started](http://cocoapods.org/#get_started) section for more details.

#### Podfile
```
platform :ios, '8.0'
pod 'SDWebImage', '~> 5.0'
```

##### Swift and static framework

Swift project previously have to use `use_frameworks!` to make all Pods into dynamic framework to let CocoaPods works.

However, start with `CocoaPods 1.5.0+` (with `Xcode 9+`), which supports to build both Objective-C && Swift code into static framework. You can use modular headers to use SDWebImage as static framework, without the need of `use_frameworks!`:

```
platform :ios, '8.0'
# Uncomment the next line when you want all Pods as static framework
# use_modular_headers!
pod 'SDWebImage', :modular_headers => true
```

See more on [CocoaPods 1.5.0 — Swift Static Libraries](http://blog.cocoapods.org/CocoaPods-1.5.0/)

If not, you still need to add `use_frameworks!` to use SDWebImage as dynamic framework:

```
platform :ios, '8.0'
use_frameworks!
pod 'SDWebImage'
```

#### Subspecs

There are 2 subspecs available now: `Core` and `MapKit` (this means you can install only some of the SDWebImage modules. By default, you get just `Core`, so if you need `MapKit`, you need to specify it). 

Podfile example:

```
pod 'SDWebImage/MapKit'
```

### Installation with Carthage

[Carthage](https://github.com/Carthage/Carthage) is a lightweight dependency manager for Swift and Objective-C. It leverages CocoaTouch modules and is less invasive than CocoaPods.

To install with carthage, follow the instruction on [Carthage](https://github.com/Carthage/Carthage)

Carthage users can point to this repository and use whichever generated framework they'd like: SDWebImage, SDWebImageMapKit or both.

Make the following entry in your Cartfile: `github "SDWebImage/SDWebImage"`
Then run `carthage update`
If this is your first time using Carthage in the project, you'll need to go through some additional steps as explained [over at Carthage](https://github.com/Carthage/Carthage#adding-frameworks-to-an-application).

> NOTE: At this time, Carthage does not provide a way to build only specific repository subcomponents (or equivalent of CocoaPods's subspecs). All components and their dependencies will be built with the above command. However, you don't need to copy frameworks you aren't using into your project. For instance, if you aren't using `SDWebImageMapKit`, feel free to delete that framework from the Carthage Build directory after `carthage update` completes.

### Installation with Swift Package Manager (Xcode 11+)

[Swift Package Manager](https://swift.org/package-manager/) (SwiftPM) is a tool for managing the distribution of Swift code as well as C-family dependency. From Xcode 11, SwiftPM got natively integrated with Xcode.

SDWebImage support SwiftPM from version 5.1.0. To use SwiftPM, you should use Xcode 11 to open your project. Click `File` -> `Swift Packages` -> `Add Package Dependency`, enter [SDWebImage repo's URL](https://github.com/SDWebImage/SDWebImage.git). Or you can login Xcode with your GitHub account and just type `SDWebImage` to search.

After select the package, you can choose the dependency type (tagged version, branch or commit). Then Xcode will setup all the stuff for you.

If you're a framework author and use SDWebImage as a dependency, update your `Package.swift` file:

```swift
let package = Package(
    // 5.1.0 ..< 6.0.0
    dependencies: [
        .package(url: "https://github.com/SDWebImage/SDWebImage.git", from: "5.1.0")
    ],
    // ...
)
```

### Manual Installation Guide

See more on [Manual install Guide](https://github.com/SDWebImage/SDWebImage/wiki/Installation-Guide#manual-installation-guide)

### Import headers in your source files

In the source files where you need to use the library, import the umbrella header file:

```objective-c
#import <SDWebImage/SDWebImage.h>
```

It's also recommend to use the module import syntax, available for CocoaPods(enable `modular_headers`)/Carthage/SwiftPM.

```objecitivec
@import SDWebImage;
```

### Build Project

At this point your workspace should build without error. If you are having problem, post to the Issue and the
community can help you solve it.

## Data Collection Practices
As required by the [App privacy details on the App Store](https://developer.apple.com/app-store/app-privacy-details/), here's SDWebImage's list of [Data Collection Practices](https://sdwebimage.github.io/DataCollection/index.html).

## Author
- [Olivier Poitrey](https://github.com/rs)

## Collaborators
- [Konstantinos K.](https://github.com/mythodeia)
- [Bogdan Poplauschi](https://github.com/bpoplauschi)
- [Chester Liu](https://github.com/skyline75489)
- [DreamPiggy](https://github.com/dreampiggy)
- [Wu Zhong](https://github.com/zhongwuzw)

## Credits

Thank you to all the people who have already contributed to SDWebImage.

[![Contributors](https://opencollective.com/SDWebImage/contributors.svg?width=890)](https://github.com/SDWebImage/SDWebImage/graphs/contributors)

## Licenses

All source code is licensed under the [MIT License](https://github.com/SDWebImage/SDWebImage/blob/master/LICENSE).

## Architecture

To learn about SDWebImage's architecture design for contribution, read [The Core of SDWebImage v5.6 Architecture](https://github.com/SDWebImage/SDWebImage/wiki/5.6-Code-Architecture-Analysis). Thanks @looseyi for the post and translation.

#### High Level Diagram
<p align="center" >
    <img src="https://raw.githubusercontent.com/SDWebImage/SDWebImage/master/Docs/Diagrams/SDWebImageHighLevelDiagram.jpeg" title="SDWebImage high level diagram">
</p>

#### Overall Class Diagram
<p align="center" >
    <img src="https://raw.githubusercontent.com/SDWebImage/SDWebImage/master/Docs/Diagrams/SDWebImageClassDiagram.png" title="SDWebImage overall class diagram">
</p>

#### Top Level API Diagram
<p align="center" >
    <img src="https://raw.githubusercontent.com/SDWebImage/SDWebImage/master/Docs/Diagrams/SDWebImageTopLevelClassDiagram.png" title="SDWebImage top level API diagram">
</p>

#### Main Sequence Diagram
<p align="center" >
    <img src="https://raw.githubusercontent.com/SDWebImage/SDWebImage/master/Docs/Diagrams/SDWebImageSequenceDiagram.png" title="SDWebImage sequence diagram">
</p>

#### More detailed diagrams
- [Manager API Diagram](https://raw.githubusercontent.com/SDWebImage/SDWebImage/master/Docs/Diagrams/SDWebImageManagerClassDiagram.png)
- [Coders API Diagram](https://raw.githubusercontent.com/SDWebImage/SDWebImage/master/Docs/Diagrams/SDWebImageCodersClassDiagram.png)
- [Loader API Diagram](https://raw.githubusercontent.com/SDWebImage/SDWebImage/master/Docs/Diagrams/SDWebImageLoaderClassDiagram.png)
- [Cache API Diagram](https://raw.githubusercontent.com/SDWebImage/SDWebImage/master/Docs/Diagrams/SDWebImageCacheClassDiagram.png)

