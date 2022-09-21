---
title: InAppPurchases
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-44/packages/expo-in-app-purchases'
packageName: 'expo-in-app-purchases'
---

import {APIInstallSection} from '~/components/plugins/InstallSection';
import APISection from '~/components/plugins/APISection';
import PlatformsSection from '~/components/plugins/PlatformsSection';

**`expo-in-app-purchases`** provides an API to accept payments for in-app products. Internally this relies on the [Google Play Billing](https://developer.android.com/google/play/billing/billing_library_overview) library on Android and the [Storekit](https://developer.apple.com/documentation/storekit?language=objc) framework on iOS.

<PlatformsSection android ios />

## Installation

<APIInstallSection hideBareInstructions cmd={['$ npm install expo-in-app-purchases']} />

This module is currently only available in the [bare](/introduction/managed-vs-bare.md#bare-workflow) workflow.

You must ensure that you have [installed and configured Expo modules](/bare/installing-expo-modules.md) before continuing.

### Configure for iOS

Run `npx pod-install` after installing the npm package.

### Configure for Android

No additional set up necessary.

## Setup

### iOS

In order to use the In-App Purchases API on iOS, you’ll need to sign the [Paid Applications Agreement](https://help.apple.com/app-store-connect/#/devb6df5ee51) and set up your banking and tax information. You also need to enable the [In-App Purchases capability](https://help.apple.com/xcode/mac/current/#/dev88ff319e7) for your app in Xcode.

Next, create an entry for your app in [App Store Connect](https://appstoreconnect.apple.com/) and configure your in-app purchases, including details (such as name, pricing, and description) that highlight the features and functionality of your in-app products. Make sure each product's status says `Ready to Submit`, otherwise it will not be queryable from within your app when you are testing. Be sure to add any necessary metadata to do so including uploading a screenshot (this can be anything when you're testing) and review notes. Your app's status must also say `Ready to Submit` but you do not need to actually submit your app or its products for review to test purchases in sandbox mode.

Now you can create a [sandbox account](https://help.apple.com/app-store-connect/#/dev8b997bee1) to test in-app purchases before you make your app available.

For more information, see Apple's workflow for configuring In-App Purchases [here](https://help.apple.com/app-store-connect/#/devb57be10e7).

### Android

On Android, you must first create an entry for your app and upload a release APK in the [Google Play Console](https://developer.android.com/distribute/console/). From there, you can configure your in-app purchases and their details under `Store Presence > In-app products`.

Then to test your purchases, you must publish your app to a closed or open testing track in Google Play. Note that it may take a few hours for the app to be available for testers. Ensure the testers you invite (including yourself) opt in to your app's test. On your test’s opt-in URL, your testers will get an explanation of what it means to be a tester and a link to opt-in. At this point, they're all set and can start making purchases once they download your app or build from source. For more information on testing, follow [these instructions](https://developer.android.com/google/play/billing/billing_testing).

> Note that in-app purchases require physical devices to work on both platforms and therefore **cannot be tested on simulators**.

## API

```js
import * as InAppPurchases from 'expo-in-app-purchases';
```

<APISection packageName="expo-in-app-purchases" apiName="InAppPurchases" />
