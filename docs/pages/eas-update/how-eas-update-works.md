---
title: How EAS Update works
---

import ImageSpotlight from '~/components/plugins/ImageSpotlight';
import { Terminal } from '~/ui/components/Snippet';

EAS Update is a service that allows you to deliver small bug fixes and updates to your users immediately as you work on your next app store release. Making an update available to builds involves creating a link between a build and an update.

To create a link between a build and an update, we have to make sure the update can run on the build. We also want to make sure we can create a deployment process so that we can expose certain updates to certain builds when we're ready.

To illustrate how builds and updates interact, take a look at the following diagram:

<ImageSpotlight alt="Native and update layers diagram" src="/static/images/eas-update/layers.png" />

Builds can be thought of as two layers: a native layer that's built into the app's binary, and an update layer, that is swappable with other compatible updates. This separation allows us to ship bug fixes to builds as long as the update with the bug fix can run on the native layer inside the build.

To make sure the update can run on the build, we have to set a variety of properties so that we can be sure our builds can run our updates. This starts when we create a build of our project.

## Conceptual overview

### Distributing builds

When we're ready to create a build of our Expo project, we can run `eas build` to create a build. During the build, the process will include some properties inside the build that are important for updates. They are:

- **Channel:** The channel is a name we can give to multiple builds to identify them easily. It is defined in `eas.json`. For instance, we may have an Android and an iOS build with a channel named "production", while we have another pair of builds with a channel named "staging". Then, we can distribute the builds with the "production" channel to the public app stores, while keeping the "staging" builds on the Play Store Internal Track and TestFlight.
  Later when we publish an update, we can make it available to the builds with the "staging" channel first; then once we test our changes, we can make the update available to the builds with the "production" channel.
- **Runtime version:** The runtime version describes the JS–native interface defined by the native code layer that runs our app's update layer. It is defined in a project's app config (`app.json`/`app.config.js`). Whenever we make changes to our native code that change our app's JS–native interface, we'll need to update the runtime version. [Learn more.](/eas-update/runtime-versions)
- **Platform:** Every build has a platform, such as "Android" or "iOS".

If we made two sets of builds with the channels named "staging" and "production", we could distribute builds to four different places:

<ImageSpotlight alt="Build types diagram" src="/static/images/eas-update/builds.png" />

This diagram is just an example of how you could create builds and name their channels, and where you could put those builds. Ultimately it's up to you which channel names you set and where you put those builds.

### Publishing an update

Once we've created builds, we can change the update layer of our project by publishing an update. For example, we could change some text inside `App.js`, then we could publish that change as an update.

To publish an update, we can run `eas update --auto`. This command will create a local update bundle inside the `./dist` folder in our project. Once it's created an update bundle, it will upload that bundle to EAS' servers, in a database object named a _branch_. A branch has a name, and contains a list of updates, where the most recent update is the active update on the branch.
We can think of EAS branches just like Git branches. Just as Git branches contain a list of commits, EAS branches contain a list of updates.

<ImageSpotlight alt="Branches with its most recent update pointed out as the active one" src="/static/images/eas-update/branch.png" />

### Matching updates and builds

Like builds, every update on a branch includes a target runtime version and target platform. With these fields, we can make sure that an update will run on a build with something called an _update policy_. EAS' update policy is as follows:

- The platform of the build and the target platform of an update must match exactly.
- The runtime version of the build and the target runtime version of an update must match exactly.
- A channel can be linked to any branch. By default, a channel is linked to a branch of the same name.

Let's focus on that last point. Every build has a channel, and we, as developers, can link that channel to any branch, which will make its most recent compatible update available on the branch to the linked channel.
To simplify this linking, by default we auto-link channels to branches of the same name. For instance, if we created builds with the channel named "production", we could publish updates to a branch named "production" and our builds would get the updates from the branch named "production", even though we did not manually link anything.

<ImageSpotlight alt={`Channel "production" linked to branch "production" by default`} src="/static/images/eas-update/default-link.png" />

