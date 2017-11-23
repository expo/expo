---
title: App Icons
---

Your app's icon is what users see on the home screen of their devices, as well as in the App Store and Play Store. This is one topic where platform differences matter, and requirements can be strict. This guide offers details on how to make sure your App Icon looks as good as possible on all devices.

## Configuring your App's Icon

The most straightforward way to provide an icon for your app is to provide the [icon](configuration.html#icon) key in `app.json`. If you want to do the minimum possible, this key alone is sufficient. However, Expo also accepts platform-specific keys under `ios.icon` and `android.icon`. If either of these exist, they will take priority over the base `icon` key on their respective platform. Most production-quality apps will probably want to provide something slightly different between iOS and Android.

## Icon Best Practices

### iOS

- The icon you use for iOS should follow the [Apple Human Interface Guidelines](https://developer.apple.com/ios/human-interface-guidelines/icons-and-images/app-icon/) for iOS Icons.
- Use a png file.
- 1024x1024 is a good size. The Expo [build service](building-standalone-apps.html) will generate the other sizes for you. The largest size it generates is 1024x1024.
- The icon must be exactly square, i.e. a 1023x1024 icon is not valid.
- Make sure the icon fills the whole square, with no rounded corners or other transparent pixels. The operating system will mask your icon when appropriate.

### Android

- Unlike iOS, the operating system will not mask your icon to any particular shape. Therefore, you may want to use transparency to provide some other shape besides a square.
- Use a png file.
- You may still want to follow some of the [Apple best practices](https://developer.apple.com/ios/human-interface-guidelines/icons-and-images/app-icon/) to ensure your icon looks professional, such as testing your icon on different wallpapers, and avoiding text besides your product's wordmark.
- Provide something that's at least 512x512 pixels. Since you already need 1024x1024 for iOS, it won't hurt to just provide that here as well.

### Expo Client and Web

- If your app contains `privacy: public` in [app.json](configuration.html), it will show up on your expo.io profile. We will mask your icon to have rounded corners in that circumstance, so if it already looks reasonable on iOS, it will probably look good here as well.