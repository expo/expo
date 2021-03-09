## Table of contents

### Enumerations

- [MailComposerStatus](./enums/mailcomposerstatus.md)

## Type aliases

### MailComposerOptions

Ƭ **MailComposerOptions**: *object*

A map defining the data to fill the mail.

#### Type declaration:

Name | Type | Description |
:------ | :------ | :------ |
`attachments`? | *string*[] | An array of app's internal file uris to attach.   |
`bccRecipients`? | *string*[] | An array of e-mail addresses of the BCC recipients.   |
`body`? | *string* | Body of the mail.   |
`ccRecipients`? | *string*[] | An array of e-mail addresses of the CC recipients.   |
`isHtml`? | *boolean* | Whether the body contains HTML tags so it could be formatted properly. Not working perfectly on Android.   |
`recipients`? | *string*[] | An array of e-mail addresses of the recipients.   |
`subject`? | *string* | Subject of the mail.   |

___

### MailComposerResult

Ƭ **MailComposerResult**: *object*

#### Type declaration:

Name | Type |
:------ | :------ |
`status` | [*MailComposerStatus*](./enums/mailcomposerstatus.md) |

## Functions

### composeAsync

▸ **composeAsync**(`options`: [*MailComposerOptions*](./MailComposer.md#mailcomposeroptions)): *Promise*<[*MailComposerResult*](./MailComposer.md#mailcomposerresult)\>

Opens a mail modal for iOS and a mail app intent for Android and fills the fields with provided data. On iOS you will need to be signed into the Mail app.

#### Parameters:

Name | Type |
:------ | :------ |
`options` | [*MailComposerOptions*](./MailComposer.md#mailcomposeroptions) |

**Returns:** *Promise*<[*MailComposerResult*](./MailComposer.md#mailcomposerresult)\>

Resolves to a promise with object containing status field that could be either sent, saved or cancelled. Android does not provide such info so it always resolves to sent.

___

### isAvailableAsync

▸ **isAvailableAsync**(): *Promise*<boolean\>

Determine if the `MailComposer` API can be used in this app.

**Returns:** *Promise*<boolean\>

A promise resolves to `true` if the API can be used, and `false` otherwise.
- Returns `true` on iOS when the device has a default email setup for sending mail.
- Can return `false` on iOS if an MDM profile is setup to block outgoing mail. If this is the case, you may want to use the Linking API instead.
- Always returns `true` in the browser and on Android.
