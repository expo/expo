---
title: App Icons
---

import Video from '~/components/plugins/Video';

Your app's icon is what users see on the home screen of their devices, as well as in the App Store and Play Store. This is one topic where platform differences matter, and requirements can be strict. This guide offers details on how to make sure your App Icon looks as good as possible on all devices.

## Configuring your App's Icon

The most straightforward way to provide an icon for your app is to provide the [icon](../workflow/configuration.md#icon) key in **app.json**. If you want to do the minimum possible, this key alone is sufficient. However, Expo also accepts platform-specific keys under `ios.icon` and `android.icon`. If either of these exist, they will take priority over the base `icon` key on their respective platform. Further customization of the Android icon is possible using the `android.adaptiveIcon` key, which will override both of the previously mentioned settings. Most production-quality apps will probably want to provide something slightly different between iOS and Android.

## Icon Best Practices

### Design

Create an app icon and splash image with the [Figma template](https://www.figma.com/community/file/1155362909441341285) and video below:

<Video url="https://youtu.be/QSNkU7v0MPc" /> 

### iOS

- The icon you use for iOS should follow the [Apple Human Interface Guidelines](https://developer.apple.com/ios/human-interface-guidelines/icons-and-images/app-icon/) for iOS Icons.
- Use a png file.
- 1024x1024 is a good size. If you have an Expo managed project, [EAS Build](/build/setup.md) will generate the other sizes for you. If you have a bare workflow project, you should generate the icons on your own. The largest size EAS Build generates is 1024x1024.
- The icon must be exactly square, i.e. a 1023x1024 icon is not valid.
- Make sure the icon fills the whole square, with no rounded corners or other transparent pixels. The operating system will mask your icon when appropriate.

### Android

- The Android Adaptive Icon is formed from two separate layers -- a foreground image and a background color or image. This allows the OS to mask the icon into different shapes and also support visual effects.
- The design you provide should follow the [Android Adaptive Icon Guidelines](https://developer.android.com/guide/practices/ui_guidelines/icon_design_adaptive) for launcher icons.
- Use png files.
- Use the `android.adaptiveIcon.foregroundImage` field in **app.json** to specify your foreground image.
- The default background color is white; to specify a different background color, use the `android.adaptiveIcon.backgroundColor` field. You can instead specify a background image using the `android.adaptiveIcon.backgroundImage` field; ensure that it has the same dimensions as your foreground image.
- You may also want to provide a separate icon for older Android devices that do not support Adaptive Icons; you can do so with the `android.icon` field. This single icon would probably be a combination of your foreground and background layers.
- You may still want to follow some of the [Apple best practices](https://developer.apple.com/ios/human-interface-guidelines/icons-and-images/app-icon/) to ensure your icon looks professional, such as testing your icon on different wallpapers, and avoiding text besides your product's wordmark.
- Provide something that's at least 512x512 pixels. Since you already need 1024x1024 for iOS, it won't hurt to just provide that here as well.

### Expo Go and Web

- If your app contains `privacy: public` in [app.json](../workflow/configuration.md), it will show up on your expo.dev profile. We will mask your icon to have rounded corners in that circumstance, so if it already looks reasonable on iOS, it will probably look good here as well.
