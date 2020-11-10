---
title: Configuring a splash screen and app icon
---

import Video from '~/components/plugins/Video'

Before we can consider our app truly complete we need to add a splash screen and app icon. A splash screen is what users see when the app is launched, before it has loaded. The icon will be visible on the users' home screen when the app is installed, or inside of the Expo app when in development.

## Splash screen

After telling our designer that we need a 1242px width by 2436px height splash screen image (more about this in [the splash screen guide](../guides/splash-screens.md)), she gave us the following file:

<div style={{textAlign: 'center', backgroundColor: '#f5f5f5', paddingTop: 10, paddingBottom: 10}}>
<img src="/static/images/tutorial/splash.png" style={{maxWidth: 150}} />
</div>

<br />

> 🐜 **What is this? A splash screen for ants?!** No, it's just scaled down here to fit more easily on this page 😅

Save this image to the `assets` directory inside of your project and call it `splash.png` &mdash; replace the existing file. Reload your app and you should see something like this:

<Video file={"tutorial/splash-bad-color.mp4"} />

<div style={{marginTop: -20}} />

<details><summary><h4>Is the app loading too quickly for you to get a good look at the splash screen?</h4></summary>

<p>

We can make the splash screen stick around for longer by manually controlling when it is hidden, rather than the default of automatically hiding it as soon as the app is ready. In the following code, we delay hiding the splash screen for five seconds.

```js
import { SplashScreen } from 'expo';

SplashScreen.preventAutoHide();
setTimeout(SplashScreen.hide, 5000);
```

🚨 _Don't forget to remove this code when you are done testing your splash screen!_

</p>
</details>

That was pretty easy but we aren't done here yet. Notice that there is a white bar on the top of our screen (see the tap indications in the above video if you're having trouble spotting it &mdash; you may not be able to see it on your device depending on its resolution). In order to remedy this, we need to set the `backgroundColor` for our splash screen. The background color is applied to any area of the screen that isn't covered by our splash image.

### Configuring the splash screen background color

So far we have been making all of our changes to `App.js`. There are some aspects of our app that we want to configure without running our app JavaScript code and the splash screen is one of these &mdash; it is visible before the app has had a chance to load and it is hidden once the app is ready for use (unless otherwise specified).

Open up `app.json` from your project directory in your code editor and make the following change in the `splash` section:

<!-- prettier-ignore -->
```js
"splash": {
  "image": "./assets/splash.png",
  "resizeMode": "contain",
  /* @info Use #000000 (black) instead of #ffffff (white). */
  "backgroundColor": "#000000"/* @end */

},
```

This solves our problem!

<Video file={"tutorial/splash-good-color.mp4"} />

## App icon

Our designer provided us with this 1024px width x 1024px height app icon:

<div style={{textAlign: 'center', backgroundColor: '#f5f5f5', paddingTop: 10, paddingBottom: 10}}>
<img src="/static/images/tutorial/icon.png" style={{maxWidth: 150}} />
</div>

<br />
<br />

Save this image to the `assets` directory inside of your project and call it `icon.png` &mdash; replace the existing file. Reload the app. That's all you need to do! You will see the icon in various places in the Expo client, and when you do a standalone app build for submission to the stores it will be used as the icon on the users' home screens.

## We have completed our app!

Well done, you have now gone through the motions of building a simple but meaningful app that runs on iOS, Android, and web from the same codebase! We hope that this tutorial has answered some of your questions and posed many more.

The next section of the tutorial will guide you towards resources to learn more about concepts we've covered here and others we have only mentioned in passing, like standalone apps. [Continue to find out how you can learn more](../tutorial/follow-up.md).
