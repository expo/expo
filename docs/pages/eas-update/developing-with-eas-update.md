---
title: Developing with EAS Update
---

import ImageSpotlight from '~/components/plugins/ImageSpotlight'

EAS Update can help us fix critical bugs in production. It can also help us iterate faster with our team.

## Developing locally

When developing locally, `npx expo start` will start a server that serves a manifest and assets to Expo Go and development builds. Locally, those builds look for a local manifest, and when there’s an update, they’ll download any missing local assets. To accomplish this, Expo Go/development builds use a protocol. That protocol is either a classic version of the updates protocol (used with Classic Updates), or the modern version of the [updates protocol](/technical-specs/expo-updates-0) (used with EAS Update).

We want to make sure that our locally developed app is using the same protocol locally as it does when we build our app.

When we run `npx expo start`, Expo CLI will automatically detect if our app is using EAS Update by looking at the `expo.updates.url` property in **app.json**. If the value of `url` starts with `https://u.expo.dev`, we will serve the modern manifest protocol. If there is no `url`, then we default to serving the classic version of the updates protocol.

To ensure that we’re using the modern version of the updates protocol, make sure to run `eas update:configure`, then `npx expo install expo-updates` before creating development builds. Running both of these commands should set up our local development environment to use the modern manifest protocol.

## Developing with other developers

When we finish a feature or bug fix, it’s convenient to allow other developers to preview a published update for reviewing purposes. One problem with previewing a new feature is that we have to rebuild the project into an app and distribute it to a reviewer. That process takes time and requires bookkeeping of builds and features.

Previewing features with EAS Update can help us preview new features in minutes.

The process flows like this:

- A developer runs `eas device:create`, then has all teammates/reviewers register their devices.
- Once complete, they create a build suitable for internal distribution. After running `eas build:configure`, the command to generate this build would be `eas build --profile preview`.
- Once the build is complete, all teammates/reviewers should download the internal distribution app.
- Then, a developer makes a change to a project. For this example, let’s imagine the developer is on a branch named `typo-fix` and the change fixes a typo within the app.
- The developer then runs `eas update --auto`. This will publish an update to a branch named `typo-fix`, which is linked by default to a channel named `typo-fix`.
- Then, the developer can create a URL that will open the previously created internal distribution app. They can either send that link to their teammates/reviewers, or they can create a QR code that teammates/reviewers may scan. To help with this last part, developers can navigate to their public project page and see the following UI to configure the correct URL for previewing a published EAS Update:

<ImageSpotlight alt="Preview EAS Update QR Code configuration" src="/static/images/eas-update/qr-preview.png" style={{ maxHeight: "700px", width: "auto" }} />

[Learn more](/eas-update/expo-dev-client) on using EAS Update with development builds.

## Future features

EAS Update is still in “preview”. We are still working on features to make developing with your team easier. They include:

#### Previewing updates with Expo Go

Expo Go does not support the modern manifest protocol needed to load updates published with EAS Update. We expect to support this with a new version of Expo Go released along with Expo SDK 45.

#### Generating QR codes with GitHub Actions and comments

We plan to add support for commenting valid QR codes on PRs with `expo-github-action` in the future.
