---
title: MailComposer
---

import withDocumentationElements from '~/components/page-higher-order/withDocumentationElements';

export default withDocumentationElements(meta);

An API to compose mails using OS specific UI.

### `Expo.MailComposer.composeAsync(options)`

Opens a mail modal for iOS and a mail app intent for Android and fills the fields with provided data. 

#### Arguments

-  **saveOptions : `object`** -- A map defining the data to fill the mail:
    -   **recipients : `array`** -- An array of e-mail addressess of the recipients.
    -   **ccRecipients (_array_** -- An array of e-mail addressess of the CC recipients.
    -   **bccRecipients : `array`** -- An array of e-mail addressess of the BCC recipients.
    -   **subject : `string`** -- Subject of the mail.
    -   **body : `string`** -- Body of the mail.
    -   **isHtml : `boolean`** -- Whether the body contains HTML tags so it could be formatted properly. Not working perfectly on Android.
    -   **attachments : `array`** -- An array of app's internal file uris to attach.

#### Returns

Resolves to a promise with object containing `status` field that could be either `sent`, `saved` or `cancelled`. Android does not provide such info so it always resolves to `sent`.
