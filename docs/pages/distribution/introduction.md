---
title: Overview
---

import { Terminal } from '~/ui/components/Snippet';

Get your app into the hands of users by [submitting it to the app stores](/distribution/uploading-apps) or with [Internal Distribution](/build/internal-distribution).

<Terminal cmd={[
'# Install the CLI',
'$ npm i -g eas-cli',
'',
'# Build and submit your app!',
'$ eas build --auto-submit'
'',
'# OR -- Submit existing binaries',
'$ eas submit'
]} cmdCopy="npm i -g eas-cli && eas build --auto-submit" />

You can run `eas build --auto-submit` with [EAS CLI](/eas/index) to build your app and automatically upload the binary for distribution on the Apple App Store and Google Play Store.

This automatically manages **all native code signing** for iOS and Android for any React Native app. Advanced features like payments, notifications, universal links, and iCloud can be automatically enabled based on your [config plugins](/guides/config-plugins.md) or native entitlements, meaning no more wrestling with slow portals to get libraries set up correctly.

EAS builds and submits from a remote device meaning you can kick off from any device. [Get started now](/distribution/uploading-apps)!

> Have company policies or restrictions preventing you from using third-party services? EAS Build can be run [locally or on your own infrastructure](/build-reference/local-builds/)!
