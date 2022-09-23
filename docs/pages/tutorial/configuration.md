---
title: Configure the status bar, splash screen, and app icon
---

import ImageSpotlight from '~/components/plugins/ImageSpotlight';
import Video from '~/components/plugins/Video';
import { Collapsible } from '~/ui/components/Collapsible';

Before considering the app fully launchable, we have to configure the status bar, add a splash screen, and add an app icon. In this chapter, we will learn how to do all of that.

## Step 1: Configure the status bar

The [`expo-status-bar`](/versions/latest/sdk/status-bar/) library comes pre-installed in every project created using `npx create-expo-app`. This library provides a `<StatusBar>` component that allows configuring the app's status bar to change the text color, background color, make it translucent, and so on.

The `<StatusBar>` component is already imported in the **App.js**:

```js
import { StatusBar } from 'expo-status-bar';
```

It's also mounted in the `<App>` component.

```js
<StatusBar style="auto" />
```

Currently, the `style` value is `auto`. It means that the status bar will automatically pick the text color based on the app’s color scheme. However, we do not have different color schemes in the tutorial app. There is only one active color scheme, which has a dark background. To make the status bar light, change the `style` value to `"light"`.

```js
<StatusBar style="light" />
```

<ImageSpotlight alt="Break down of initial layout." src="/static/images/tutorial/statusbar-example.jpg" style={{ maxWidth: 720 }} containerStyle={{ marginBottom: 0 }} />

> Read more about [configuring the status bar](https://docs.expo.dev/guides/configuring-statusbar/).

## Step 2: Add splash screen

A splash screen is a screen that is visible before the contents of the app has had a chance to load. It hides once the app is ready for use and the content is ready to be displayed.

Here is the image we are using for the splash screen in the app:

<ImageSpotlight src="/static/images/tutorial/splash.png" style={{ maxWidth: 150 }} containerStyle={{ marginBottom: 0 }} />

> If you are using the starter template, the asset is available at **assets/splash.png**.

You can download the above image and save it in the **assets/** folder and name **splash.png**. By default, an Expo project comes with a placeholder splash screen image. You can replace that with the image you downloaded.

Alternatively, you can also create your own splash screen. For more information on how to do that, see the [splash screen guide](/guides/splash-screens/).

After saving this image, reload your app, and you should see the splash screen image. On running the app, you will get a similar output on mobile platforms:

<Video file={"tutorial/splash-add.mp4"} />

<Collapsible summary="Is the app loading too quickly for you to get a good look at the splash screen?">

You can make the splash screen stick around for longer by manually controlling when it is hidden, rather than the default of automatically hiding it as soon as the app is ready.

First, run `npx expo install expo-splash-screen`.

Next, add the following code in **App.js** to delay hiding the splash screen for five seconds.

```js
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();
setTimeout(SplashScreen.hideAsync, 5000);
```

Don't forget to remove this code when you are done testing your splash screen!

</Collapsible>

Notice that there is a white bar on the edges on the side of the Android device in the above demo. If you're having trouble spotting it &mdash; you may not be able to see it on your device, depending on the resolution. To resolve this this, you need to set the `backgroundColor` for the splash screen. The background color is applied to any screen area that isn't covered by the splash image.

## Step 3: Configure the splash screen background color

We can configure the splash screen’s background color in **app.json**.

Open **app.json** and make the following change in `splash`:

<!-- prettier-ignore -->
```json
"splash": {
  "image": "./assets/splash.png",
  "resizeMode": "contain",
  /* @info Use #25292e (black) instead of the default #ffffff (white). */
  "backgroundColor": "#25292e"/* @end */

},
```

The `backgroundColor` value in the above snippet matches the background of the splash screen image.

On running the app, you will get a similar output on mobile platforms:

<Video file={"tutorial/splash-fixed.mp4"} />

## Step 4: Add an app icon

Inside the project, there’s an **icon.png** file inside **assets**. This is our app icon. It’s a 1024px by 1024px image. Eventually when we build our app for the app stores, Expo Application Services (EAS) will take this image and create optimized images for every device.

<ImageSpotlight src="/static/images/tutorial/icon.png" style={{ maxWidth: 150 }} />

You can see the icon now in various places in Expo Go. 

Here is an example of the app icon displayed in the developer menu of Expo Go:

<ImageSpotlight alt="Splash screen on Developer Menu in Expo Go app." src="/static/images/tutorial/app-icon-visible.jpg" style={{ maxWidth: 250 }} containerStyle={{ marginBottom: 0 }} />

## You have completed the app!

Well done! We built an app that runs on Android, iOS, and the web from the same codebase.

The next section of the tutorial will guide us towards resources to learn more about concepts we've covered here and others we have only mentioned in passing. [Continue to find out how you can learn more](/tutorial/follow-up).
