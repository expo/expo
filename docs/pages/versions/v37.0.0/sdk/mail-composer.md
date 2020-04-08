---
title: MailComposer
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-36/packages/expo-mail-composer'
---

import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';
import Video from '../../../../components/plugins/Video'

**`expo-mail-composer`** allows you to compose and send mail quickly and easily using the OS UI. This module can't be used on iOS Simulators since you can't sign into a mail account on them.

<Video file={"sdk/mailcomposer.mp4"} loop={false} />

<PlatformsSection android emulator ios web />

## Installation

<InstallSection packageName="expo-mail-composer" />

## API

```js
import * as MailComposer from 'expo-mail-composer';
```

## Methods

### `MailComposer.composeAsync(options)`

Opens a mail modal for iOS and a mail app intent for Android and fills the fields with provided data. On iOS you will need to be signed into the Mail app.

#### Arguments

- **saveOptions (_object_)** -- A map defining the data to fill the mail:
  - **recipients (_array_)** -- An array of e-mail addressess of the recipients.
  - **ccRecipients (_array_)** -- An array of e-mail addressess of the CC recipients.
  - **bccRecipients (_array_)** -- An array of e-mail addressess of the BCC recipients.
  - **subject (_string_)** -- Subject of the mail.
  - **body (_string_)** -- Body of the mail.
  - **isHtml (_boolean_)** -- Whether the body contains HTML tags so it could be formatted properly. Not working perfectly on Android.
  - **attachments (_array_)** -- An array of app's internal file uris to attach.

#### Returns

Resolves to a promise with object containing `status` field that could be either `sent`, `saved` or `cancelled`. Android does not provide such info so it always resolves to `sent`.
