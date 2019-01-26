---
title: Publishing
---

import withDocumentationElements from '~/components/page-higher-order/withDocumentationElements';

export default withDocumentationElements(meta);

While you’re developing your project, you’re writing code on your
computer, and when you use XDE or exp, a server and the React Native
packager run on your machine and bundle up all your source code and make
it available from a URL. Your URL for a project you’re working on
probably looks something like this:
`exp://i3-kvb.ccheever.an-example.exp.direct:80`

`exp.direct` is a domain we use for tunneling, so that even if you’re
behind a VPN or firewall, any device on the internet that has your URL
should be able to access your project. This makes it much easier to open
your project on your phone or send it someone else you’re collaborating
with who isn’t on the same LAN.

But since the packager and server are running on your computer, if you
turn off your laptop or close XDE, you won’t be able to load your
project from that URL. "Publish" is the term we use for deploying your
project. It makes your project available at a persistent URL, for
example https://expo.io/@community/native-component-list, which can be
opened with the Expo Client app. It also uploads all of your app images,
fonts, and videos to a CDN ([read more
here](../how-expo-works/#publishingdeploying-an-expo-app-in-production)).

## How to Publish

To publish a project, click the Publish button in XDE. (It’s in the
upper right of the window.) If you're using `exp`, run
`exp publish`. No setup is required, go ahead and create a new project
and publish it without any changes and you will see that it works.

When you do this, the packager will minify all your code and generate
two versions of your code (one for iOS, one for Android) and then upload
those to a CDN. You’ll get a link like [https://exp.host/@ccheever/an-example](https://exp.host/@ccheever/an-example)
that anyone can load your project from.

Any time you want to deploy an update, hit publish again and a new
version will be available immediately to your users the next time they
open it.

## Deploying to the App Store and Play Store

When you're ready to distribute your app to end-users, you can create a
standalone app binary (an ipa or apk file) and put it in the iOS App
Store and the Google Play Store. See [Distributing Your App](../../distribution/).

The standalone app knows to look for updates at your app's published
url, and if you publish an update then the next time a user opens your
app they will automatically download the new version. These are
commonly referred to as "Over the Air" (OTA) updates, the functionality
is similar to [CodePush](https://microsoft.github.io/code-push/), but it
is built into Expo so you don't need to install anything.

To configure the way your app handles JS updates, see [Offline Support](../../guides/offline-support/).

## Limitations

### Some native configuration can't be updated by publishing

If you make any of the following changes in `app.json`, you will need to
re-build the binaries for your app for the change to take effect:

- Increment the Expo SDK Version
- Change anything under the `ios` or `android` keys
- Change your app `splash`
- Change your app `icon`
- Change your app `name`
- Change your app `scheme`
- Change your `facebookScheme`
- Change your bundled assets under `assetBundlePatterns`

### On iOS, you can't share your published link

When you publish, any Android user can open your app inside Expo Client immediately.

Due to restrictions imposed by Apple, the best way to share your published app is
to build a native binary with Expo's build service. You can use Apple TestFlight to
share the app with your testers, and you can submit it to the iTunes Store to share
more widely.

## Privacy

You can set the privacy of your project in your `app.json` configuration
file by setting the key “privacy” to either `“public”` or `“unlisted”`.

These options work similarly to the way they do on YouTube. Unlisted
project URLs will be secret unless you tell people about them or share
them. Public projects might be surfaced to other developers.
