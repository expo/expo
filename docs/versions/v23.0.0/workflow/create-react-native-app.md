---
title: Expo & "Create React Native App"
---

[Create React Native
App](https://facebook.github.io/react-native/blog/2017/03/13/introducing-create-react-native-app.html) lets you build a React Native app without any build configuration. This may sound familiar to you because Expo does this as well -- when you create a project with XDE or exp you don't have to deal with Xcode or Android Studio configuration files, it just works. This guide is intended to outline some of the key differences between Expo and CRNA (create-react-native-app).

### CRNA does not require you to have an Expo account

You can run `create-react-native-app YourAppName` and off you go. So what does not having an account mean, and what would signing up and using XDE/exp get you -- why do we require it with Expo? Having an Expo account allows you to do the following:

- Publish your project to a permanent URL, eg:
  https://expo.io/@community/reactconf2017. See [Publishing on
Expo](https://blog.expo.io/publishing-on-exponent-790493660d24#.bhtxw53ts) for more information.
- [Build binaries for app / play store distribution](../building-standalone-apps/). To do this with CRNA without using Expo, you would need to run [eject](https://github.com/react-community/create-react-native-app#npm-run-eject).

### Can you use XDE/exp on a CRNA project?

Yes! Open the project as you would any other Expo project using XDE and
exp and it will work as expected.

### What does using ExpoKit mean for a CRNA user?

If you want to add custom native code to your Expo app, you will need to [use ExpoKit](../expokit/). With CRNA, you have two options: you
can either eject to a normal React Native project, without any
dependencies on Expo, or you can eject to use ExpoKit, which will allow
you to continue using the Expo APIs. [Read more about ejecting with CRNA
here](https://github.com/react-community/create-react-native-app/blob/master/EJECTING.md).
