---
title: Sharing your app before you ship
---

Ultimately, you will want to publish your application to the App Store and Play Store to access the opportunities for wider distribution and to provide a familiar installation process for your users.  While you are developing though, you'll want to let other members of your team and your potential users see the work in progress to gather feedback and make sure you're building a quality product.

## Expo Go

If you are using the Expo Managed workflow, you can share your application with your team through the Expo Go app.

1. Publish the latest version of your project to Expo's servers by running `expo publish`.
2. [Invite your teammate](https://expo.io/[account]/[project]/settings/members) to the Expo account that owns the project.
3. Have them [download the Expo Go app](https://expo.io/client) onto their device.
4. They'll be able to open your application from the Profile tab of their Expo Go app.


## Internal Distribution

If you want to share outside of Expo Go, Android and iOS both offer ways to install a build of your application directly on devices.

### on Android

To share your application to Android devices, you must build an APK of your project (rather than an AAB that is optimized for distribution through the Play Store), but that APK can be downloaded (from the browser, email or chat app) and installed on any Android device once the user accepts the security risk of installing an app that has not gone through Play Store review.

### Ad Hoc Distribution on iOS

Apple offers [Ad Hoc provisioning profiles](https://help.apple.com/xcode/mac/current/#/dev7ccaf4d3c) to distribute your app to test devices once they have been registered to your Apple Developer account.  This method requires a paid Apple Developer account and that account will only be able to use this method to distribute to at most 100 iPhones per year.

You will need to know the UDID (Unique Device Identifier) of each device that will install your application, which may be challenging if you are trying to share with someone who is not a developer.  Adding a new device will require a rebuild of your application. 

Setting up Ad Hoc certificates correctly can be intimidating if you haven't done it before.  If you're using [EAS Build](build/internal-distribution.md), which is optimized for Expo and React Native projects, we'll handle the time-consuming parts of setting up Ad Hoc credentials for you.

### Enterprise Distribution on iOS

If your app is only intended to be used internally and will not be distributed through the App Store, you should use Enterprise distribution.  Unlike Ad Hoc Distribution, there is no limit to the number of devices that can install your application, and you will not need manage the UDIDs of each device.  Enterprise Distribution requires membership in the more expensive Apple Developer Enterprise Program, which requires your organization to be a legal entity and go through Apple's verification process. 


## TestFlight

TestFlight is another option to distribute your application to iOS devices.  TestFlight also requires a paid Apple Developer account, but allows you to share your application with up to 10,000 users that can be invited with their email or a public link.  This method requires you to [upload your application](/submit/ios.md) to App Store Connect and wait for the automated review before you can share a build.  If you intend to ship new builds frequently, investing the time to set up Ad Hoc distribution will be worthwhile.