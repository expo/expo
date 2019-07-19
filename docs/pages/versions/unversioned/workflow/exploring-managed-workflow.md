---
title: Managed Workflow Walkthrough
sidebar_title: Walkthrough
---

import Video from '../../../../components/plugins/Video'

If you're a top-down learner and you would like to get a high-level understanding of what it looks like to build, deploy, and update an app with the managed workflow, this is the right place for you. **Feel free to skip this if you just want to write code as quickly as possible** &mdash; [Up and Running](../up-and-running/) is for you.

## Initialize a project

Let’s get started by initializing a project, as described in [Up and Running](../up-and-running/). `expo init` gives you several options for templates, including a [TypeScript](https://www.typescriptlang.org/) template and one with [React Navigation](https://reactnavigation.org/) installed and configured with a tab-based navigation structure.

<Video file="exploring-managed/init.mp4" spaceAfter={30} />

> _Note: You may see several `peerDependencies` warnings when installing the dependencies for a new project. These are caused by some external packages having overly strict or unnecessary dependencies, and it's a work in progress to clean them up. They won't cause any harm to your project._

## Start the project

Now we just run `yarn start` (or `npm start` if you prefer that package manager) in the project directory, which delegates to `expo start`. You can also run `expo start` if you prefer! It doesn't matter at all, pick one and go with it.

<Video file="exploring-managed/start.mp4" spaceAfter />

## Open the project with the Expo client app on iOS or Android, or in your web browser

To run the app we don’t need to build any native code because it runs in the [Expo client](https://expo.io/tools#client), and the CLI will automatically install it for us in the [iOS simulator](../../workflow/ios-simulator/) or on any connected [Android emulator](../../workflow/android-studio-emulator/) or device. You can also download it from the App Store and Play Store.

<Video file="exploring-managed/open.mp4" />

<!-- The Expo client asks the server you started with `expo start` for a copy of your project (via localhost, LAN, or a tunnel), downloads it, and runs it. You can take advantage of various development tools such as [debugging](../../workflow/debugging/), [streaming device logs](../../workflow/logging/), and inspecting elements. -->

If you close the `expo-cli` or turn off your computer, you won't be able to access the app from your device anymore. We'll see how you can make it always available later on.

## Use the Expo SDK and community standard native libraries to build out native features

Let's scroll through the [API Reference](../../sdk/overview/) to find packages that provide the capabilities that we need. If we know right away that the Expo SDK doesn’t have the necessary native APIs built-in, then we should probably eject or re-initialize with the bare workflow template.

Let's say we had mockups for our app that look like the following:

<div style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10}}>
<img src="/static/images/exploring-managed/mockups.png" alt="Mockups of app screens" />
</div>

