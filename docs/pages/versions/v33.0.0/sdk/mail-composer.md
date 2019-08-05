---
title: MailComposer
---

An API to compose mails using OS specific UI.

## Installation

For [managed](../../introduction/managed-vs-bare/#managed-workflow) apps, you'll need to run `expo install expo-mail-composer`. To use it in a [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, follow its [installation instructions](https://github.com/expo/expo/tree/master/packages/expo-mail-composer).

## API

```js
import * as MailComposer from 'expo-mail-composer';
```

### `MailComposer.composeAsync(options)`

Opens a mail modal for iOS and a mail app intent for Android and fills the fields with provided data.

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
