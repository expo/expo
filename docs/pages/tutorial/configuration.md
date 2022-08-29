---
title: Configure status bar, splash screen and app icon
---

import ImageSpotlight from '~/components/plugins/ImageSpotlight';
import Video from '~/components/plugins/Video';
import { Collapsible } from '~/ui/components/Collapsible';

Before considering the app fully launchable, you have to configure the status bar and add a splash screen and app icon. In this module, you will learn how to do all of that.

## Step 1: Configure the status bar

The [`expo-status-bar`](/versions/latest/sdk/status-bar/) library comes pre-installed in any Expo project created using `npx create-expo-app`. This library gives a `StatusBar` component that allows configuring the app's status bar to change the text color, background color, make it translucent, and so on.

The `StatusBar` component is already imported in the **App.js**:

```js
import { StatusBar } from 'expo-status-bar';
```

It's also mounted in the `App` component.

```js
<StatusBar style="auto" />
```

Currently, the `style` value is `auto`. It means the status bar automatically picks the text color based on the color scheme. However, you do not have different color schemes in the tutorial app. There is only one active color scheme, which represents a dark background. Change the `style` value to `light` for the status bar to be visible.

```js
<StatusBar style="light" />
```

<ImageSpotlight alt="Break down of initial layout." src="/static/images/tutorial/statusbar-example.jpg" style={{ maxWidth: 720 }} containerStyle={{ marginBottom: 0 }} />

## Step 2: Add splash screen

A splash screen is a screen that is visible before the contents of the app has had a chance to load. It hides once the app is ready for use and the content is ready to be displayed.

To add one, our designers provided us with a splash screen image. Here is the image:

<ImageSpotlight src="/static/images/tutorial/splash.png" style={{ maxWidth: 150 }} containerStyle={{ marginBottom: 0 }} />

> If you use the starter template, all assets are available at **assets/splash.png**.

You can download the above image and save it in the **assets/** folder and name **splash.png**. By default, an Expo project comes with a placeholder splash screen image. You can replace that with the image you downloaded.

Alternatively, you can also create your own splash screen. For more information on how to do that, see the [splash screen guide](/guides/splash-screens/).

After saving this image, reload your app, and you should see the splash screen image. On running the app, you will get a similar output on mobile platforms:

<Video file={"tutorial/splash-add.mp4"} />

<Collapsible summary="Is the app loading too quickly for you to get a good look at the splash screen?">

You can make the splash screen stick around for longer by manually controlling when it is hidden, rather than the default of automatically hiding it as soon as the app is ready.

First, run `npx expo install expo-splash-screen`.

Next, add the following code to delay hiding the splash screen for five seconds.

```js
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();
setTimeout(SplashScreen.hideAsync, 5000);
```

_Don't forget to remove this code when you are done testing your splash screen!_

</Collapsible>

Notice that there is a white bar on the edges on the side of the Android device in the above demo. If you're having trouble spotting it &mdash; you may not be able to see it on your device, depending on the resolution. To resolve this this, you need to set the `backgroundColor` for the splash screen. The background color is applied to any screen area that isn't covered by the splash image.

## Step 3: Configure the splash screen background color

The **App.js** is the file you have worked on so far in your Expo project to create this app. However, there are other aspects of the app that you may want to configure without running your JavaScript code. The splash screen is one of these configurations.

Open **app.json** in your project directory and make the following change in the `splash` section:

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

An app icon is a uniquely designed icon that represents your app. It is the first icon displayed to users when they install the app from the app stores. It is also the icon displayed on the user's device when the app is installed.

Our designer provided us with this 1024px width x 1024px height app icon:

<ImageSpotlight src="/static/images/tutorial/icon.png" style={{ maxWidth: 150 }} />

> If you are using the starter template, all assets are available at the **assets/icon.png**.

Save this image to the **assets** directory inside your project and call it **icon.png** to replace the existing file. Then, reload the app. You will now see the icon in various places in Expo Go, and after submitting the app build to the stores, the icon will display on a user's home screen.

Here is an example of the app icon displayed in the developer menu of the Expo Go app:

<ImageSpotlight alt="Splash screen on Developer Menu in Expo Go app." src="/static/images/tutorial/app-icon-visible.jpg" style={{ maxWidth: 250 }} containerStyle={{ marginBottom: 0 }} />

## You have completed the app!

Well done, you have now gone through the motions of building a simple but meaningful app that runs on iOS, and Android from the same codebase! We hope this tutorial has answered some of your questions and many more.

The next section of the tutorial will guide you towards resources to learn more about concepts we've covered here and others we have only mentioned in passing. [Continue to find out how you can learn more](/tutorial/follow-up).
