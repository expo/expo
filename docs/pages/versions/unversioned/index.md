---
title: API Reference
hideTOC: true
---

import VersionedRedirectNotification from '~/components/plugins/VersionedRedirectNotification';
import { Terminal } from '~/ui/components/Snippet';
import { BoxLink } from '~/ui/components/BoxLink';
import { InlineCode } from '~/components/base/code';

<VersionedRedirectNotification />

The Expo SDK provides access to device and system functionality such as contacts, camera, gyroscope, GPS location, etc., in the form of packages. You can install any Expo SDK package using the `npx expo install` command. For example, three different packages are installed using the following command:

<Terminal cmd={['$ npx expo install expo-camera expo-contacts expo-sensors']} />

After installing one or more packages, you can import them into your JavaScript code:

```javascript
import { Camera } from 'expo-camera';
import * as Contacts from 'expo-contacts';
import { Gyroscope } from 'expo-sensors';
```

This allows you to write [`Contacts.getContactsAsync()`](sdk/contacts#contactsgetcontactsasynccontactquery) and read the contacts from the device, read the gyroscope sensor to detect device movement, or start the phone's camera and take photos.

## These packages work in bare React Native apps too

The easiest way to create a bare React Native app with support for the Expo SDK is by running the command:

<Terminal cmd={[
'# Create a project named my-app',
'$ npx create-expo-app my-app --template bare-minimum',
]} cmdCopy="npx create-expo-app my-app --template bare-minimum" />

<BoxLink title="Existing apps" href="/bare/installing-expo-modules" description={<>Projects that were created with <InlineCode>npx react-native init</InlineCode> require additional setup to use the Expo SDK.</>} />

<BoxLink title="Using libraries" description="Learn how to install Expo SDK packages in your project." href="/workflow/using-libraries" />

## Each Expo SDK version depends on a React Native version

Every quarter there is a new Expo SDK release that typically updates to the latest stable version of React Native and includes a variety of bug fixes, features, and improvements to the Expo SDK.

| Expo SDK Version | React Native Version |
| ---------------- | -------------------- |
| 46.0.0           | 0.69.5               |
| 45.0.0           | 0.68.2               |
| 44.0.0           | 0.64.3               |
| 43.0.0           | 0.64.3               |

### Support for other React Native versions

Packages in the Expo SDK are intended to support the target React Native version for that SDK. Typically, they will not support older versions of React Native, but they may. When a new version of React Native is released, the latest versions of the Expo SDK packages are typically updated to support it. However, this may take weeks or more, depending on the extent of the changes in the release.
