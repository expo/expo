---
title: How EAS Update works
---

import ImageSpotlight from '~/components/plugins/ImageSpotlight'

EAS Update is a service that allows you to deliver small bug fixes and updates to your users immediately as you work on your next app store release. Making an update available to builds involves creating a link between a build and an update.

To create a link between a build and an update, we have to make sure the update can run on the build. We also want to make sure we can create a deployment process, so that we can expose certain updates to certain builds when we're ready.

To illustrate how builds and updates interact, take a look at the following diagram:

<ImageSpotlight alt="Native and update layers diagram" src="/static/images/eas-update/layers.png" />

Builds can be thought of as two layers: a native layer that's built into the app's binary, and an update layer, that is swappable with other compatible updates. This separation allows us to ship bug fixes to builds as long as the update with the bug fix can run on the native layer inside the build.

To make sure the update can run on the build, we have to set a variety of properties so that we can be sure our builds can run our updates. This starts when we create a build of our project.

## Conceptual overview

**Creating a build**

When we're ready to create a build of our Expo project, we can run a command like `eas build` to create a build. During the build, the process will include some properties inside the build that are important for updates. They are:

- Channel: The channel is a name we can give to multiple builds to identify them easily. It is defined in **eas.json**. For instance, we may have an Android and an iOS build with a channel named "production", while we have another pair of builds with a channel named "staging". Then, we can distribute the builds with the "production" channel to the public app stores, while keeping the "staging" builds on the Play Store Internal Track and TestFlight. Later when we publish updates, we can target the builds with the "staging" channel first; then once we test our changes, we can target the builds with the "production" channel.
- Runtime version: The runtime version describes the JS–native interface defined by the native code layer that runs our app's update layer. It is defined in **app.json** or **app.config.js**. Whenever we make changes to our native code that change our app's JS–native interface, we'll need to update the runtime version.
- Platform: Every build has a platform, such as "Android" or "iOS".

If we were to make two builds with the channel named "staging" and two builds with the channel named "production", we'd end up with something like this:

<ImageSpotlight alt="Build types diagram" src="/static/images/eas-update/builds.png" />

This diagram is just an example of how you could create builds and name their channels, and where you could put those builds. Ultimately it's up to you which channel names you set and where you put those builds.

**Publishing an update**

After we've created builds, we can change the update layer of our project and publish it as an update, which will make our changes available to certain builds. For example, we could change some text inside **App.js**, and then we could publish that change as an update.

To publish an update, we can run `eas branch:publish --auto`. This command will create a local update bundle inside the **dist/** folder in our project. Once it's created an update bundle, it will upload that bundle to EAS' servers, in a database object named a _branch_. A branch has a name, and contains a list of updates, where the most recent update is the active update on the branch.

<ImageSpotlight alt="Branches with its most recent update pointed out as the active one" src="/static/images/eas-update/branch.png" />

**Matching updates and builds**

Like builds, every update on a branch includes a target runtime version and target platform. With these fields, we can make sure that an update will run on a build with something called an _update policy_. EAS' update policy is as follows:

- The platform of the build and the target platform of an update must match exactly.
- The runtime version of the build and the target runtime version of an update must match exactly.
- A channel can be linked to any branch. By default, a channel is linked to a branch of the same name.

Let's focus on that last point. Every build has a channel, and we, as developers, can link that channel to any branch, which will make its most recent compatible update available on the channel. To simplify this linking, by default we'll auto-link a channel to a branch of the same name. For instance, if we created builds with the channel named "production", we could publish updates to a branch named "production" and our builds would get the updates on a matching branch named "production", even though we did not manually link anything.

<ImageSpotlight alt={`Channel "production" linked to branch "production" by default`} src="/static/images/eas-update/default-link.png" />

While this default will work in many cases, we can always change the mapping. Say we found a bug, found it, fixed it, and published it to a branch named "production-hotfix". We could then point our builds with the channel "production" at the branch "production-hotfix":

<ImageSpotlight alt={`Channel "production" updated to be linked to branch "production-hotfix"`} src="/static/images/eas-update/custom-link.png" />

## Practical overview

Now that we're familiar with the core concepts of EAS Update, let's talk about how this process occurs. When an Expo project with the `expo-updates` library is built, we include native Android and iOS code that will check for new updates on launch. By the way, when the modules checks for an update and when it downloads it is [configurable](/config/app/#updates).

By default, the app will check for an update when it's opened according to the [Expo Update Protocol](/technical-specs/expo-updates-0/). If the app finds an update that is newer than the current update inside the app, it will download it and run it. If the app does not find a newer update, it will instead run the update that was embedded inside the app at build time.

The app downloads an update in two phases. First, it downloads the most recent update _manifest_. A manifest contains information about the update, including a list of assets that are required to run the update. Assets are things like images, JavaScript, font files, etc...

The second phase of the update is when the app downloads the assets needed to run the update. For instance, if your update contains a new image, the app will download the new image asset before running the update. To help users get updates quickly and reliably, it's important to keep our updates as small as possible.

To help in the second phase of this process, the `expo-updates` module will also only download assets that the app does not currently contain, so users will only download new assets.

If the app is able to download the manifest (phase 1) and all the required assets (phase 2) before the `fallbackToCacheTimeout` setting, then the app will run the new update immediately on launch. If the app is not able to get the manifest and assets in time, the app will continue to download the new update in the background. Then on the next launch of the app, assuming the update was fully downloaded successfully, the new update will run.

<ImageSpotlight alt="Update download timeline" src="/static/images/eas-update/process.png" />

## Wrap up

With EAS Update, we can quickly deliver small, critical bug fixes to our users and give users the best experience possible. This is set up with a build's runtime version, platform, and channel. With these three constraints, we can make an update available to a specific group of builds. This allows us to test our changes before going to production within a deployment process. Depending on how we set up our deployment process, we can optimize for speed. We can also optimize our deployments to be as safe a bug-free as possible. The deployment possibilities are vast and can match nearly any release process you prefer.
