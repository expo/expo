---
title: API Reference
hideTOC: true
---

import VersionedRedirectNotification from '~/components/plugins/VersionedRedirectNotification';
import { Terminal } from '~/ui/components/Snippet';

<VersionedRedirectNotification />

The Expo SDK provides access to device and system functionality such as contacts, camera, and GPS location. You install modules from the Expo SDK using `expo-cli` with the `expo install` command:

<Terminal cmd={['$ expo install expo-camera expo-contacts expo-sensors']} cmdCopy="expo install expo-camera expo-contacts expo-sensors" />

<br />

You can import modules from it in your JavaScript code as follows:

```javascript
import { Camera } from 'expo-camera';
import * as Contacts from 'expo-contacts';
import { Gyroscope } from 'expo-sensors';
```

This allows you to write [`Contacts.getContactsAsync()`](sdk/contacts.md#contactsgetcontactsasynccontactquery) and read the contacts from the device, read the gyroscope sensor to detect device movement, or render a Camera view and take photos.

## These packages work in bare React Native apps too

The easiest way to create a bare React Native app with support for the Expo SDK is `npx create-react-native-app myapp`. If you have an existing app that you would like to add Expo SDK packages to, read about [integrating into existing apps](../../bare/existing-apps.md).

## Each Expo SDK version depends on a React Native version

Every quarter there is a new Expo SDK release that typically updates to the latest stable version of React Native and includes a variety of bugfixes, features and improvements to the Expo SDK.

| Expo SDK Version | React Native Version |
| ---------------- | :------------------: |
| 44.0.0           |        0.64.3        |
| 43.0.0           |        0.64.3        |
| 42.0.0           |        0.63.3        |
| 41.0.0           |        0.63.3        |
| 40.0.0           |        0.63.3        |

### Support for other React Native versions

Packages in the Expo SDK are intended to support the target React Native version for that SDK. Typically, they will not support older versions of React Native, but they may. When a new version of React Native is released, the latest versions of the Expo SDK packages are typically updated to support it; however, this may take weeks or more, depending on the extent of the changes in the release.