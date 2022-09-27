---
title: Create a Splash Screen
---

import ImageSpotlight from '~/components/plugins/ImageSpotlight';
import Video from '~/components/plugins/Video';
import { Terminal } from '~/ui/components/Snippet';

A splash screen, also known as a launch screen, is the first screen that a user sees when opening your app, and it stays visible while the app is loading. You can control when the splash screen disappears by using the native [SplashScreen API](/versions/latest/sdk/splash-screen).

## Customize the splash screen for your app

The default splash screen is a blank white screen, this can be customized using the `splash` key in the project's [Expo config][expo-config] (**app.json**, **app.config.js**).

### Video walkthrough

Create an app icon and splash image with the [Figma template](https://www.figma.com/community/file/1155362909441341285) and video below:

<Video url="https://youtu.be/QSNkU7v0MPc" />

### Make a splash image

The [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/foundations/layout#specifications) list the devices screen sizes. I'll go with `1242` pixels wide (width of the widest iPhone at the moment of writing) and `2436` pixels tall (height of the tallest iPhone at the moment of writing). Expo will resize the image for you depending on the size of the device, and we can specify the strategy used to resize the image with `splash.resizeMode`.

Android screen sizes vary greatly with the massive variety of devices on the market. One strategy to deal with this is to look at the most common resolutions and design around that - [you can see a list of devices and their resolutions here](https://material.io/resources/devices/). Given that we can resize and crop our splash image automatically, it looks like we can stick with our dimensions, as long as we don't depend on the splash image fitting the screen exactly. This is convenient because we can use one splash image for both iOS and Android - less for you to read in this guide and less work for you to do.

You can work off of [this Sketch template](https://github.com/expo/files/blob/b264c7f7bf2cacfbdb45640063988ab61dfbbe23/splash-template.sketch?raw=true) if you like. I did, and I changed the background color to a faint yellow and put a Noodle emoji in the middle. It's worth noting that the splash image supports transparency, although we didn't use it here.

<ImageSpotlight alt="Splash screen example" src="/static/images/splash-example.png" />

Export the image as a PNG and put it in your project directory. I'll assume it's in the **assets** directory and named **splash.png**.

### `splash.image`

Open the [Expo config][expo-config] (**app.json**, **app.config.js**) and add the following:

```diff
{
  "expo": {
+    "splash": {
+      "image": "./assets/splash.png"
+    }
  }
}
```

Now re-open the [Expo Go][expo-go] app and launch your project, you should see your new splash screen. There may be a delay before it shows up in [Expo Go][expo-go], this won't happen in custom builds, see: ["Differences between environments" below](#differences-between-environments).

> **Note**: It's required to close and re-open the [Expo Go][expo-go] app on iOS in order to see changes to the splash screen in the [Expo config][expo-config]. This is a known issue that we are working to resolve. On Android, you need to press the refresh button from the notification drawer.

### `splash.backgroundColor`

If you set a background color other than white for your splash image, you may see white border around it. This is due to the `splash.resizeMode` property and the default background color, which is `#ffffff` (white). Let's resolve this by setting the `splash.backgroundColor` to be the same as our splash image background color.

```diff
{
  "expo": {
    "splash": {
      "image": "./assets/splash.png",
+      "backgroundColor": "#FEF9B0"
    }
  }
}
```

<ImageSpotlight alt="Splash screen with background color" src="/static/images/backgroundColor-noodles.png" />

### `splash.resizeMode`

Any splash image that you provide will be resized to maintain its aspect ratio and to fit the resolution of the user's device. There are two strategies that can be used for resizing: `contain` (default) and `cover`. In both cases, the splash image is within the splash screen. These work the same as the React Native `Image` component's [`resizeMode`](/versions/latest/react-native/image/#resizemode), as demonstrated in the following diagram.

<ImageSpotlight alt="Splash screen resize mode" src="/static/images/resizeMode.png" />

Applying this to our noodles example, let's remove the `backgroundColor` and try it out:

```diff
{
  "expo": {
    "splash": {
      "image": "./assets/splash.png",
+      "resizeMode": "cover"
    }
  }
}
```

<ImageSpotlight alt="Splash screen resize mode with logo" src="/static/images/resizeMode-noodles.png" />

Notice that in the last example, we stretched the image to fill the entire width, while maintaining the aspect ratio, and so the noodles emoji ended up being larger than it was when `resizeMode` was set to `contain`. If you are still unclear about the difference between contain and cover, [this blog post describes precisely what they mean](http://blog.vjeux.com/2013/image/css-container-and-cover.html).

### Customizing the configuration for iOS and Android

Any of the splash options can be configured on a per-platform basis by nesting the configuration under the `android` or `ios` keys within **app.json** (the same as how you would customize an icon for either platform). In addition to this, certain configuration options are only available on iOS or Android.

- On iOS, you can set [ios.splash.tabletImage](../workflow/configuration.md#tabletimage) if you would like to have a different splash image on iPads.
- On Android, you can set splash images for [different device DPIs](../workflow/configuration.md#android), from `mdpi` to `xxxhdpi`.

### Using `SplashScreen` when caching assets

We recommend displaying a `SplashScreen` when [pre-loading and caching assets](/guides/preloading-and-caching-assets/#pre-loading-and-caching-assets) or fetching any data from `AsyncStorage` to set the app up using [`expo-splash-screen`](/versions/latest/sdk/splash-screen) package. You can also use this package to control the moment of splash screen visibility changes.

### Differences between environments - iOS

Your app can be opened from the [Expo Go][expo-go] app or in a standalone app, and it can be either published or in development. There are slight differences in the splash screen behavior between these environments.

<ImageSpotlight alt="iOS splash screen bechaviour" src="https://media.giphy.com/media/l378l98EI0VQdwRzy/giphy.gif" />

- **On the left**, we are in the [Expo Go][expo-go] app and loading an app that is currently in development. Notice that on the bottom of the splash screen you see an information bar that shows information relevant to preparing the JavaScript and downloading it to the device. We see an orange screen before the splash image appears, because the background color is set immediately but the image needs to be downloaded.
- **In the middle**, we are in the [Expo Go][expo-go] app and we are loading a published app. Notice that again the splash image does not appear immediately.
- **On the right**, we are in a standalone app. Notice that the splash image appears immediately.

### Splash screen API limitations on Android

Splash screen behaves in most cases exactly the same as in iOS case.

There is a slight difference when it comes down to **standalone Android applications**.
In this scenario extra attention should be paid to [`android.splash` section](../workflow/configuration.md#android) configuration inside [**app.json**](../workflow/configuration.md#android).

Depending on the `resizeMode` you will get the following behavior:

- **contain** - on Android, the splash screen API is unable to stretch/scale the splash image (see the **native** mode). As a result, the `contain` mode will initially display only the background color, and when the initial view hierarchy is mounted then `splash.image` will be displayed.
- **cover** - this mode has the limitations as **contain** for the same reasons.
- **native** - in this mode your app will be leveraging Android's ability to present a static bitmap while the application is starting up. Android (unlike iOS) does not support stretching the provided image, so the application will present the given image centered on the screen. By default `splash.image` would be used as the `xxxdpi` resource. It's up to you to provide graphics that meet your expectations and fit the screen dimension. To achieve this, use different resolutions for [different device DPIs](../workflow/configuration.md#android), from `mdpi` to `xxxhdpi`.

### Bare workflow apps

If your app does not use [Expo Prebuild](/workflow/prebuild) (formerly the _managed workflow_) to generate the native `ios` and `android` directories, then changes in the [Expo config][expo-config] will have no effect. To setup and customize your splash screen manually, refer to [this guide](https://github.com/expo/expo/tree/main/packages/expo-splash-screen#-installation-in-bare-react-native-projects).

### iOS Caching

In custom iOS builds, launch screens can sometimes remain cached between builds, making it harder to test new images. Apple recommends clearing the _derived data_ folder before rebuilding, this can be done with [Expo CLI][expo-cli] by running:

<Terminal cmd={['$ npx expo run:ios --no-build-cache']} />

Refer to Apple's guide for more on [testing launch screens](https://developer.apple.com/documentation/technotes/tn3118-debugging-your-apps-launch-screen).

[expo-go]: https://expo.dev/expo-go
[expo-cli]: /workflow/expo-cli
[expo-config]: /workflow/configuration
