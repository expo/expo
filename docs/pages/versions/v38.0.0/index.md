---
title: API Reference
hideTOC: true
---

import VersionedRedirectNotification from '~/components/plugins/VersionedRedirectNotification';
import TerminalBlock from '~/components/plugins/TerminalBlock';

<VersionedRedirectNotification />

The Expo SDK provides access to device and system functionality such as contacts, camera, and GPS location. You install modules from the Expo SDK using `expo-cli` with the `expo install` command:

<TerminalBlock cmd={['expo install expo-camera expo-contacts expo-sensors']} />

<br />

You can import modules from it in your JavaScript code as follows:

```javascript
import { Camera } from 'expo-camera';
import * as Contacts from 'expo-contacts';
import { Gyroscope } from 'expo-sensors';
```

This allows you to write [`Contacts.getContactsAsync()`](sdk/contacts.md#getcontactsasync) and read the contacts from the device, read the gyroscope sensor to detect device movement, or render a Camera view and take photos.

## These packages work in bare React Native apps too

The easiest way to create a bare React Native app with support for the Expo SDK is `npx create-react-native-app myapp`. If you have an existing app that you would like to add Expo SDK packages to, read about [integrating into existing apps](../../bare/existing-apps.md).

## Each Expo SDK version depends on a React Native version

Every quarter there is a new Expo SDK release that typically updates to the latest stable version of React Native and includes a variety of bugfixes, features and improvements to the Expo SDK. It's often useful to know what version of React Native your Expo project is running on, so the following table maps Expo SDK versions to their included React Native version.

| Expo SDK Version | React Native Version |
| ---------------- | :------------------: |
| 38.0.0           |        0.62.2        |
| 37.0.0           |        0.61.4        |
| 36.0.0           |        0.61.4        |
| 35.0.0           |        0.59.8        |
| 34.0.0           |        0.59.8        |
| 33.0.0           |        0.59.8        |
