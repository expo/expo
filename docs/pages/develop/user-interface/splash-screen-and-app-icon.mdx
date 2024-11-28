---
title: Splash screen and app icon
description: Learn how to add a splash screen and app icon to your Expo project.
---

import { Collapsible } from '~/ui/components/Collapsible';
import { ContentSpotlight } from '~/ui/components/ContentSpotlight';
import { Terminal } from '~/ui/components/Snippet';
import { Step } from '~/ui/components/Step';
import { CODE } from '~/ui/components/Text';
import { VideoBoxLink } from '~/ui/components/VideoBoxLink';

A splash screen and an app icon are fundamental elements of a mobile app. They play an important role in the user experience and branding of the app. This guide provides steps on how to create and add them to your app.

<VideoBoxLink
  videoId="QSNkU7v0MPc"
  title="Create an App Icon and Splash Screen"
  description="See a detailed walkthrough on how to create an app icon and splash screen for an Expo project."
/>

## Splash screen

> **warning** This section uses the `splash` property from the app config. **Starting SDK 52**, using `expo-splash-screen` config plugin is recommended because using a full screen splash image on Android 12+ will not work so the following information for Android is outdated. See [`expo-splash-screen` reference](/versions/latest/sdk/splash-screen/#configuration) on how to use the config plugin and for up-to-date information.

A splash screen, also known as a launch screen, is the first screen a user sees when they open your app. It stays visible while the app is loading. You can also control the behavior of when a splash screen disappears by using the native [SplashScreen API](/versions/latest/sdk/splash-screen).

The default splash screen in an Expo project is a blank white screen. It can be customized using the [`splash`](/versions/latest/config/app/#splash) property in the project's [app config](/workflow/configuration) using the steps below.

<Step label="1">

### Create a splash screen

To create a splash image, you can use this [Figma template](https://www.figma.com/community/file/1155362909441341285). It provides a bare minimum design for an icon and splash images for Android and iOS.

<Collapsible summary="Dealing with various screen sizes for Android and iOS">

#### Android

Android screen sizes vary greatly with the massive variety of devices. See [Material Design blog post](https://material.io/blog/device-metrics) for more information on how to find the right device metrics for any screen.

#### iOS

Expo's Splash Screen API will resize the image for your app depending on the size of the device's screen. You can specify the strategy used to resize the image with [`splash.resizeMode`](/versions/latest/config/app/#resizemode). See the [Device screens and sizes specifications](https://developer.apple.com/design/human-interface-guidelines/layout#Specifications) from the iOS Human Interface Guidelines for an up-to-date list of screen sizes.

</Collapsible>

</Step>

<Step label="2">

### Export the splash image as a .png

After creating a splash screen, export it as a **.png** and save it in the **assets/images** directory. By default, Expo uses **splash.png** as the file name. If you decide to change the name of your splash screen file, make sure to use that in the next step.

> **Note:** **Currently, only .png images are supported** to use as a splash screen in an Expo project. If you use another image format, making a production build of your app will fail.

</Step>

<Step label="3">

### Add the splash screen in app config

Open the app config and add the local path as the value of [`splash.image`](/versions/latest/config/app/#image) property to point to your new splash image.

```json app.json
{
  "splash": {
    /* @info */
    "image": "./assets/images/splash.png"
    /* @end */
  }
}
```

You can test your new splash image by starting the development server with `npx expo start` and using a development build or Expo Go to preview it.

> **Note:** In development mode, when you test your new splash screen, you will notice an information bar at the bottom of the screen. It displays the information about how much of the JavaScript code is downloaded on the device when preparing your app. It doesn't appear in production apps.

</Step>

<Step label="4">

### Change the background color

If you set a background color other than white for your splash image, you may see a white border around it. This is due to the [`splash.backgroundColor`](/versions/latest/config/app/#backgroundcolor-3) property that has a default value of `#ffffff`.

You can update this property's value to match your splash image's background color. For example:

```json app.json
{
  "splash": {
    "image": "./assets/images/splash.png",
    /* @info */
    "backgroundColor": "#FEF9B0"
    /* @end */
  }
}
```

<ContentSpotlight
  alt="Splash screen with background color"
  src="/static/images/splash-screen/backgroundColor-noodles.png"
  className="max-w-[480px]"
/>

</Step>

<Step label="5">

### Resize a splash screen (optional)

Any splash image you provide gets resized to maintain its aspect ratio and fit the resolution of the user's device.

You can use two properties for resizing: `contain` (default) and `cover`. These properties work similar to the [`resizeMode`](https://reactnative.dev/docs/image/#resizemode) in React Native `<Image>`, as demonstrated below:

<ContentSpotlight
  alt="Splash screen resize mode"
  src="/static/images/splash-screen/resizeMode.png"
  className="max-w-[720px]"
/>

Applying this to an example:

```json app.json
{
  "splash": {
    "image": "./assets/images/splash.png",
    /* @info */
    "resizeMode": "cover"
    /* @end */
    "backgroundColor": "#FFFFFF"
  }
}
```

<ContentSpotlight
  alt="Splash screen resize mode with logo"
  src="/static/images/splash-screen/resizeMode-noodles.png"
/>

In the above example, the image is stretched to fill the entire width while maintaining the aspect ratio. This is why the logo on the splash image is larger when `resizeMode` is set to `contain`.

> **info** To learn more about the difference between `contain` and `cover`, see [this blog post](http://blog.vjeux.com/2013/image/css-container-and-cover.html).

</Step>

<Collapsible summary={<>Configuring <CODE>splash</CODE> properties separately for Android and iOS</>}>

You can configure any `splash` properties for a native platform using [`splash.android`](/versions/latest/config/app/#splash-2) and [`splash.ios`](/versions/latest/config/app/#splash-1) to use a platform-specific option:

- On Android, you can set splash images for [different device DPIs](/versions/latest/config/app/#mdpi) from `mdpi` to `xxxhdpi`.
- On iOS, you can set [`ios.splash.tabletImage`](/versions/latest/config/app/#tabletimage) to have a different splash image on iPads.

</Collapsible>

<Collapsible summary="Not using prebuild?">

If your app does not use [Expo Prebuild](/workflow/prebuild) (formerly the _managed workflow_) to generate the native **android** and **iOS** directories, then changes in the app config will have no effect. For more information, see [how you can customize the configuration manually](https://github.com/expo/expo/tree/main/packages/expo-splash-screen#-installation-in-bare-react-native-projects).

</Collapsible>

<Collapsible summary="Splash screen API limitations on Android">

On Android, the splash screen behaves in most cases the same as on iOS. However, there is a slight difference. In this scenario, extra attention should be paid to [`android.splash`](/versions/latest/config/app/#splash-2) section configuration inside **app.json**.

Depending on the `resizeMode` you will get the following behavior on Android:

- **contain**: The splash screen API is unable to stretch or scale the splash image. As a result, the `contain` mode will initially display only the background color, and when the initial view hierarchy is mounted then `splash.image` will be displayed.
- **cover**: This mode has the same limitations as **contain**.
- **native**: In this mode, your app will be leveraging Android's ability to present a static bitmap while the app is starting up. Android (unlike iOS) does not support stretching the provided image, so the app will present the given image centered on the screen. By default `splash.image` will be used as the `xxxdpi` resource. It's up to you to provide graphics that meet your expectations and fit the screen dimension. To achieve this, use different resolutions for [different device DPIs](/versions/latest/config/app/#mdpi) such as from `mdpi` to `xxxhdpi`.

</Collapsible>

<Collapsible summary="Troubleshooting: New splash screen not appearing on iOS">

In iOS development builds, launch screens can sometimes remain cached between builds, making it harder to test new images. Apple recommends clearing the _derived data_ folder before rebuilding, this can be done with Expo CLI by running:

<Terminal cmd={['$ npx expo run:ios --no-build-cache']} />

See [Apple's guide on testing launch screens](https://developer.apple.com/documentation/technotes/tn3118-debugging-your-apps-launch-screen) for more information.

</Collapsible>

## App icon

An app's icon is what your app users see on their device's home screen and app stores. Android and iOS have different and strict requirements.

<Step label="1">

### Create an app icon

To create an app icon, you can use this [Figma template](https://www.figma.com/community/file/1155362909441341285). It provides a bare minimum design for an icon and splash images for Android and iOS.

</Step>

<Step label="2">

### Export the icon image as a .png

After creating an app icon, export it as **.png** and save it in the **assets/images** directory. By default, Expo uses **icon.png** as the file name. If you decide to use its file name, make sure to use that in the next step.

</Step>

<Step label="3">

### Add the icon in app config

Open the app config and add the local path as the value of [`icon`](/versions/latest/config/app/#icon) property to point it to your new app icon:

```json app.json
{
  "icon": "./assets/images/icon.png"
}
```

<Collapsible summary="Custom configuration tips for Android and iOS">

#### Android

Further customization of the Android icon is possible using the [`android.adaptiveIcon`](/versions/latest/config/app/#adaptiveicon) property, which will override both of the previously mentioned settings.

The Android Adaptive Icon is formed from two separate layers &mdash; a foreground image and a background color or image. This allows the OS to mask the icon into different shapes and also supports visual effects. For Android 13 and later, the OS supports a themed app icon that uses a wallpaper and theme to determine the color set by the device's theme.

The design you provide should follow the [Android Adaptive Icon Guidelines](https://developer.android.com/develop/ui/views/launch/icon_design_adaptive) for launcher icons. You should also:

- Use **.png** files.
- Use the `android.adaptiveIcon.foregroundImage` property to specify the path to your foreground image.
- Use the `android.adaptiveIcon.monochromeImage` property to specify the path to your monochrome image.
- The default background color is white; to specify a different background color, use the `android.adaptiveIcon.backgroundColor` property. You can instead specify a background image using the `android.adaptiveIcon.backgroundImage` property. Make sure that it has the same dimensions as your foreground image.

You may also want to provide a separate icon for older Android devices that do not support Adaptive Icons. You can do so with the `android.icon` property. This single icon would be a combination of your foreground and background layers.

> See [Apple best practices](https://developer.apple.com/design/human-interface-guidelines/app-icons/#Best-practices) to ensure your icon looks professional, such as testing your icon on different wallpapers and avoiding text beside your product's wordmark. Provide an icon that's at least 512x512 pixels.

#### iOS

For iOS, your app's icon should follow the [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/app-icons/). You should also:

- Use a **.png** file.
- 1024x1024 is a good size. If you have an Expo project created using `npx create-expo-app`, [EAS Build](/build/setup/) will generate the other sizes for you. In case of a bare React Native project, generate the icons on your own. The largest size EAS Build generates is 1024x1024.
- The icon must be exactly square. For example, a 1023x1024 icon is not valid.
- Make sure the icon fills the whole square, with no rounded corners or other transparent pixels. The operating system will mask your icon when appropriate.

</Collapsible>

</Step>
