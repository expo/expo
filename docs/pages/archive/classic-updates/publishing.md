---
title: Publishing updates
---

import ImageSpotlight from '~/components/plugins/ImageSpotlight';

> This doc was archived in August 2022 and will not receive any further updates. Please use EAS Update instead. [Learn more](/eas-update/introduction)

While you’re developing your project, you’re writing code on your
computer, and when you use Expo CLI, a server and the Metro bundler run on your machine and bundle up all your source code and make
it available from a URL. Your URL for a project you’re working on
probably looks something like this:
`exp://i3-kvb.ccheever.an-example.exp.direct:80`

`exp.direct` is a domain we use for tunneling, so that even if you’re
behind a VPN or firewall, any device on the internet that has your URL
should be able to access your project. This makes it much easier to open
your project on your phone or send it someone else you’re collaborating
with who isn’t on the same LAN.

But since the bundler and development server are running on your computer, if you
turn off your laptop or stop Expo CLI, you won’t be able to load your
project from that URL. "Publish" is the term we use for deploying your
project. It makes your project available at a persistent URL, for
example https://expo.dev/@community/native-component-list, which can be
opened with the Expo Go app. It also uploads all of your app images,
fonts, and videos to a CDN ([read more
here](how-expo-works.md#publishingdeploying-an-expo-app-in-production)).

## How to publish

To publish a project, run `expo publish`. No setup is required, go ahead and create a new project
and publish it without any changes and you will see that it works.

When you do this, the bundler will minify all your code and generate
two versions of your code (one for iOS, one for Android) and then upload
those to a free hosting service provided by Expo. You’ll get a link like [https://exp.host/@ccheever/an-example](https://exp.host/@ccheever/an-example)
that anyone can load your project from.

If you haven't optimized your assets yet you will be prompted and asked
if you'd like to do so when you run `expo publish`. This has the same effect
as running `npx expo-optimize` and will compress all of the PNGs and JPEGs in your project.

Any time you want to deploy an update, hit publish again and a new
version will be available immediately to your users the next time they
open it.

## What version of the app will my users get?

Your users will get the most recent compatible release that was pushed to a [release channel](./release-channels). Factors that affect compatibility:

- sdkVersion (standalone apps are built to support only a single SDK version)
- platform
- releaseChannel

The following flowchart shows how we determine which release to return to a user:

<ImageSpotlight
alt="Serving Flowchart"
src="/static/images/release-channels-flowchart.png"
style={{ maxWidth: 600 }}
/>

## Deploying to the App Store and Play Store

When you're ready to distribute your app to end-users, you can create a
standalone app binary (an ipa or apk file) and put it in the iOS App
Store and the Google Play Store.

The standalone app knows to look for updates at your app's published
url, and if you publish an update then the next time a user opens your
app they will automatically download the new version.

## Uploading Assets to the CDN

In order for assets to be uploaded to the CDN, they must be explicitly required somewhere in your application's code. Conditionally requiring assets will result in the Metro bundler being unable to detect them and therefore they will not be uploaded when you publish your project.

## Limitations

### Some native configuration can't be updated by publishing

If you make any of the following changes in **app.json**, you will need to
re-build the binaries for your app for the change to take effect:

- Increment the Expo SDK Version
- Change anything under the `ios`, `android`, or `notification` keys
- Change your app `splash`
- Change your app `icon`
- Change your app `name`
- Change your app `owner`
- Change your app `scheme`
- Change your `facebookScheme`
- Change your bundled assets under `assetBundlePatterns`

Additionally, changes to keys in Firebase configuration files (google-services.json and GoogleService-Info.plist) will require re-building the binaries to take effect in the iOS or Android standalone app.

### On iOS, you can't share your published link

When you publish, any Android user can open your app inside Expo Go immediately.

Due to restrictions imposed by Apple, the best way to share your published app is
to build a native binary with Expo's build service. You can use Apple TestFlight to
share the app with your testers, and you can submit it to the iTunes Store to share
more widely.

## Privacy

You can set the privacy of your project in your **app.json** configuration
file by setting the key “privacy” to either `“public”` or `“unlisted”`.

These options work similarly to the way they do on YouTube. Unlisted
project URLs will be secret unless you tell people about them or share
them. Public projects might be surfaced to other developers.

## How do I remove a managed Expo project that I published?

The default privacy setting for managed apps is `unlisted` so nobody can find your app unless you share the link with them.

If you really want your published app to be 'unpublished', check out our guide on [Advanced Release Channels](./advanced-release-channels), which explains how to roll back.
