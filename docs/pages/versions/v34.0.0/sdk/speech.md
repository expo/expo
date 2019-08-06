---
title: Speech
---

import SnackEmbed from '~/components/plugins/SnackEmbed';

This module allows using Text-to-speech utility.

## Installation

For [managed](../../introduction/managed-vs-bare/#managed-workflow) apps, you'll need to run `expo install expo-speech`. To use it in a [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, follow its [installation instructions](https://github.com/expo/expo/tree/master/packages/expo-speech).

> **Note**: Not compatible with web.

## Usage

<SnackEmbed snackId="@charliecruzan/speechexample" />

## API

```js
import * as Speech from 'expo-speech';
```

### `Speech.speak(text, options)`

Speak out loud the `text` given `options`. Calling this when another text is being spoken adds an utterance to queue.

#### Arguments

- **text (_string_)** -- The text to be spoken.
- **options (_object_)** --

  A map of options:

  - **voice (_string_)** -- Voice identifier (**iOS only**)
  - **language (_string_)** -- The code of a language that should be used to read the `text`, check out IETF BCP 47 to see valid codes.
  - **pitch (_number_)** -- Pitch of the voice to speak `text`. 1.0 is the normal pitch.
  - **rate (_number_)** -- Rate of the voice to speak `text`. 1.0 is the normal rate.
  - **onStart (_function_)** -- A callback that is invoked when speaking starts.
  - **onDone (_function_)** -- A callback that is invoked when speaking finishes.
  - **onStopped (_function_)** -- A callback that is invoked when speaking is stopped by calling `Speech.stop()`.
  - **onError (_function_)** -- (Android only). A callback that is invoked when an error occurred while speaking.

### `Speech.stop()`

Interrupts current speech and deletes all in queue.

### `Speech.pause()`

Pauses current speech.

### `Speech.resume()`

Resumes speaking previously paused speech or does nothing if there's none.

### `Speech.isSpeakingAsync()`

Determine whether the Text-to-speech utility is currently speaking. Will return `true` if speaker is paused.

#### Returns

Returns a Promise that resolves to a boolean, `true` if speaking, `false` if not.

### `Speech.getAvailableVoicesAsync()` (iOS only)

Returns list of all available voices.

#### Returns

List of `Voice` objects.

##### `Voice`

|   Field    |           Type           |
| :--------: | :----------------------: |
| identifier |          string          |
|    name    |          string          |
|  quality   | enum Speech.VoiceQuality |
|  language  |          string          |

##### enum `Speech.VoiceQuality`

possible values: `Default` or `Enhanced`.
