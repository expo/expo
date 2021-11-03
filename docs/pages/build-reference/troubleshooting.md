---
title: Troubleshooting build errors and crashes
---

When something goes wrong, it probably will go wrong in one of two ways: 1) your build will fail, or 2) the build will succeed but encounter a runtime error, eg: it crashes or hangs when you run it.

All standard advice around [narrowing down the source of an error](https://expo.fyi/manual-debugging) applies here; this document provides information that may be useful on top of your typical troubleshooting processes and techniques.

## Build errors

If your project builds locally in release mode, it should also build on EAS Build -- provided that:

- Relevant Build tool versions (eg: Xcode, Node, npm, Yarn) are the same in both environments.
- Relevant environment variables are the same in both environments.
- The archive that is uploaded to EAS Build includes the same relevant source files.

### Verify that your project builds locally

You can verify that your project builds on your local machine with `expo run:android --variant release` or `expo run:ios --configuration Release`. Note that it's important that we're using the release variant/configuration with these commands because there are meaningful differences between debug and release builds.

**These commands require that native toolchains for the respective platforms are installed and configured correctly**, which may not be the case if you are building a [managed project](/introduction/managed-vs-bare.md). [Learn more about setting up your development environment on reactnative.dev](https://reactnative.dev/docs/environment-setup).

<details><summary><h4>💡 Managed workflow: Are unable to install native toolchains on your machine? Or prefer to avoid it?</h4></summary>
<p>

**If you do not have native toolchains installed locally**, for example because you do not have an Apple computer and therefore cannot build an iOS app on your machine, it can be trickier to 

</p>
</details>

In managed projects, these commands will run `expo prebuild` to generate native projects &mdash; you likely want to [clean up the changes](https://expo.fyi/prebuild-cleanup) once you are done troubleshooting.

If your native toolchains are installed correctly and you are unable to build and run your project in release mode on your local machine, it will not build on EAS Build. Fix the issues locally, then try again on EAS Build. The other advice in this doc may be useful to help you resolve the issue locally, but often this requires some knowledge of native tooling or judicious application of Google, StackOverflow, and GitHub Issues.

### Native build errors


### JavaScript build errors

The most common types of build errors are:

- JavaScript app fails to build.
- 

## Runtime errors


## Still not working?