This default linking works great if you have a deployment process where you have multiple consistent Git and EAS branches.
For instance, we could have a "production" branch and a "staging" branch, both on Git and on EAS. Paired with a [GitHub Action](/eas-update/github-actions), we could make it so that every time a commit is pushed to the "staging" Git branch, we publish to the "staging" EAS Update branch, which would make that update apply to all our builds with the "staging" channel.
Once we tested changes on the staging builds, then we could merge the "staging" Git branch into the "production" Git branch, which would publish an update on the "production" EAS Update branch. Finally, the latest update on the "production" EAS Update branch would apply to builds with the "production" channel.

This flow makes it so that we can push to GitHub, then see our builds update without any other interventions.

While this flow works for many developers, there's another flow we can accomplish since we have the ability to change the link between channels and branches. Imagine we name our branches like "version-1.0", "version-2.0", and "version-3.0". We could link the "version-1.0" EAS Update branch to the "production" channel, to make it available to our "production" builds.
We could also link the "version-2.0" EAS Update branch to the "staging" channel to make it available to testers. Finally, we could make a "version-3.0" EAS Update branch that is not linked to any builds yet, that only developers are testing with a development build.

<ImageSpotlight alt={`Channel "production" linked to branch "version-1.0", channel "staging" linked to branch "version-2.0"`} src="/static/images/eas-update/custom-link-1.png" />

Once testers verify that the update on the "version-2.0" EAS Update branch is ready for production, we can update the "production" channel so that it's linked to the "version-2.0" branch. To accomplish this, we could run:

<Terminal cmd={['$ eas channel:edit production --branch version-2.0']} />

<ImageSpotlight alt={`Channel "production" linked to branch "version-2.0", channel "staging" linked to branch "version-2.0"`} src="/static/images/eas-update/custom-link-2.png" />

After this state, we'd be ready to start testing the "version-3.0" EAS Update branch. Similarly to the last step, we could link the "staging" channel to the "version-3.0" EAS Update branch with this command:

<Terminal cmd={['$ eas channel:edit staging --branch version-3.0']} />

<ImageSpotlight alt={`Channel "production" linked to branch "version-2.0", channel "staging" linked to branch "version-3.0"`} src="/static/images/eas-update/custom-link-3.png" />

## Practical overview

Now that we're familiar with the core concepts of EAS Update, let's talk about how this process occurs.

When an Expo project that includes `expo-updates` is built the included native Android and iOS code is responsible for managing, fetching, parsing, and validating updates.

When the library checks for updates and when it downloads them is [configurable](/versions/latest/config/app.md#updates). By default the library will check for an update when it is opened. If an update newer than the current running update is found, it will download and run the newer update. If the library does not find a newer update, it will instead run the newest downloaded update, falling back to the update that was embedded inside the app at build time if none have been downloaded.

`expo-updates` downloads updates in two phases. First, it downloads the most recent update _manifest_, which contains information about the update including a list of assets (images, JavaScript bundles, font files, etc...) that are required to run the update.
Second, the library downloads the assets specified in the manifest that is has not yet downloaded from prior updates. For instance, if an update contains a new image, the library will download the new image asset before running the update. To help end-users get updates quickly and reliably, updates should be kept as small as possible.

If the library is able to download the manifest (phase 1) and all the required assets (phase 2) before the `fallbackToCacheTimeout` setting, then the new update will run immediately upon launch. If the library is not able to fetch the manifest and assets within `fallbackToCacheTimeout`, it will continue to download the new update in the background and will run it upon the next launch.

<ImageSpotlight alt="Update download timeline" src="/static/images/eas-update/process.png" />

## Wrap up

With EAS Update, we can quickly deliver small, critical bug fixes to our users and give users the best experience possible. This is set up with a build's runtime version, platform, and channel. With these three constraints, we can make an update available to a specific group of builds. This allows us to test our changes before going to production within a deployment process.
Depending on how we set up our deployment process, we can optimize for speed. We can also optimize our deployments to be as safe a bug-free as possible. The deployment possibilities are vast and can match nearly any release process you prefer.
