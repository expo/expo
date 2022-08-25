---
title: DocumentPicker
sourceCodeUrl: 'https://github.com/expo/expo/tree/main/packages/expo-document-picker'
packageName: 'expo-document-picker'
---

import APISection from '~/components/plugins/APISection';
import {APIInstallSection} from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';
import Video from '~/components/plugins/Video'

Provides access to the system's UI for selecting documents from the available providers on the user's device.

<Video file={"sdk/documentpicker.mp4"} loop={false} />

<PlatformsSection android emulator ios simulator web />

## Installation

<APIInstallSection />

## Configuration

### Using Expo Prebuild

- Set the `expo.ios.usesIcloudStorage` key to `true` in your **app.json** as specified [configuration properties](/versions/latest/config/app/#usesicloudstorage).
- Build with `eas build -p ios`.

For iOS, if you build your app without the `ios/` directory, then EAS Build will automatically run `npx expo prebuild` to configure the entitlements and enable [iCloud Services][icloud-entitlement] using the [iOS capabilities signing](/build-reference/ios-capabilities) feature.

If you're **not using EAS Build**, you can enable the entitlement for your bundle identifier manually:

- This can be done in the detail of your [App ID in the Apple Developer interface](https://developer.apple.com/account/resources/identifiers/list).
- Enable iCloud service with CloudKit support, and create an iCloud Container. When registering the new Container, you are asked to provide a description and identifier for the container. You may enter any name under the description. Under the identifier, add `iCloud.<your_bundle_identifier>`.

### Manual setup

> Follow this guide if your project is **not** using [Expo Prebuild](/workflow/prebuild) to continuously generate the native `ios` and `android` directories.

For iOS projects, the `DocumentPicker` module requires the [iCloud entitlement][icloud-entitlement] to work properly.

1. Open the `ios/` directory in Xcode with `xed ios`. If you don't have an `ios/` directory, run `npx expo prebuild -p ios` to generate one.
2. Then follow [this guide][apple-enable-capability] to enable the "iCloud" capability.
3. Ensure you toggle the `iCloud Documents` checkbox on.

[apple-enable-capability]: https://help.apple.com/xcode/mac/current/#/dev88ff319e7
[icloud-entitlement]: https://developer.apple.com/documentation/bundleresources/entitlements/com_apple_developer_icloud-services

## API

```js
import * as DocumentPicker from 'expo-document-picker';
```

<APISection packageName="expo-document-picker" apiName="DocumentPicker" />
