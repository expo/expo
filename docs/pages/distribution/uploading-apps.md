---
title: Uploading to the Apple App Store and Google Play
---

import { ConfigClassic } from '~/components/plugins/ConfigSection';
import { Terminal } from '~/ui/components/Snippet';

After you've [created a native binary](/build/setup), you can use [EAS Submit][eas-submit] to upload binaries for both app stores from _any_ computer.

- [Submit to the Apple App Store](/submit/ios).
- [Submit to the Google Play Store](/submit/android).

Afterward, you can use [EAS Metadata](/eas-metadata/introduction) to configure the App Store presence.

## Manual submissions

### Android

The first Android submission must be done manually regardless of if you're using [EAS Submit][eas-submit]. See [manual Android submission](https://expo.fyi/first-android-submission) to learn more.

### Apple

Manual Apple App Store submissions can only be performed on macOS devices. If you don't have access to a macOS device, use [EAS Submit][eas-submit].

#### Creating an entry on App Store Connect

Start by creating an app profile in App Store Connect, if you haven't already:

1. Go to [App Store Connect][asc] and sign in. Make sure you've accepted any legal notices or terms at the top of the page.
2. Click the blue plus button by the Apps header, then click **New App**.
3. Add your app's name, language, bundle identifier, and SKU (this isn't seen by end users, it can be any unique string. A common choice is your app's bundle identifier, e.g. "com.company.my-app").
4. Click **Create**. If this succeeds, then you've created your application record.

#### Uploading with Transporter

Finally, you need to upload the IPA to the Apple App Store.

1. Download [**Transporter** from the App Store](https://apps.apple.com/app/transporter/id1450874784).
2. Sign in with your Apple ID.
3. Add the build either by dragging the IPA file directly into the Transporter window or by selecting it from the file dialog opened with **+** or **Add App** button.
4. Submit it by clicking the **Deliver** button.

This process can take a few minutes, then another 10-15 minutes of processing on Apple's servers. Afterward, you can check the status of your binary in [App Store Connect][asc]:

1. Visit [App Store Connect][asc], select **My Apps**, and click on the app entry you created earlier.
2. Scroll down to the **Build** section and select your newly uploaded binary.

[asc]: https://appstoreconnect.apple.com/apps
[eas-submit]: /submit/introduction.md