> _Note: These are actually screenshots from [Sindre Sorhus'](https://github.com/sindresorhus) open source app [Blear](https://sindresorhus.com/blear/), but let's pretend they are mockups for the sake of demonstration._

We can tell from looking at the mockups that we’ll need a camera, access to permissions, some way to apply effects to an image, and a way to access the device media library to select images and to save images to an album. We can find equivalents for this by scrolling through the API reference.

<Video file="exploring-managed/search.mp4" />

We have to start somewhere so let’s start with the `ImagePicker`. There’s a runnable example of it on the documentation page so let’s just copy that to get something running. Before pasting it into our app we will install all of the examples’ dependencies using `expo install`. `expo install` is a wrapper around npm and yarn to ensure that the version of the Expo SDK and React Native community packages that you install are compatible with your app. When we paste the code in, the app will reload and we now have a working image picker.

<Video file="exploring-managed/picker.mp4" />

At the risk of evoking the [How To Draw an Owl meme](https://knowyourmeme.com/memes/how-to-draw-an-owl), let's jump right ahead to when the app is complete. To get from where we started to here you will need to read the React and React Native documentation as needed to build parts of your app, but that's too much to cover in this particular article. Find out about learning resources [here](../../introduction/additional-resources/).

<Video file="exploring-managed/done.mp4" />

We can make a separate version of the app for web to just guide people to our app in the app stores, for when we have them up there. We can create a different entry point for the app by creating `App.web.js` and then build it there.

<Video file="exploring-managed/web.mp4" spaceAfter />

## Configure the app with `app.json`

In a managed app we don’t have the native iOS or Android projects to poke around and modify, this is managed by Expo for us. So when we want to change configuration like the icon and splash screen image we can use `app.json`.

<Video file="exploring-managed/config.mp4" spaceAfter />

## Publish and share your app

To share the app with teammates we can run `expo publish` and we’ll build the JavaScript bundle and upload all of the assets to a CDN. [Read more about publishing here](../../workflow/publishing/).

<Video file="exploring-managed/publish.mp4" spaceAfter={30} />

> _Note: Running `expo publish` will upload your app artifacts to Expo's CDN (powered by CloudFront). If you would rather host everything on your own servers, read about how to do this in [Hosting An App on Your Servers](../../distribution/hosting-your-app/)._

You may have noticed that when we ran `expo publish` the CLI warned us about optimizing assets. We can run `expo optimize` to do this, and it’ll make our assets a bit more lean if possible. Republish after this to reap the rewards.

<Video file="exploring-managed/optimize.mp4" />

Upon publishing you are given a persistent URL that you can share with colleagues, in this case it was [https://expo.io/@notbrent/blearexp](https://expo.io/@notbrent/blearexp). This is determined by your Expo account username and the `slug` field in your project `app.json`.

On iOS, you can only open projects that you have built unless you have a [priority plan](https://expo.io/developer-services), then your teammates can open your projects as well. Another option to be able to open any published managed app from within the Expo client is to do a custom build of the the Expo iOS client. [Read more about that here](../../guides/adhoc-builds/).

## Building and deploying

### iOS and the Apple App Store

Before we run the build, we need to set a `bundleIdentifier` in `app.json` (["What does bundle identifier mean?"](https://stackoverflow.com/questions/11347470/what-does-bundle-identifier-mean-in-the-ios-project)).

<Video file="exploring-managed/bundleid.mp4" />

Now when we run `expo build:ios` it will kick off a build with the Expo build service. We will be prompted to enter our Apple developer credentials, and then we’ll just hit enter a couple of times to let Expo handle the distribution certificate, push key, and provisioning profile. You can also provide all of this yourself, which you might want to do if you are moving an existing app to the managed workflow. ([Concerned about security?](../../distribution/security/))

<Video file="exploring-managed/buildios.mp4" spaceAfter={30} />

> _Note: Running `expo build:[ios/android]` uses the Expo build service &mdash; if you would rather run builds on your own infrastructure, read about how to do this in [Building Standalone Apps on Your CI](../../distribution/turtle-cli/)_

Now you can use [Application Loader](https://help.apple.com/itc/apploader/) to upload the app to App Store Connect, but we find that it’s a bit easier to run `expo upload:ios` instead. Once it's up on App Store Connect, you'll have to do some manual work within their web interface. [Read more about deploying to app stores](../../distribution/app-stores/).

<Video file="exploring-managed/uploadios.mp4" spaceAfter />

### Android and the Google Play Store

Android builds follow a similar process to iOS builds, but we are going to restrict the permissions that we need here to just the ones we use in the app because Android permissions are more static than iOS. The Android equivalent of iOS' `bundleIdentifier` is `package`.

<Video file="exploring-managed/package.mp4" />

We’ll build an [Android App Bundle (`.aab`)](https://developer.android.com/platform/technology/app-bundle) here because we want a more lean binary for the Play Store, but if you want to install the binary on a local device for testing, leave out the `--app-bundle` flag and you’ll get a `.apk` file instead.

<Video file="exploring-managed/buildandroid.mp4" />

Now we need to create the app in the Google Play Console and upload it through the web interface manually. After the first time you have uploaded the app, subsequent uploads can be done with `expo upload:android`. [Read more about deploying to app stores](../../distribution/app-stores/).

### Building and deploying to the web

Run `expo build:web` then upload the `web-build` dirctory to any host capable of serving static files.

<Video file="exploring-managed/buildweb.mp4" spaceAfter />

## Updating the app over the air

Once your app is out for testing or on the stores you probably don’t want to have to repeat the process again to make some small changes. In this case, we noticed that we weren’t asking for camera roll permissions before saving the image, so if you tried to save an image before picking one from the camera roll then it wouldn’t work. To ship an update, we just need to run `expo publish` again.

<Video file="exploring-managed/update.mp4" />

When we built our Android app bundle above, we told it to point to a specific Android release channel ([learn more about release channels](../../distribution/release-channels/)). To publish an update to the Android app we then need to update that release channel too.

<Video file="exploring-managed/updatechannel.mp4" />

To determine the rules for when apps will download and apply these updates, [read about configuring OTA updates](../../guides/configuring-ota-updates/).

We frequently release updates to the [Expo SDK](../../sdk/overview/). If you decide to update your app to a newer version of our SDK, copies of the older version will continue to work fine. Users will download the newest copy that their client supports.

## Sending notifications

An [in-depth guide](../../guides/push-notifications/) to setting up push notifications end-to-end from your app to server is a good place to look for more information here. To quickly demonstrate how easy it is to get something simple wired up, without introducing any complexity of a server, take a look at how we can test out notifications using the [Push notifications tool](https://expo.io/dashboard/notifications).

<Video file="exploring-managed/notify.mp4" />

<hr />

### That's it!

You are now, at a very high level, familiar with the steps you would go through to create an app with the Expo managed workflow. Continue on to [Up and Running](../up-and-running/) to get started coding!

If it turns out that the managed workflow won't be a good fit for your app because you need to add custom native code, check out the [bare workflow walkthrough](../../bare/exploring-bare-workflow/).
