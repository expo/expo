---
title: Migrating from ExpoKit
---

Historically when you have run `expo eject`, you'd end up with an [ExpoKit](../../expokit/overview) project. ExpoKit is a large library that includes the entire Expo SDK, and it leaves you in this place where you're not quite writing a vanilla React Native project and you're not quite using the Expo managed workflow. At Expo we decided to move away from the ExpoKit architecture towards the "bare workflow" model, where your project is a "bare" or "vanilla" React Native project with only the pieces of the Expo SDK that you need for your project, no more. We will continue to support ExpoKit until the bare workflow has no limitations relative to ExpoKit, but we aren't quite there yet.

## Current limitations

The primary limitation that you will face when migrating from ExpoKit to the bare workflow is that the ["Over the Air Updates" APIs](../../guides/configuring-ota-updates/) are not yet supported on bare projects. This is a work in progress, and we plan to make these APIs available soon. If this isn't a limiting factor for you to migrate away from ExpoKit to the bare workflow, then continue on. Otherwise, keep an eye on the [Expo blog](https://blog.expo.io/) for updates.

## Migrating your project to a bare workflow project

Depending on the size of your project and your level of experience this may take a few hours or more to complete.

We wish we could tell you that this is as easy as running one command, but due to the fact that when you are using ExpoKit you can customize your app in any way that you like, it's not feasible to build an automated tool to handle the migration.

The cleanest way to migrate your project is to initialize a new project with the bare workflow template and slowly migrate your existing project over. The rough process would go something like this:

- Ensure you have updated your existing project to the same React Native version that is used by the latest version of the Expo SDK and that your existing project is running as expected with all tests passing.
- Copy your assets and JS/TS source files to your new project.
- Copy the dependencies from your package.json to your new project, install and configure them.
- Ensure your JS tests pass.
- Copy custom native code (if any) to your new project.
- Copy and configure native assets (splash screens, icons).
- Compare configuration files like `Info.plist` and `AndroidManifest.xml` between projects, update the new project as necessary.
