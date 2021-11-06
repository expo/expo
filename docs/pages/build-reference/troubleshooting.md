---
title: Troubleshooting build errors and crashes
---

> This document is under active development; the topic it covers is expansive and finding the right way to explain how to troubleshoot issues will take some trial and error. Your suggestions for improvements are welcome as pull requests.

import TerminalBlock from '~/components/plugins/TerminalBlock';

When something goes wrong, it probably will go wrong in one of two ways: 1) your build will fail, or 2) the build will succeed but encounter a runtime error, eg: it crashes or hangs when you run it.

All standard advice around [narrowing down the source of an error](https://expo.fyi/manual-debugging) applies here; this document provides information that may be useful on top of your typical troubleshooting processes and techniques. Troubleshooting is an art, and you might need to think creatively.

<!-- todo: need to add explicit callout to monorepos here -->

## Find the related error logs

Before you go further, you need to be sure that you have located the error message and read it. How you do this will be different depending on whether you're investigating a build failure or runtime error.

### Runtime errors

Refer to the [debugging guide](/workflow/debugging.md#production-errors) to learn how to locate logs when your release builds are crashing at runtime.

### Build errors

Go to your build details page (find it on the [build dashboard](https://expo.dev/accounts/[account]/projects/[project]/builds) if you don't have it open already) and expand any failed build phases by clicking on them. Often, the earliest phase that errors will contain the most useful information, and the any susequent failed phases cascaded from the first.

Regardless of the phase, **it's common to see log entries prefixed with `[stderr]`, but keep in mind that this doesn't necessarily mean those logs point to errors**; it's common for CLI tools to use [stderr](<https://en.wikipedia.org/wiki/Standard_streams#Standard_error_(stderr)>) to output warnings and other diagnostics.

For example, you might see something like this on your Android builds:

<TerminalBlock cmd={[
`[stderr] Note: /build/workingdir/build/app/node_modules/@react-native-async-storage/async-storage/android/src/main/java/com/reactnativecommunity/asyncstorage/AsyncStorageModule.java uses or overrides a deprecated API.`,
`[stderr] Note: Recompile with -Xlint:deprecation for details.`
]} />

While you may or may not be interested in following up on that warning, it is not the cause of your failed build. So how do you know which logs are truly responsible? If you are building a bare project, you will already be good at this. If you are building a [managed project](/introduction/managed-vs-bare.md), it may be tricky because you don't directly interact with the native code, only write JavaScript.

A good path forward is to **determine if the build failed due to a native or JavaScript error**. When your build fails due to a JavaScript build error, you will usually see something like this:

<TerminalBlock cmd={[
`❌ Metro encountered an error:`,
`Unable to resolve module ./src/Routes from /Users/expo/workingdir/build/App.js`,
]} />

This particular error means that the app is importing `./src/Routes` and it is not found. The cause could that the filename case being different in Git than the developer's filesystem (eg: `routes.js` in Git instead of `Routes.js`), or maybe the project has a build step and it wasn't set up to run on EAS Build. In this case, it turns out that in this case `./src/Routes` was intended to import `./src/Routes/index.js`, but that path was accidentally excluded in the developer's `.gitignore`.

It's important to note that on iOS builds the build details page only displays an abridged version of the logs, because the full output from `xcodebuild` can be in the order of 10MB. Sometimes it's necessary to open the full Xcode logs in order to find the information that you need; for example, if the JavaScript build failed but you don't see any useful information on the build details page. To open the full Xcode logs, scroll to the bottom of the build details page when the build has completed and either click to view or download them.

<!-- TODO: native and js build phases should be separate in eas build logs, this is too much work -->

If you are working on a managed app and the build error is a native error rather than a JavaScript error, this is likely due to a [config plugin](/guides/config-plugins.md) or a dependency in your project. Keep an eye out in the logs for any new packages that you've added since your previous successful build. Run `expo doctor` to determine that the versions of Expo SDK dependencies in your project are compatible with your Expo SDK version.

Armed with your error logs, you can often start to fix your build, or you can search the [forums](https://forums.expo.dev) and GitHub issues for related packages to dig deeper.

## Verify that your project builds and runs locally

If the logs weren't enough to immediately help you understand and fix the root cause, it's time to try to reproduce the issue locally. If your project builds and runs locally in release mode then it will also build on EAS Build, provided that the following are all true:

- Relevant Build tool versions (eg: Xcode, Node, npm, Yarn) are the same in both environments. [Learn more](/build/eas-json.md#configuring-your-build-tools).
- Relevant environment variables are the same in both environments. [Learn more](/build-reference/variables.md).
- The archive that is uploaded to EAS Build includes the same relevant source files. [Learn more](https://github.com/expo/fyi/blob/master/eas-build-archive.md).

You can verify that your project builds on your local machine with the `expo run` commands with variant/configuration flags set to release to most faithfully reproduce what executes on EAS Build. (Learn more about the [iOS build process](/build-reference/ios-builds.md) and [Android build process](/build-reference/android-builds.md)).

<TerminalBlock cmd={['# Locally compile and run the Android app in release mode', 'expo run:android --variant release', '', '# Locally compile and run the iOS app in release mode', 'expo run:ios --configuration Release']} />

> In managed projects, these commands will run `expo prebuild` to generate native projects &mdash; you likely want to [clean up the changes](https://expo.fyi/prebuild-cleanup) once you are done troubleshooting.

<details><summary><h4>💡 Don't have Xcode and Android Studio set up on your machine?</h4></summary>
<p>

**If you do not have native toolchains installed locally**, for example because you do not have an Apple computer and therefore cannot build an iOS app on your machine, it can be trickier to get to the bottom of build errors. The feedback loop of making small changes locally and then seeing the result on EAS Build is slower than doing the same steps locally, because the EAS Build worker must set up its environment, download your project, and install dependencies before starting the build.

If you are willing and able to set up the appropriate native tools, then refer to the [React Native environment setup guide](https://reactnative.dev/docs/environment-setup).

</p>
</details>

If your native toolchains are installed correctly and you are unable to build and run your project in release mode on your local machine, it will not build on EAS Build. Fix the issues locally, then try again on EAS Build. The other advice in this doc may be useful to help you resolve the issue locally, but often this requires some knowledge of native tooling or judicious application of Google, StackOverflow, and GitHub Issues.

### What if my project builds locally but not on EAS Build?

If you find yourself in this situation, it's time to narrow down what configuration exists on your machine that hasn't been set up for your project on EAS Build yet.

Do a fresh `git clone` of your project to a new directory and get it running. Pay attention to each of the steps that are needed and verify that EAS Build is configured accordingly.

## Still having trouble?

This guide is far from being comprehensive, and depending on your level of experience you might still be struggling to get your app working.

If you have followed the advice here, you're now in a good position to describe your issue to other developers and get some help.

### How to ask a good question

Join us on [Discord](https://chat.expo.dev) or the [forums](https://forums.expo.dev) get help from the Expo team and the community. 

When you ask for troubleshooting help, be sure to share the following information:

- **A link to your build page**. This can only be accessed by your team or Expo employees. If you'd like to share it more publicly, take a screenshot. If you'd like to share it more privately, send an email to secure@expo.dev and mention that in your help request on chat or forums. If you are performing this build locally with `eas build --local`, you may omit this, but please indicate this fact.
- **Error logs**. Anything that you suspect may be related to your build or runtime error. If you can't provide this, please explain why not.
- **Minimal reproducible example or a link to your repository**. The quickest way to get a solution to your problem is to ensure that other developers can reproduce it. If you have ever worked on a team, you know this from experience. In many cases, if you can't provide a reproducible example then it may not be possible to help you, and at best the back-and-forth process of asking and answering questions will be an inefficient use of time. Learn more about how to create a reproducible example in the [manual debugging guide](https://expo.fyi/manual-debugging) and StackOverflow's ["Minimal Viable Reproducible Example" guide](https://stackoverflow.com/help/minimal-reproducible-example).

Try to be clear, precise, and helpful. General guidance provided by StackOverflow's ["How to ask a good question"](https://stackoverflow.com/help/how-to-ask) guide applies.