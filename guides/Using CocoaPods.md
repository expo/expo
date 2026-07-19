# Using CocoaPods

The iOS version of Expo Go (the development app available from the App Store for convenience) manages its dependencies using the [CocoaPods dependency manager](https://cocoapods.org). We found using CocoaPods easy and effective, allowing us deterministic results of the project's state managed by just a couple of plaintext files. It is actively maintained and popular across iOS development projects.

More information on why CocoaPods may be the best way to manage Objective-C/Swift dependencies in Xcode projects can be found on the Internet, e.g.:
- [“Are CocoaPods widely used in iOS development?” Quora question](https://www.quora.com/Are-Cocoapods-widely-used-in-iOS-development)
- [“Why are CocoaPods better than Git submodules for iOS development” Quora question](https://www.quora.com/Why-are-CocoaPods-better-than-Git-submodules-for-iOS-development),
- [“Why use CocoaPods?” section in “CocoaPods: What is it Good For?” article](https://www.sitepoint.com/cocoapods-good/#whyusecocoapods)
- [“What is CocoaPods?” StackOverflow question](https://stackoverflow.com/a/22261215/1123156)

Since the iOS Expo Go app uses CocoaPods, it is the workflow we regularly support, maintain, and test. The best and most genuine way we can keep things working is to use the same tools for all Expo projects. This is why we support CocoaPods as the main (and at the time of writing this guide, the only) way to install universal modules.
