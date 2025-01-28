---
title: Overview of Linking, Deep Links, Android App Links, and iOS Universal Links
sidebar_title: Overview
description: An overview of available resources to implement Linking and Deep Links in your Expo apps.
---

import { AndroidIcon } from '@expo/styleguide-icons/custom/AndroidIcon';
import { AppleIcon } from '@expo/styleguide-icons/custom/AppleIcon';
import { BookOpen02Icon } from '@expo/styleguide-icons/outline/BookOpen02Icon';

import { BoxLink } from '~/ui/components/BoxLink';
import { CODE } from '~/ui/components/Text';

## Linking

Linking allows your app to interact with incoming and outgoing URLs. In this process, the user not only gets directed to open your app, but they are taken to a specific screen (route) within the app.

### Linking strategies

There are different linking strategies you handle in your Expo app:

- Linking to other apps from your app (outgoing links)
- Linking to your app from other apps or a web browser (incoming links)
- Linking to specific content within your app (deep links)
- Redirecting links from your web domain to your app if it is installed (Android App Links and iOS Universal Links); also known as App shortcuts

> **info** **Tip:** We recommend using [Development builds](/develop/development-builds/introduction/) to test your app's linking strategies instead of Expo Go.

## Linking to other apps from your app

Linking to other apps from your app is achieved using a URL based on the target app's URL scheme. This **URL scheme** allows you to reference resources within that native app.

Your app can use a [common URL scheme](/linking/into-other-apps/#common-url-schemes) for default apps, including `https` and `http` (commonly used by web browsers like Chrome, Safari, and so on), and use JavaScript to invoke the URL that launches the corresponding native app.

<BoxLink
  title="Linking into other apps"
  description="Learn how to handle common and custom URL schemes to link other apps from your app."
  href="/linking/into-other-apps/"
  Icon={BookOpen02Icon}
/>

## Linking to your app from other apps or a web browser

[Deep Links](https://en.wikipedia.org/wiki/Deep_linking) are links to a specific URL based content inside an app or a website.

For example, by clicking an advertisement of your product, your app will open on the user's device and they can view that product's details. This product's link that the user clicked may look like:

```html
myapp://web-app.com/product
```

This link is constructed by three parts:

- **Scheme**: The URL scheme that identifies the app that should open the URL (example: `myapp://`). It can also be `https` or `http` for non-standard deep links.
- **Host**: The domain name of the app that should open the URL (example: `web-app.com`).
- **Path**: The path to the screen that should be opened (example: `/product`). If the path isn't specified, the user is taken to the home screen of the app.

<BoxLink
  title="Linking to your app"
  description="Learn how to configure custom URL schemes to create a deep link of your app."
  href="/linking/into-your-app/"
  Icon={BookOpen02Icon}
/>

## Universal linking

Both Android and iOS implement their own systems for routing web URL's to an app if the app is installed. On Android, this system is called App Links, and on iOS it is called Universal Links.

### Android App Links

Android App Links are different from [standard deep links](#linking-to-your-app-from-other-apps-or-a-web-browser) as they use regular HTTP and HTTPS schemes and are exclusive to Android devices.

This link type allows your app to always open when a user clicks the link instead of choosing between the browser or another handler from a dialog displayed on the device. If the user doesn't have your app installed, the link takes them to your app's associated website.

<BoxLink
  title="Configure Android App Links"
  description={
    <>
      Learn how to configure <CODE>intentFilters</CODE> and set up two-way association from a
      standard web URL.
    </>
  }
  href="/linking/android-app-links/"
  Icon={AndroidIcon}
/>

### iOS Universal Links

iOS Universal Links are different from [standard deep links](#linking-to-your-app-from-other-apps-or-a-web-browser) as they use regular HTTP and HTTPS schemes and are exclusive to iOS devices.

This link type allows your app to open when a user clicks an HTTP(S) link pointing to your web domain. If the user doesn't have your app installed, the link takes them to your app's associated website. You can further configure the website by displaying a banner for the user to open your app using [Apple Smart Banner](/linking/ios-universal-links/#apple-smart-banner).

<BoxLink
  title="Configure iOS Universal Links"
  description={
    <>
      Learn how to configure <CODE>associatedDomains</CODE> and set up two-way association.
    </>
  }
  href="/linking/ios-universal-links/"
  Icon={AppleIcon}
/>

## Use Expo Router to handle deep linking

To implement any of the above Linking strategies, **we recommend using** [Expo Router](/router/introduction/) since deep linking is automatically enabled for all of your app's screens.

**Benefits:**

- `Link` component from Expo Router can be used to [handle URL schemes to other apps](/linking/into-other-apps/#expo-router)
- Android App Links and iOS Universal Links require configuring runtime routing in JavaScript for the link in your app. Using Expo Router, you don't have to configure runtime routing separately since deep links for all routes are automatically enabled.
