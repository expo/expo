---
title: SMS
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-38/packages/expo-sms'
---

import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';

**`expo-sms`** provides access to the system's UI/app for sending SMS messages.

<PlatformsSection android emulator ios simulator />

## Installation

<InstallSection packageName="expo-sms" />

## API

```js
import * as SMS from 'expo-sms';
```

### `SMS.isAvailableAsync()`

Determines whether SMS is available.

#### Returns

Returns a promise that resolves to a `Boolean`, indicating whether SMS is available on this device.

#### Example

```javascript
const isAvailable = await SMS.isAvailableAsync();
if (isAvailable) {
  // do your SMS stuff here
} else {
  // misfortune... there's no SMS available on this device
}
```

### `SMS.sendSMSAsync(addresses, message)`

Opens the default UI/app for sending SMS messages with prefilled addresses and message.

#### Arguments

- **addresses (_Array\<string\>|string_)** -- An array of addresses (_phone numbers_) or single address passed as strings. Those would appear as recipients of the prepared message.

- **message (_string_)** -- Message to be sent.

- **options (_optional_) (_object_)** -- A map defining additional sms configuration options

  - **attachments (_optional_) (_Array<\object_\>|_object_)** -- An array of [SMSAttachment](#smsattachment) objects or single object. Android supports only one attachment.

#### Returns

Returns a `Promise` that resolves when the SMS action is invoked by the user, with corresponding result:

- If the user cancelled the SMS sending process: `{ result: 'cancelled' }`.
- If the user has sent/scheduled message for sending: `{ result: 'sent' }`.
- If the status of the SMS message cannot be determined: `{ result: 'unknown' }`.

Android does not provide information about the status of the SMS message, so on Android devices the `Promise` will always resolve with `{ result: 'unknown' }`.

**_Note_**: The only feedback collected by this module is whether any message has been sent. That means we do not check actual content of message nor recipients list.

#### Example

```javascript
const { result } = await SMS.sendSMSAsync(
  ['0123456789', '9876543210'],
  'My sample HelloWorld message',
  (attachments: {
    uri: 'path/myfile.png',
    mimeType: 'image/png',
    filename: 'myfile.png',
  })
);
```

## Related types

### SMSAttachment

An object that is used to describe an attachment that is included with a SMS message.

- **uri (_string_)** -- the content URI of the attachment. The URI needs be a content URI so that it can be accessed by other applications outside of Expo. (See [FileSystem.getContentUriAsync](filesystem.md#filesystemgetcontenturiasyncfileuri))
- **mimeType (_string_)** -- the mime type of the attachment such as `image/png`
- **filename (_string_)** -- the filename of the attachment
